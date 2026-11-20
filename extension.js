const vscode = require("vscode");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const LIST_PROFILES = "antigravityAccountSwitcher.listProfiles";
const MAX_LEGACY_SLOTS = 5;

async function listProfiles() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const metadataPath = path.join(appData, "Antigravity", "Profiles", "profiles.json");

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      await vscode.window.showInformationMessage("No legacy Antigravity profiles are recorded.");
      return;
    }
    await vscode.window.showErrorMessage("Could not read the legacy Antigravity profile inventory.");
    return;
  }

  if (!Array.isArray(metadata?.slots)) {
    await vscode.window.showErrorMessage("The legacy Antigravity profile inventory has an invalid format.");
    return;
  }

  const profiles = new Map();
  for (const profile of metadata.slots) {
    const slot = profile?.slot;
    if (Number.isInteger(slot) && slot >= 1 && slot <= MAX_LEGACY_SLOTS) {
      profiles.set(slot, profile);
    }
  }

  const lines = [];
  for (let slot = 1; slot <= MAX_LEGACY_SLOTS; slot += 1) {
    const profile = profiles.get(slot);
    if (typeof profile?.name !== "string" || !profile.name.trim()) {
      continue;
    }

    const updatedAt = new Date(typeof profile.updatedAt === "string" ? profile.updatedAt : NaN);
    const updated = Number.isNaN(updatedAt.getTime()) ? "unknown" : updatedAt.toLocaleString();
    lines.push(`Slot ${slot}: ${profile.name} (updated ${updated})`);
  }

  if (!lines.length) {
    await vscode.window.showInformationMessage("No legacy Antigravity profiles are recorded.");
    return;
  }

  const document = await vscode.workspace.openTextDocument({
    content: lines.join("\n"),
    language: "text"
  });
  await vscode.window.showTextDocument(document, { preview: false });
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand(LIST_PROFILES, listProfiles));
}

module.exports = { activate };
