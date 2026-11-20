# Antigravity Legacy Profile Inventory

[![CI](https://github.com/m4stanuj/antigravity-account-switcher/actions/workflows/ci.yml/badge.svg)](https://github.com/m4stanuj/antigravity-account-switcher/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

The Antigravity Multi-Account Switcher has retired session saving, switching, and deletion. Older versions copied local authentication and session data, and a failed restore could remove data from an Antigravity profile. Use Antigravity's built-in account controls to manage your sign-in.

The extension's **Antigravity: List Legacy Profiles** command shows slot names and recorded update times from the legacy `profiles.json` metadata file. Run the command from the Command Palette on Windows if you have a legacy profile inventory.

Older snapshots may contain sensitive authentication and session data. See [SECURITY.md](SECURITY.md) for handling guidance and private vulnerability reporting.

## Development

Run `npm test` to check the extension's read-only behavior. CI also checks that the legacy PowerShell entry point rejects session operations.

## License

[MIT](LICENSE)
