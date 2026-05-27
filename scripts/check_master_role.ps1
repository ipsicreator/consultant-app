# check_master_role.ps1
$adminEmail = "chrisklee69@gmail.com"
$adminPass = "aussie1996@@"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# admin login
$login = Invoke-RestMethod -Method Post -Uri "$pbUrl/api/admins/auth-with-password" -Body (@{identity=$adminEmail; password=$adminPass} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token

# fetch profile
$filter = "email='chrisklee69@gmail.com'"
$profile = Invoke-RestMethod -Method Get -Uri "$pbUrl/api/collections/suprima_profiles/records?filter=$([System.Web.HttpUtility]::UrlEncode($filter))" -Headers @{Authorization = "Bearer $token"}
if ($profile.items.Count -gt 0) {
    $role = $profile.items[0].role
    Write-Host "Current role: $role"
} else {
    Write-Host "Profile not found"
}
