# PowerShell Script to Fix Type Safety Issues
# Phase 1D: Automated Type Safety Fixes

Write-Host "Starting Type Safety Fixes..." -ForegroundColor Green

$scriptRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $scriptRoot "src"

# Statistics
$filesFixed = 0
$asNeverFixed = 0
$asAnyFixed = 0

# Function to fix 'as never' in Supabase queries
function Fix-AsNever {
    param([string]$filePath)

    $content = Get-Content $filePath -Raw
    $originalContent = $content

    # Remove 'as never' from user.id
    $content = $content -replace '\buser\.id\s+as\s+never\b', 'user.id'

    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -NoNewline
        $script:asNeverFixed++
        Write-Host "  Fixed 'as never' in: $filePath" -ForegroundColor Yellow
        return $true
    }
    return $false
}

# Function to add type imports where needed
function Add-TypeImports {
    param([string]$filePath)

    $content = Get-Content $filePath -Raw
    $originalContent = $content

    # Check if file uses database queries
    $needsDatabaseSource = $content -match "from\('sources'\)" -and $content -notmatch "import.*DatabaseSource"
    $needsDatabaseCollection = $content -match "from\('collections'\)" -and $content -notmatch "import.*DatabaseCollection"

    $imports = @()
    if ($needsDatabaseSource) {
        $imports += "DatabaseSource"
    }
    if ($needsDatabaseCollection) {
        $imports += "DatabaseCollection"
    }

    if ($imports.Count -gt 0) {
        $importStatement = "import { $($imports -join ', ') } from '@/types/api'`n"

        # Find the last import statement
        if ($content -match '(?s)(import.*?\n)(?=\n[^i])') {
            $lastImport = $matches[0]
            $content = $content -replace [regex]::Escape($lastImport), "$lastImport$importStatement"
        } else {
            # Add after the first line (usually a comment or first import)
            $lines = $content -split "`n"
            $lines = @($lines[0], $importStatement) + $lines[1..($lines.Length - 1)]
            $content = $lines -join "`n"
        }

        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  Added type imports to: $filePath" -ForegroundColor Yellow
        return $true
    }
    return $false
}

# Function to check if file needs fixing
function Needs-Fixing {
    param([string]$filePath)

    $content = Get-Content $filePath -Raw

    # Check for 'as never', 'as any', ': any'
    return ($content -match '\bas\s+never\b') -or
           ($content -match '\bas\s+any\b') -or
           ($content -match ':\s*any\b')
}

Write-Host "`nPhase 1: Removing 'as never' assertions..." -ForegroundColor Cyan

# Fix all TypeScript files in src/app/api
Get-ChildItem -Path (Join-Path $srcPath "app\api") -Filter "*.ts" -Recurse | ForEach-Object {
    if (Needs-Fixing $_.FullName) {
        $fixed = Fix-AsNever $_.FullName
        if ($fixed) {
            $filesFixed++
        }
    }
}

Write-Host "`nPhase 2: Adding type imports..." -ForegroundColor Cyan

Get-ChildItem -Path (Join-Path $srcPath "app\api") -Filter "*.ts" -Recurse | ForEach-Object {
    Add-TypeImports $_.FullName
}

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Files Modified: $filesFixed" -ForegroundColor White
Write-Host "'as never' Fixed: $asNeverFixed" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes with: git diff" -ForegroundColor White
Write-Host "2. Run TypeScript check: npm run type-check" -ForegroundColor White
Write-Host "3. Run build: npm run build" -ForegroundColor White
Write-Host "4. Manually fix remaining 'any' types using TYPE_SAFETY_AUDIT_AND_FIXES.md" -ForegroundColor White

Write-Host "`nDone!" -ForegroundColor Green
