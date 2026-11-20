[CmdletBinding()]
param(
    [ValidateSet("save", "switch", "delete")]
    [string]$Action,

    [string]$ProfilesRoot,

    [ValidateRange(1, 5)]
    [int]$Slot,

    [string]$ProfileName
)

# Accept the legacy arguments so older callers receive an explicit failure.
@{
    success = $false
    message = "Legacy Antigravity session operations have been retired."
} | ConvertTo-Json -Compress
exit 1
