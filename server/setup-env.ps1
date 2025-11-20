# PowerShell script to create .env file
# Run this script: .\setup-env.ps1

$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
"@

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️ .env file already exists at: $envPath"
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping .env file creation"
        exit
    }
}

try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ Created .env file at: $envPath"
    Write-Host ""
    Write-Host "⚠️ IMPORTANT: Update DB_PASSWORD with your PostgreSQL password!"
    Write-Host "   Edit the file: $envPath"
} catch {
    Write-Host "❌ Error creating .env file: $_"
    Write-Host ""
    Write-Host "Please create the file manually with the following content:"
    Write-Host $envContent
}


