# ⚡ Antigravity Multi-Account Switcher

[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)]()
[![CI](https://github.com/m4stanuj/antigravity-account-switcher/actions/workflows/ci.yml/badge.svg)](https://github.com/m4stanuj/antigravity-account-switcher/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/m4stanuj/antigravity-account-switcher?style=flat-square&color=00FF9D)](https://github.com/m4stanuj/antigravity-account-switcher/releases)
[![GitHub stars](https://img.shields.io/github/stars/m4stanuj/antigravity-account-switcher?style=flat-square)](https://github.com/m4stanuj/antigravity-account-switcher/stargazers)

> **Locally save and restore Antigravity profiles with explicit safeguards for authentication and session data.**

This extension is a local profile-management utility. It is not a mechanism for bypassing provider limits, account restrictions, or terms of service. Use only accounts and software sessions you are authorized to access, and follow your provider's usage policies.

---

## 🚀 Features

### 🎨 Colorful Profile Buttons
- **5 profile slots** in the status bar with distinct colors: Blue, Green, Orange, Purple, Pink
- Explicit confirmation before saving, switching, or deleting a profile
- Empty slots are grayed out with slot numbers

### 💾 Easy Profile Management
- `+ Save` button saves your current Antigravity session into a new profile
- `Delete` button removes unwanted profiles
- Profiles are stored in `%APPDATA%\Antigravity\Profiles`

### 🛡️ Session Safety
- Explains that saved profiles may contain authentication/session data
- Requires an explicit user confirmation before local session data is replaced
- Creates a temporary rollback copy during profile switching and restores it if the operation fails

---

## 📦 Installation

### Method 1: Install From VSIX
```powershell
# Package and install
& "$env:LOCALAPPDATA\Programs\Antigravity\bin\antigravity.cmd" --install-extension "antigravity-account-switcher-2.0.0.vsix"
```

### Method 2: Manual Install
1. Navigate to `%USERPROFILE%\.vscode\extensions\` or `%USERPROFILE%\.antigravity\extensions\`
2. Create `antigravity-account-switcher-2.0.0`
3. Copy `extension.js`, `package.json`, `scripts\profile_manager.ps1`
4. Restart Antigravity

---

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `Antigravity: Save Current Profile` | Save current session |
| `Antigravity: Switch Profile` | Switch via picker |
| `Antigravity: Delete Profile` | Delete a profile |
| `Antigravity: List Profiles` | Show saved profiles |

---

## 📝 Notes

- Profile switching reloads Antigravity so the restored authentication state takes effect
- Each profile can include Electron and VS Code session storage locations used by Antigravity
- Maximum 5 profiles supported
- Works with Antigravity, VS Code, and any Electron-based IDE
- Use a device with full-disk encryption, never share the profile directory, and delete profiles you no longer need
- This project is intended for authorized local profile management only; it must not be used to evade quotas, restrictions, or account controls

## 🔐 Security

Please read [SECURITY.md](SECURITY.md) before using or reporting a vulnerability. The extension deliberately asks for confirmation before any operation that saves, replaces, or deletes local session data.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Part of the <a href="https://github.com/m4stanuj">M4STCLAW ecosystem</a> · Built solo · Zero funding · Maximum impact</sub>
</div>
