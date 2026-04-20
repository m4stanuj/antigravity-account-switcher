[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("save", "switch", "delete")]
    [string]$Action,

    [Parameter(Mandatory = $true)]
    [string]$ProfilesRoot,

    [Parameter(Mandatory = $true)]
    [int]$Slot,

    [string]$ProfileName
)

$ErrorActionPreference = "Stop"

function New-Result {
    param(
        [bool]$Success,
        [string]$Message,
        [hashtable]$Data
    )

    $result = @{
        success = $Success
        message = $Message
    }

    if ($Data) {
        foreach ($key in $Data.Keys) {
            $result[$key] = $Data[$key]
        }
    }

    $result | ConvertTo-Json -Compress
}

function Get-AppRoots {
    $roots = @()

    if ($env:APPDATA) {
        $roots += @{
            Name = "Roaming"
            Path = Join-Path $env:APPDATA "Antigravity"
        }
    }

    if ($env:LOCALAPPDATA) {
        $roots += @{
            Name = "Local"
            Path = Join-Path $env:LOCALAPPDATA "Antigravity"
        }
    }

    $portable = Join-Path $env:USERPROFILE ".antigravity"
    $roots += @{
        Name = "Portable"
        Path = $portable
    }

    return $roots
}

function Get-TrackedPaths {
    return @(
        "User\globalStorage",
        "User\workspaceStorage",
        "User\storage.json",
        "User\state.vscdb",
        "User\state.vscdb.backup",
        "Local Storage",
        "Session Storage",
        "Network",
        "Cookies",
        "Cookies-journal",
        "Shared Dictionary"
    )
}

function Resolve-ProfileDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Root,
        [Parameter(Mandatory = $true)]
        [int]$Slot
    )

    if (-not (Test-Path -LiteralPath $Root)) {
        return $null
    }

    $prefix = "slot-$Slot-"
    $candidate = Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "$prefix*" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($candidate) {
        return $candidate.FullName
    }

    return $null
}

function Remove-SlotDirectories {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Root,
        [Parameter(Mandatory = $true)]
        [int]$Slot
    )

    if (-not (Test-Path -LiteralPath $Root)) {
        return
    }

    $prefix = "slot-$Slot-"
    Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "$prefix*" } |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
}

function Copy-TrackedContent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceRoot,
        [Parameter(Mandatory = $true)]
        [string]$DestinationRoot
    )

    foreach ($relative in Get-TrackedPaths) {
        $source = Join-Path $SourceRoot $relative
        if (-not (Test-Path -LiteralPath $source)) {
            continue
        }

        $target = Join-Path $DestinationRoot $relative
        $targetParent = Split-Path -Parent $target
        if ($targetParent) {
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        }

        if (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
        }

        Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
    }
}

function Clear-TrackedContent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Root
    )

    foreach ($relative in Get-TrackedPaths) {
        $target = Join-Path $Root $relative
        if (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    New-Item -ItemType Directory -Path $ProfilesRoot -Force | Out-Null

    switch ($Action) {
        "save" {
            if (-not $ProfileName) {
                throw "ProfileName is required when saving."
            }

            $safeName = ($ProfileName -replace '[<>:"/\\|?*]', '').Trim()
            if (-not $safeName) {
                throw "ProfileName is empty after sanitization."
            }

            $profileFolderName = "slot-$Slot-" + (($safeName.ToLower() -replace '[^a-z0-9]+', '-') -replace '(^-+|-+$)', '')
            if ($profileFolderName -match 'slot-\d+-$') {
                $profileFolderName += "profile"
            }

            $profileRoot = Join-Path $ProfilesRoot $profileFolderName
            Remove-SlotDirectories -Root $ProfilesRoot -Slot $Slot

            New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null

            foreach ($appRoot in Get-AppRoots) {
                if (-not (Test-Path -LiteralPath $appRoot.Path)) {
                    continue
                }

                $destination = Join-Path $profileRoot $appRoot.Name
                New-Item -ItemType Directory -Path $destination -Force | Out-Null
                Copy-TrackedContent -SourceRoot $appRoot.Path -DestinationRoot $destination
            }

            New-Result -Success $true -Message "Profile saved." -Data @{
                profileRoot = $profileRoot
            }
        }

        "switch" {
            $profileRoot = Resolve-ProfileDirectory -Root $ProfilesRoot -Slot $Slot
            if (-not $profileRoot) {
                throw "Profile slot $Slot was not found."
            }

            foreach ($appRoot in Get-AppRoots) {
                if (-not (Test-Path -LiteralPath $appRoot.Path)) {
                    New-Item -ItemType Directory -Path $appRoot.Path -Force | Out-Null
                }

                Clear-TrackedContent -Root $appRoot.Path
                $source = Join-Path $profileRoot $appRoot.Name
                if (Test-Path -LiteralPath $source) {
                    Copy-TrackedContent -SourceRoot $source -DestinationRoot $appRoot.Path
                }
            }

            New-Result -Success $true -Message "Profile switched." -Data @{
                profileRoot = $profileRoot
            }
        }

        "delete" {
            $profileRoot = Resolve-ProfileDirectory -Root $ProfilesRoot -Slot $Slot
            if (-not $profileRoot) {
                New-Result -Success $true -Message "Profile already deleted." -Data @{}
                exit 0
            }

            Remove-Item -LiteralPath $profileRoot -Recurse -Force
            New-Result -Success $true -Message "Profile deleted." -Data @{
                profileRoot = $profileRoot
            }
        }
    }
}
catch {
    New-Result -Success $false -Message $_.Exception.Message -Data @{}
    exit 1
}
