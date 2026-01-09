# Update API calls in specific files with bracket characters
$ErrorActionPreference = "Stop"

# List of files to update
$files = @(
    "src\app\dashboard\student\class\[id]\page.tsx",
    "src\app\dashboard\teacher\class\[id]\page.tsx",
    "src\app\dashboard\teacher\academy\[id]\page.tsx",
    "src\app\dashboard\student\explore\[academyId]\page.tsx",
    "src\app\join\[teacherId]\page.tsx"
)

$totalReplaced = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    Write-Host "Processing: $file" -ForegroundColor Cyan
    
    if (Test-Path $fullPath) {
        # Read file as single string
        $content = [System.IO.File]::ReadAllText($fullPath)
        $originalContent = $content
        
        # Check if import already exists
        if ($content -notmatch 'apiClient.*@/lib/api-client') {
            # Add import after first import block
            $content = $content -replace '(?m)(^import .+?;\s*\n)', "`$1import { apiClient } from '@/lib/api-client';`n"
            Write-Host "  Added apiClient import" -ForegroundColor Green
        }
        
        # Count fetch calls before replacement
        $beforeCount = ($content | Select-String -Pattern "fetch\(['""]\/api\/" -AllMatches).Matches.Count
        
        # Replace all fetch('/api/... with apiClient('/...
        $content = $content -replace "fetch\(['""]\/api\/", "apiClient('/"
        
        if ($content -ne $originalContent) {
            # Write back to file
            [System.IO.File]::WriteAllText($fullPath, $content)
            Write-Host "  Replaced $beforeCount fetch calls" -ForegroundColor Yellow
            $totalReplaced += $beforeCount
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  File not found!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "TOTAL REPLACEMENTS: $totalReplaced" -ForegroundColor Green
