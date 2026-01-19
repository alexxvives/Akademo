# Fix encoding issues in dashboard files
$teacherFile = "src/app/dashboard/teacher/page.tsx"
$academyFile = "src/app/dashboard/academy/page.tsx"

# Read files
$teacherContent = Get-Content $teacherFile -Raw -Encoding UTF8
$academyContent = Get-Content $academyFile -Raw -Encoding UTF8

# Fix stars in ratings (Γÿà → ★)
$teacherContent = $teacherContent -replace 'Γÿà', '★'
$academyContent = $academyContent -replace 'Γÿà', '★'

# Fix other encoding issues
$teacherContent = $teacherContent -replace 'Participaci├│n', 'Participación'
$teacherContent = $teacherContent -replace 'visualizaci├│n', 'visualización'
$teacherContent = $teacherContent -replace 'aprobaci├│n', 'aprobación'
$teacherContent = $teacherContent -replace 'aqu├¡', 'aquí'
$teacherContent = $teacherContent -replace 'a├║n', 'aún'

$academyContent = $academyContent -replace 'Participaci├│n', 'Participación'
$academyContent = $academyContent -replace 'visualizaci├│n', 'visualización'
$academyContent = $academyContent -replace 'aprobaci├│n', 'aprobación'
$academyContent = $academyContent -replace 'aqu├¡', 'aquí'
$academyContent = $academyContent -replace 'a├║n', 'aún'

# Write back
[System.IO.File]::WriteAllText((Resolve-Path $teacherFile), $teacherContent, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Resolve-Path $academyFile), $academyContent, [System.Text.UTF8Encoding]::new($false))

Write-Host "Encoding fixed successfully!"
