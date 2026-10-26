# Quick deployment script for Hugging Face Spaces
param(
    [Parameter(Mandatory=$false)]
    [string]$HfUsername,
    [string]$SpaceName = "healsense-api"
)

if (-not $HfUsername) {
    $HfUsername = Read-Host "Enter your Hugging Face username"
}

if (-not $HfUsername) {
    Write-Error "Hugging Face username is required."
    exit 1
}

Write-Host "Syncing backend files into deploy\hf_space..." -ForegroundColor Cyan
Copy-Item -Path "backend\requirements.txt", "backend\run.py" -Destination "deploy\hf_space\" -Force
Copy-Item -Path "backend\app" -Destination "deploy\hf_space\app" -Recurse -Force

$spaceDir = Join-Path (Get-Location) "deploy\hf_space"
Set-Location $spaceDir

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

git add .
git commit -m "Deploy HealSense API to Hugging Face Spaces"

$remoteUrl = "https://huggingface.co/spaces/$HfUsername/$SpaceName"
Write-Host "Configuring remote: $remoteUrl" -ForegroundColor Cyan

git remote remove space 2>$null
git remote add space $remoteUrl

Write-Host "`nPushing to Hugging Face Space ($remoteUrl)..." -ForegroundColor Green
Write-Host "NOTE: When prompted for password, enter your Hugging Face Access Token (from https://huggingface.co/settings/tokens with Write permission)" -ForegroundColor Yellow

git push space main -f

Set-Location ..\..
Write-Host "`nDeployment pushed successfully!" -ForegroundColor Green
Write-Host "Your Space URL will be: https://$HfUsername-$SpaceName.hf.space" -ForegroundColor Cyan
