# Antigravity Multi-Account Switcher

Version 2.0.0 - Final Release

Seamlessly switch between multiple Google accounts in Antigravity to bypass model rate limits without manual re-login.

## Features

### Colorful Profile Buttons

- 5 profile slot buttons in the status bar with distinct colors: Blue, Green, Orange, Purple, and Pink
- One-click switching with no confirmation dialog
- Empty slots are grayed out with slot numbers

### Easy Profile Management

- `+ Save` button saves your current Antigravity session into a new profile
- `Delete` button removes unwanted profiles
- Profiles are stored in `%APPDATA%\Antigravity\Profiles`

### Rate Limit Detection

- Automatically scans Antigravity log files for rate limit errors
- Supports Gemini- and Claude-style rate limit messages
- 1-minute cooldown between alerts to avoid spam

## Installation

### Method 1: Install From VSIX

1. Package the extension into `antigravity-account-switcher-2.0.0.vsix`.
2. Open Antigravity.
3. Press `Ctrl+Shift+P`.
4. Run `Extensions: Install from VSIX...`.
5. Select the `.vsix` file.
6. Reload the window when prompted.

### Method 2: Command Line Install

```powershell
& "$env:LOCALAPPDATA\Programs\Antigravity\bin\antigravity.cmd" --install-extension "path\to\antigravity-account-switcher-2.0.0.vsix"
```

### Method 3: Manual Install

1. Navigate to `%USERPROFILE%\.vscode\extensions\` or `%USERPROFILE%\.antigravity\extensions\`.
2. Create `antigravity-account-switcher-2.0.0`.
3. Copy these files into it:
   - `extension.js`
   - `package.json`
   - `scripts\profile_manager.ps1`
4. Restart Antigravity.

## Commands

| Command | Description |
| --- | --- |
| Antigravity: Save Current Profile | Save current session |
| Antigravity: Switch Profile | Switch via picker |
| Antigravity: Delete Profile | Delete a profile |
| Antigravity: List Profiles | Show saved profiles |

## Notes

- Profile switching reloads Antigravity so the restored authentication state takes effect.
- Each profile stores the most common Electron and VS Code session storage locations used by Antigravity.
- Maximum 5 profiles are supported.
