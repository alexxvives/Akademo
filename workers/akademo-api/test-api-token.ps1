$apiUrl = "https://akademo-api.alexxvives.workers.dev"
$email = "admin@academyhive.com"
$password = "password"

Write-Host "Testing Login..."
$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$apiUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
$loginData = $loginResponse.Content | ConvertFrom-Json

if ($loginData.success) {
    Write-Host "Login Successful!" -ForegroundColor Green
    $token = $loginData.data.token
    Write-Host "Token received: $token"
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`nTesting /auth/me with Token..."
    try {
        $meResponse = Invoke-WebRequest -Uri "$apiUrl/auth/me" -Method Get -Headers $headers
        Write-Host "/auth/me Response: $($meResponse.StatusCode)" -ForegroundColor Green
        Write-Host $meResponse.Content
    } catch {
        Write-Host "/auth/me Failed: $_" -ForegroundColor Red
    }
    
    Write-Host "`nTesting /classes with Token..."
    try {
        $classesResponse = Invoke-WebRequest -Uri "$apiUrl/classes" -Method Get -Headers $headers
        Write-Host "/classes Response: $($classesResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "/classes Failed: $_" -ForegroundColor Red
    }

} else {
    Write-Host "Login Failed: $($loginData.error)" -ForegroundColor Red
}
