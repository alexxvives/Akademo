# Script to update all fetch('/api/...' calls to use apiClient

$files = @(
    "src\app\dashboard\teacher\class\[id]\page.tsx",
    "src\app\dashboard\student\class\[id]\page.tsx",
    "src\app\dashboard\teacher\page.tsx",
    "src\app\dashboard\teacher\streams\page.tsx",
    "src\app\dashboard\teacher\students\page.tsx",
    "src\app\dashboard\teacher\progress\page.tsx",
    "src\app\dashboard\teacher\academy\[id]\page.tsx",
    "src\app\dashboard\teacher\requests\page.tsx",
    "src\app\dashboard\academy\requests\page.tsx",
    "src\app\dashboard\academy\streams\page.tsx",
    "src\app\dashboard\academy\lessons\page.tsx",
    "src\app\dashboard\academy\classes\page.tsx",
    "src\app\dashboard\student\enrolled-academies\classes\page.tsx",
    "src\app\dashboard\student\explore\page.tsx",
    "src\app\dashboard\student\explore\[academyId]\page.tsx",
    "src\app\dashboard\admin\page.tsx",
    "src\app\dashboard\academy\page.tsx",
    "src\app\dashboard\admin\profile\page.tsx",
    "src\app\dashboard\teacher\profile\page.tsx",
    "src\app\dashboard\student\profile\page.tsx",
    "src\app\dashboard\student\lessons\page.tsx",
    "src\app\dashboard\teacher\classes\page.tsx",
    "src\app\dashboard\teacher\lessons\page.tsx",
    "src\app\dashboard\teacher\assignments\page.tsx",
    "src\app\dashboard\teacher\grading\page.tsx",
    "src\app\dashboard\teacher\reports\page.tsx",
    "src\app\dashboard\academy\students\page.tsx",
    "src\app\dashboard\academy\teachers\page.tsx",
    "src\app\dashboard\admin\students\page.tsx",
    "src\app\dashboard\admin\teachers\page.tsx",
    "src\app\dashboard\admin\academies\page.tsx",
    "src\lib\multipart-upload.ts",
    "src\lib\bunny-upload.ts",
    "src\components\ProtectedVideoPlayer.tsx",
    "src\app\verify-email\page.tsx",
    "src\app\join\[teacherId]\page.tsx"
)

$totalUpdated = 0
$updatedFiles = @()

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        # Read file content
        $content = Get-Content -Path $fullPath -Raw
        $originalContent = $content
        
        # Check if apiClient import already exists
        $hasImport = $content -match "import.*apiClient.*from.*@/lib/api-client"
        
        # If no import, add it after other imports
        if (-not $hasImport) {
            # Find the last import statement
            if ($content -match "(?s)(import.*?;)\s*\n\s*\n") {
                $lastImport = $matches[1]
                $content = $content -replace "(?s)($lastImport)", "`$1`nimport { apiClient } from '@/lib/api-client';"
                Write-Host "  Added apiClient import" -ForegroundColor Green
            }
        }
        
        # Replace all fetch('/api/...' with apiClient('/...'
        $replacements = 0
        $content = $content -replace "fetch\(['""]\/api\/", "apiClient('/"
        
        # Count how many replacements were made
        if ($content -ne $originalContent) {
            $diff = [System.Text.RegularExpressions.Regex]::Matches($originalContent, "fetch\(['""]\/api\/").Count
            $replacements = $diff
            $totalUpdated += $replacements
            $updatedFiles += $file
            
            # Write updated content back
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "  Updated $replacements fetch calls" -ForegroundColor Yellow
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "SUMMARY" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Total fetch calls updated: $totalUpdated" -ForegroundColor Green
Write-Host "Files modified: $($updatedFiles.Count)" -ForegroundColor Green
Write-Host "`nUpdated files:" -ForegroundColor Cyan
$updatedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
