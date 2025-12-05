Param(
    [switch]$StartDev
)

function Is-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

if (-not (Is-Admin)) {
    Write-Error "Please run this script from an elevated (Administrator) PowerShell."
    exit 1
}

# Check for node
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "Node is already installed: $(node --version)"
} else {
    # Try winget
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "Installing Node.js LTS via winget..."
        winget install -e --id OpenJS.NodeJS.LTS
        if ($LASTEXITCODE -ne 0) {
            Write-Error "winget install failed (exit code $LASTEXITCODE). Please install Node.js manually from https://nodejs.org"
            exit 1
        }
    } else {
        Write-Host "winget not found. Please download and run the Node.js LTS installer from https://nodejs.org and then re-run this script."
        exit 1
    }
}

# Refresh environment for this PowerShell session
$env:Path = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Start-Sleep -Seconds 2

# Verify node/npm are available now
try {
    $nodeVer = node --version
    $npmVer = npm --version
    Write-Host "Node: $nodeVer"
    Write-Host "npm: $npmVer"
} catch {
    Write-Host "Node/npm not available in this session. Please open a new PowerShell window and run this script again."
    exit 1
}

# Move to project root (one level above the scripts directory)
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

# Install dependencies
Write-Host "Running npm install in project root ($(Get-Location))..."
npm install

if ($StartDev) {
    Write-Host "Starting dev server (npm start)..."
    npm start
} else {
    Write-Host "Done. To start the dev server, run:"
    Write-Host "  npm start"
    Write-Host "or to run frontend + server concurrently:" 
    Write-Host "  npm run dev"
}
