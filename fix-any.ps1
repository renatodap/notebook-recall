# PowerShell script to fix 'any' types across the codebase
# Run with: powershell -ExecutionPolicy Bypass -File fix-any.ps1

$projectRoot = $PSScriptRoot
$filesChanged = 0
$totalReplacements = 0

Write-Host "Starting automatic 'any' type fixes..." -ForegroundColor Green
Write-Host "Project root: $projectRoot"
Write-Host ""

# Get all TS/TSX files
$files = Get-ChildItem -Path "$projectRoot\src" -Include *.ts,*.tsx -Recurse -File

Write-Host "Found $($files.Count) TypeScript files"
Write-Host ""

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileChanges = 0

    # 1. Remove (supabase as any) casts
    $pattern1 = '\(supabase as any\)'
    if ($content -match $pattern1) {
        $count = ([regex]::Matches($content, $pattern1)).Count
        $content = $content -replace $pattern1, 'supabase'
        $fileChanges += $count
        Write-Host "  - Removed $count '(supabase as any)' casts" -ForegroundColor Yellow
    }

    # 2. Replace 'catch (error: any)' with 'catch (error: unknown)'
    $pattern2 = 'catch \(error: any\)'
    if ($content -match $pattern2) {
        $count = ([regex]::Matches($content, $pattern2)).Count
        $content = $content -replace $pattern2, 'catch (error: unknown)'
        $fileChanges += $count
        Write-Host "  - Fixed $count catch blocks to use 'unknown'" -ForegroundColor Yellow
    }

    # 3. Replace '.map((item: any) =>' patterns
    $pattern3 = '\.map\(\((\w+): any\) =>'
    if ($content -match $pattern3) {
        $count = ([regex]::Matches($content, $pattern3)).Count
        $content = $content -replace $pattern3, '.map(($1: DatabaseRecord) =>'
        $fileChanges += $count
        Write-Host "  - Fixed $count map functions" -ForegroundColor Yellow
    }

    # 4. Replace '.filter((item: any) =>' patterns
    $pattern4 = '\.filter\(\((\w+): any\) =>'
    if ($content -match $pattern4) {
        $count = ([regex]::Matches($content, $pattern4)).Count
        $content = $content -replace $pattern4, '.filter(($1: DatabaseRecord) =>'
        $fileChanges += $count
        Write-Host "  - Fixed $count filter functions" -ForegroundColor Yellow
    }

    # 5. Remove 'as any' casts
    $pattern5 = '\s+as any(?=\))'
    if ($content -match $pattern5) {
        $count = ([regex]::Matches($content, $pattern5)).Count
        $content = $content -replace $pattern5, ''
        $fileChanges += $count
        Write-Host "  - Removed $count 'as any' casts" -ForegroundColor Yellow
    }

    # 6. Replace ': any[]' with ': unknown[]'
    $pattern6 = ': any\[\]'
    if ($content -match $pattern6) {
        $count = ([regex]::Matches($content, $pattern6)).Count
        $content = $content -replace $pattern6, ': unknown[]'
        $fileChanges += $count
        Write-Host "  - Fixed $count any[] types" -ForegroundColor Yellow
    }

    # 7. Replace 'Record<string, any>' with 'Record<string, unknown>'
    $pattern7 = 'Record<string, any>'
    if ($content -match [regex]::Escape($pattern7)) {
        $count = ([regex]::Matches($content, [regex]::Escape($pattern7))).Count
        $content = $content -replace [regex]::Escape($pattern7), 'Record<string, unknown>'
        $fileChanges += $count
        Write-Host "  - Fixed $count Record<string, any> types" -ForegroundColor Yellow
    }

    # 8. Replace function parameters '(param: any)' with '(param: unknown)'
    $pattern8 = '\((\w+): any\)'
    if ($content -match $pattern8) {
        $count = ([regex]::Matches($content, $pattern8)).Count
        $content = $content -replace $pattern8, '($1: unknown)'
        $fileChanges += $count
        Write-Host "  - Fixed $count function parameters" -ForegroundColor Yellow
    }

    # 9. Replace ': any)' with ': unknown)'
    $pattern9 = ': any\)'
    if ($content -match $pattern9) {
        $count = ([regex]::Matches($content, $pattern9)).Count
        $content = $content -replace $pattern9, ': unknown)'
        $fileChanges += $count
        Write-Host "  - Fixed $count ': any)' patterns" -ForegroundColor Yellow
    }

    # If content changed, add necessary imports and save
    if ($content -ne $originalContent) {
        # Check if DatabaseRecord is used but not imported
        if ($content -match 'DatabaseRecord' -and $content -notmatch "from '@/types/api-types'") {
            # Find the last import line
            $importMatches = [regex]::Matches($content, '^import .* from [''"].*[''"];?\r?\n', 'Multiline')
            if ($importMatches.Count -gt 0) {
                $lastImport = $importMatches[$importMatches.Count - 1]
                $insertPos = $lastImport.Index + $lastImport.Length
                $content = $content.Substring(0, $insertPos) + "import type { DatabaseRecord } from '@/types/api-types'`n" + $content.Substring($insertPos)
                Write-Host "  - Added DatabaseRecord import" -ForegroundColor Cyan
            }
        }

        # Save the file
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesChanged++
        $totalReplacements += $fileChanges
        $relativePath = $file.FullName.Replace($projectRoot, '.')
        Write-Host "[OK] Fixed: $relativePath" -ForegroundColor Green
        Write-Host "     Total changes in file: $fileChanges"
        Write-Host ""
    }
}

Write-Host ""
Write-Host "========================================"  -ForegroundColor Green
Write-Host "SUMMARY:" -ForegroundColor Green
Write-Host "  Files processed: $($files.Count)"
Write-Host "  Files modified: $filesChanged"
Write-Host "  Total replacements: $totalReplacements"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes with git diff"
Write-Host "2. Run npm run build"
Write-Host "3. Fix remaining issues manually"
Write-Host "4. Commit changes"
