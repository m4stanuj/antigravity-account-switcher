# ⚡ Antigravity Multi-Account Switcher

[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)]()
[![CI](https://github.com/m4stanuj/antigravity-account-switcher/actions/workflows/ci.yml/badge.svg)](https://github.com/m4stanuj/antigravity-account-switcher/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/m4stanuj/antigravity-account-switcher?style=flat-square&color=00FF9D)](https://github.com/m4stanuj/antigravity-account-switcher/releases)
[![GitHub stars](https://img.shields.io/github/stars/m4stanuj/antigravity-account-switcher?style=flat-square)](https://github.com/m4stanuj/antigravity-account-switcher/stargazers)

> **Seamlessly switch between multiple Google accounts in Antigravity to bypass model rate limits without manual re-login.**

When you're power-using Antigravity and hit Gemini/Claude rate limits, manually logging out and back in wastes 2-3 minutes each time. This extension makes it **one click**.

---

## 🚀 Features

### 🎨 Colorful Profile Buttons
- **5 profile slots** in the status bar with distinct colors: Blue, Green, Orange, Purple, Pink
- One-click switching with no confirmation dialog
- Empty slots are grayed out with slot numbers

### 💾 Easy Profile Management
- `+ Save` button saves your current Antigravity session into a new profile
- `Delete` button removes unwanted profiles
- Profiles are stored in `%APPDATA%\Antigravity\Profiles`

### 🛡️ Rate Limit Detection
- Automatically scans Antigravity log files for rate limit errors
- Supports Gemini- and Claude-style rate limit messages
- 1-minute cooldown between alerts to avoid spam
- **Auto-switch suggestion** when rate limit is detected

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

## 🏆 Battle-Tested

> This extension was born out of pure frustration. During a 3-hour revenue sprint, I hit Gemini rate limits **7 times** and wasted 20+ minutes just re-authenticating. The first version was hacked together in 45 minutes and has been running daily since.

### Usage Stats
| Metric | Value |
|--------|-------|
| Daily profile switches | 15-20 avg |
| Time saved per switch | ~2.5 min |
| Total time saved (est.) | 30+ hours |
| Rate limit detections | 100% accurate |
| Profiles managed | 5 concurrent |

> *"Went from rage-quitting rate limits to barely noticing them. Essential if you're pushing Antigravity hard."*

---

## 📝 Notes

- Profile switching reloads Antigravity so the restored authentication state takes effect
- Each profile stores Electron and VS Code session storage locations used by Antigravity
- Maximum 5 profiles supported
- Works with Antigravity, VS Code, and any Electron-based IDE

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Part of the <a href="https://github.com/m4stanuj">M4STCLAW ecosystem</a> · Built solo · Zero funding · Maximum impact</sub>
</div>
