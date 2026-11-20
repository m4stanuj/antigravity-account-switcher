const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const manifest = require("../package.json");
const source = fs.readFileSync(path.join(__dirname, "..", "extension.js"), "utf8");
const listCommand = "antigravityAccountSwitcher.listProfiles";
const appData = path.join("synthetic", "app-data");

function activateExtension(readMetadata) {
  const commands = new Map();
  const messages = { information: [], errors: [], documents: [] };
  const vscode = {
    commands: {
      registerCommand(name, handler) {
        commands.set(name, handler);
        return { dispose() {} };
      }
    },
    window: {
      showInformationMessage: async (message) => messages.information.push(message),
      showErrorMessage: async (message) => messages.errors.push(message),
      showTextDocument: async (document) => messages.documents.push(document.content)
    },
    workspace: {
      openTextDocument: async (document) => document
    }
  };
  const modules = new Map([
    ["vscode", vscode],
    ["node:fs", { readFileSync: readMetadata }],
    ["node:os", {}],
    ["node:path", path]
  ]);
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    process: { env: { APPDATA: appData } },
    require(name) {
      assert.ok(modules.has(name), `Unexpected module ${name}`);
      return modules.get(name);
    }
  });
  module.exports.activate({ subscriptions: [] });
  assert.deepEqual([...commands.keys()], [listCommand]);
  return { showInventory: commands.get(listCommand), messages };
}

test("only the read-only inventory command is contributed and activation skips storage", () => {
  assert.deepEqual(manifest.contributes.commands.map(({ command }) => command), [listCommand]);
  assert.equal(manifest.activationEvents, undefined);
  activateExtension(() => assert.fail("Activation read legacy profile metadata"));
});

test("listing reads only the legacy metadata and orders occupied slots", async () => {
  let reads = 0;
  const { showInventory, messages } = activateExtension((filename, encoding) => {
    reads += 1;
    assert.equal(filename, path.join(appData, "Antigravity", "Profiles", "profiles.json"));
    assert.equal(encoding, "utf8");
    return JSON.stringify({
      slots: [
        { slot: 3, name: "Example profile" },
        { slot: 2, name: "", updatedAt: "2025-02-01T00:00:00.000Z" },
        { slot: 1, name: "First profile", updatedAt: "invalid" },
        { slot: 6, name: "Outside legacy slots" }
      ]
    });
  });

  await showInventory();

  assert.equal(reads, 1);
  assert.deepEqual(messages.documents, ["Slot 1: First profile (updated unknown)\nSlot 3: Example profile (updated unknown)"]);
});

test("listing reports missing and malformed metadata without creating or repairing files", async () => {
  const missing = activateExtension(() => {
    throw Object.assign(new Error("Missing file"), { code: "ENOENT" });
  });
  await missing.showInventory();
  assert.equal(missing.messages.information.length, 1);

  for (const metadata of ["invalid JSON", "{}"]) {
    const malformed = activateExtension(() => metadata);
    await malformed.showInventory();
    assert.equal(malformed.messages.errors.length, 1);
  }
});
