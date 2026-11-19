const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");

const PROFILE_COLORS = ["#4A90E2", "#28A745", "#F39C12", "#8E44AD", "#E84393"];
const MAX_PROFILES = 5;

function getProfilesRoot() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  return path.join(appData, "Antigravity", "Profiles");
}

function getMetadataPath() {
  return path.join(getProfilesRoot(), "profiles.json");
}

function ensureProfilesRoot() {
  fs.mkdirSync(getProfilesRoot(), { recursive: true });
}

function createEmptySlots(maxProfiles) {
  return Array.from({ length: maxProfiles }, (_, index) => ({
    slot: index + 1,
    name: "",
    folder: "",
    createdAt: "",
    updatedAt: ""
  }));
}

function normalizeMetadata(raw, maxProfiles) {
  const base = createEmptySlots(maxProfiles);
  if (!raw || !Array.isArray(raw.slots)) {
    return { slots: base };
  }

  for (const incoming of raw.slots) {
    if (!incoming || typeof incoming.slot !== "number") {
      continue;
    }
    if (incoming.slot < 1 || incoming.slot > maxProfiles) {
      continue;
    }
    base[incoming.slot - 1] = {
      slot: incoming.slot,
      name: incoming.name || "",
      folder: incoming.folder || "",
      createdAt: incoming.createdAt || "",
      updatedAt: incoming.updatedAt || ""
    };
  }

  return { slots: base };
}

function loadMetadata(maxProfiles) {
  ensureProfilesRoot();
  const metadataPath = getMetadataPath();
  if (!fs.existsSync(metadataPath)) {
    const initial = { slots: createEmptySlots(maxProfiles) };
    fs.writeFileSync(metadataPath, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const normalized = normalizeMetadata(parsed, maxProfiles);
    saveMetadata(normalized);
    return normalized;
  } catch (error) {
    const fallback = { slots: createEmptySlots(maxProfiles) };
    fs.writeFileSync(metadataPath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function saveMetadata(metadata) {
  ensureProfilesRoot();
  fs.writeFileSync(getMetadataPath(), JSON.stringify(metadata, null, 2), "utf8");
}

function sanitizeName(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "profile";
}

function shortenLabel(name) {
  return name.length > 10 ? `${name.slice(0, 9)}...` : name;
}

function execFile(command, args) {
  return new Promise((resolve, reject) => {
    cp.execFile(command, args, { windowsHide: true, maxBuffer: 1024 * 1024 * 4 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function runProfileManager(action, payload) {
  const scriptPath = path.join(__dirname, "scripts", "profile_manager.ps1");
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-Action",
    action,
    "-ProfilesRoot",
    getProfilesRoot(),
    "-Slot",
    String(payload.slot)
  ];

  if (payload.profileName) {
    args.push("-ProfileName", payload.profileName);
  }

  const result = await execFile("powershell.exe", args);
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(result.stdout || result.stderr || error.message);
  }
}

class ExtensionController {
  constructor(context) {
    this.context = context;
    this.maxProfiles = Math.min(
      MAX_PROFILES,
      vscode.workspace.getConfiguration("antigravityAccountSwitcher").get("maxProfiles", MAX_PROFILES)
    );
    this.metadata = loadMetadata(this.maxProfiles);
    this.profileItems = [];
  }

  initialize() {
    this.registerCommands();
    this.createStatusBarItems();
    this.refreshStatusBar();

    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("antigravityAccountSwitcher")) {
          this.maxProfiles = Math.min(
            MAX_PROFILES,
            vscode.workspace.getConfiguration("antigravityAccountSwitcher").get("maxProfiles", MAX_PROFILES)
          );
          this.metadata = normalizeMetadata(this.metadata, this.maxProfiles);
          saveMetadata(this.metadata);
          this.disposeStatusBarItems();
          this.createStatusBarItems();
          this.refreshStatusBar();
        }
      })
    );
  }

  registerCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand("antigravityAccountSwitcher.saveCurrentProfile", async () => {
        await this.saveCurrentProfile();
      }),
      vscode.commands.registerCommand("antigravityAccountSwitcher.switchProfile", async () => {
        await this.switchProfileFromPicker();
      }),
      vscode.commands.registerCommand("antigravityAccountSwitcher.switchProfileSlot", async (slot) => {
        await this.switchProfile(slot);
      }),
      vscode.commands.registerCommand("antigravityAccountSwitcher.deleteProfile", async () => {
        await this.deleteProfile();
      }),
      vscode.commands.registerCommand("antigravityAccountSwitcher.listProfiles", async () => {
        await this.listProfiles();
      })
    );
  }

  createStatusBarItems() {
    for (let index = 0; index < this.maxProfiles; index += 1) {
      const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000 - index);
      item.command = {
        command: "antigravityAccountSwitcher.switchProfileSlot",
        title: "Switch Profile",
        arguments: [index + 1]
      };
      this.profileItems.push(item);
      this.context.subscriptions.push(item);
    }

    this.saveItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 995);
    this.saveItem.text = "$(add) Save";
    this.saveItem.tooltip = "Save the current Antigravity session into a profile slot";
    this.saveItem.command = "antigravityAccountSwitcher.saveCurrentProfile";

    this.deleteItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 994);
    this.deleteItem.text = "$(trash) Delete";
    this.deleteItem.tooltip = "Delete a saved Antigravity profile";
    this.deleteItem.command = "antigravityAccountSwitcher.deleteProfile";

    this.context.subscriptions.push(this.saveItem, this.deleteItem);
    this.saveItem.show();
    this.deleteItem.show();
  }

  disposeStatusBarItems() {
    for (const item of this.profileItems) {
      item.dispose();
    }
    this.profileItems = [];
    if (this.saveItem) {
      this.saveItem.dispose();
    }
    if (this.deleteItem) {
      this.deleteItem.dispose();
    }
  }

  refreshStatusBar() {
    for (let index = 0; index < this.maxProfiles; index += 1) {
      const item = this.profileItems[index];
      const profile = this.metadata.slots[index];
      if (profile && profile.name) {
        item.text = `$(person) ${shortenLabel(profile.name)}`;
        item.color = PROFILE_COLORS[index];
        item.tooltip = `Switch to profile ${profile.slot}: ${profile.name}`;
      } else {
        item.text = `$(circle-large-outline) ${index + 1}`;
        item.color = "#7F8C8D";
        item.tooltip = `Empty profile slot ${index + 1}`;
      }
      item.show();
    }
  }

  async saveCurrentProfile() {
    const emptySlot = this.metadata.slots.find((slot) => !slot.name);
    let targetSlot = emptySlot ? emptySlot.slot : undefined;

    if (!targetSlot) {
      const picked = await vscode.window.showQuickPick(
        this.metadata.slots.map((slot) => ({
          label: `Slot ${slot.slot}`,
          description: slot.name,
          slot: slot.slot
        })),
        {
          placeHolder: "All 5 slots are full. Choose a slot to replace."
        }
      );
      if (!picked) {
        return;
      }
      targetSlot = picked.slot;
    }

    const suggestedName = this.metadata.slots[targetSlot - 1].name || `Profile ${targetSlot}`;
    const entered = await vscode.window.showInputBox({
      prompt: `Name for profile slot ${targetSlot}`,
      value: suggestedName,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!sanitizeName(value)) {
          return "Enter a profile name.";
        }
        return null;
      }
    });

    if (!entered) {
      return;
    }

    const profileName = sanitizeName(entered);
    const folder = `slot-${targetSlot}-${slugify(profileName)}`;

    const saveAction = "Save profile";
    const consent = await vscode.window.showWarningMessage(
      "Saved profiles can include authentication and session data. Save them only on an encrypted computer you control and never share the profile directory.",
      { modal: true },
      saveAction
    );
    if (consent !== saveAction) {
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Saving Antigravity profile "${profileName}"`,
          cancellable: false
        },
        async () => {
          const result = await runProfileManager("save", {
            slot: targetSlot,
            profileName,
            folder
          });

          if (!result.success) {
            throw new Error(result.message || "Profile save failed.");
          }
        }
      );
    } catch (error) {
      await vscode.window.showErrorMessage(`Failed to save profile: ${error.message}`);
      return;
    }

    const now = new Date().toISOString();
    const previous = this.metadata.slots[targetSlot - 1];
    this.metadata.slots[targetSlot - 1] = {
      slot: targetSlot,
      name: profileName,
      folder,
      createdAt: previous.createdAt || now,
      updatedAt: now
    };
    saveMetadata(this.metadata);
    this.refreshStatusBar();
    await vscode.window.showInformationMessage(`Saved profile "${profileName}" to slot ${targetSlot}.`);
  }

  async switchProfileFromPicker() {
    const profiles = this.metadata.slots.filter((slot) => slot.name);
    if (!profiles.length) {
      await vscode.window.showWarningMessage("No saved profiles yet. Use the + Save button first.");
      return;
    }

    const picked = await vscode.window.showQuickPick(
      profiles.map((slot) => ({
        label: slot.name,
        description: `Slot ${slot.slot}`,
        slot: slot.slot
      })),
      {
        placeHolder: "Choose a profile to switch to"
      }
    );

    if (picked) {
      await this.switchProfile(picked.slot);
    }
  }

  async switchProfile(slotNumber) {
    const profile = this.metadata.slots[slotNumber - 1];
    if (!profile || !profile.name) {
      await vscode.window.showWarningMessage(`Profile slot ${slotNumber} is empty.`);
      return;
    }

    const switchAction = "Switch profile";
    const consent = await vscode.window.showWarningMessage(
      `Switching replaces Antigravity's local session data with the saved profile "${profile.name}" and reloads the window. Save your work first.`,
      { modal: true },
      switchAction
    );
    if (consent !== switchAction) {
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Switching to "${profile.name}"`,
          cancellable: false
        },
        async () => {
          const result = await runProfileManager("switch", { slot: slotNumber });
          if (!result.success) {
            throw new Error(result.message || "Profile switch failed.");
          }
        }
      );

      await vscode.window.showInformationMessage(`Switched to "${profile.name}". Antigravity will reload now.`);
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    } catch (error) {
      await vscode.window.showErrorMessage(`Failed to switch profile: ${error.message}`);
    }
  }

  async deleteProfile() {
    const profiles = this.metadata.slots.filter((slot) => slot.name);
    if (!profiles.length) {
      await vscode.window.showInformationMessage("There are no saved profiles to delete.");
      return;
    }

    const picked = await vscode.window.showQuickPick(
      profiles.map((slot) => ({
        label: slot.name,
        description: `Slot ${slot.slot}`,
        slot: slot.slot
      })),
      {
        placeHolder: "Choose a profile to delete"
      }
    );

    if (!picked) {
      return;
    }

    const deleteAction = "Delete profile";
    const consent = await vscode.window.showWarningMessage(
      `Delete the saved profile "${picked.label}"? This permanently removes its local session data.`,
      { modal: true },
      deleteAction
    );
    if (consent !== deleteAction) {
      return;
    }

    try {
      const result = await runProfileManager("delete", { slot: picked.slot });
      if (!result.success) {
        throw new Error(result.message || "Profile delete failed.");
      }
      this.metadata.slots[picked.slot - 1] = {
        slot: picked.slot,
        name: "",
        folder: "",
        createdAt: "",
        updatedAt: ""
      };
      saveMetadata(this.metadata);
      this.refreshStatusBar();
      await vscode.window.showInformationMessage(`Deleted profile from slot ${picked.slot}.`);
    } catch (error) {
      await vscode.window.showErrorMessage(`Failed to delete profile: ${error.message}`);
    }
  }

  async listProfiles() {
    const profiles = this.metadata.slots.filter((slot) => slot.name);
    if (!profiles.length) {
      await vscode.window.showInformationMessage("No profiles saved yet.");
      return;
    }

    const lines = profiles.map((slot) => {
      const updated = slot.updatedAt ? new Date(slot.updatedAt).toLocaleString() : "unknown";
      return `Slot ${slot.slot}: ${slot.name} (updated ${updated})`;
    });

    const document = await vscode.workspace.openTextDocument({
      content: lines.join("\n"),
      language: "text"
    });
    await vscode.window.showTextDocument(document, { preview: false });
  }

}

function activate(context) {
  const controller = new ExtensionController(context);
  controller.initialize();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
