# Changelog

All notable changes to the Antigravity Multi-Account Switcher are documented here.

## [2.0.0] — 2026-03-28

### Added
- **Rate limit auto-detection** — scans Antigravity logs for Gemini/Claude rate limit errors
- 1-minute cooldown between rate limit alerts to prevent notification spam
- Auto-switch suggestion when rate limit detected
- Profile delete command with confirmation

### Changed
- Profile slots increased from 3 to 5
- Status bar buttons now use distinct colors (Blue, Green, Orange, Purple, Pink)
- Profile storage moved to `%APPDATA%\Antigravity\Profiles` for cleaner separation

## [1.2.0] — 2026-02-15

### Added
- One-click profile switching (removed confirmation dialog)
- Empty slot indicators with grayed-out numbers
- `+ Save` button in status bar for quick profile creation

### Fixed
- Session storage paths updated for Antigravity 1.3+ directory structure
- Profile corruption on interrupted save operations

## [1.0.0] — 2026-01-20

### Added
- Initial release
- 3 profile slots with color-coded status bar buttons
- Basic profile save/load/switch/delete
- Manual session storage backup and restore
- Support for Antigravity, VS Code, and Electron-based IDEs
