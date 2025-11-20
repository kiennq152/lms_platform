# Quick Fix All - Complete Setup Script
# Run this from project root: .\QUICK_FIX_ALL.ps1

Write-Host "🚀 Quick Fix All - Complete Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Check PostgreSQL
Write-Host "📋 Step 1: Checking PostgreSQL..." -ForegroundColor Yellow

$pgServices = Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
$pgPath = $null

if (Test-Path "C:\Program Files\PostgreSQL") {
    $pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
}

if (-not $pgServices -and -not $pgPath) {
    Write-Host "❌ PostgreSQL is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Install it (remember the password!)" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    $open = Read-Host "Open download page now? (y/n)"
    if ($open -eq 'y') {
        Start-Process "https://www.postgresql.org/download/windows/"
    }
    exit 1
}

Write-Host "✅ PostgreSQL found!" -ForegroundColor Green

# Step 2: Start PostgreSQL
Write-Host ""
Write-Host "📋 Step 2: Starting PostgreSQL..." -ForegroundColor Yellow

if ($pgServices) {
    $pgService = $pgServices | Select-Object -First 1
    if ($pgService.Status -ne 'Running') {
        try {
            Start-Service -Name $pgService.Name
            Start-Sleep -Seconds 3
            Write-Host "✅ PostgreSQL started!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not start automatically. Please start manually from Services." -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ PostgreSQL is running!" -ForegroundColor Green
    }
}

# Step 3: Create .env file
Write-Host ""
Write-Host "📋 Step 3: Setting up .env file..." -ForegroundColor Yellow

$envPath = Join-Path (Get-Location) "server\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file..." -ForegroundColor Gray
    
    $password = Read-Host "Enter PostgreSQL password (for postgres user)" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    $envContent = @"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=$passwordPlain

JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists!" -ForegroundColor Green
    $update = Read-Host "Update password? (y/n)"
    if ($update -eq 'y') {
        $password = Read-Host "Enter PostgreSQL password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        $content = Get-Content $envPath -Raw
        $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$passwordPlain"
        $content | Out-File -FilePath $envPath -Encoding utf8
        Write-Host "✅ Password updated!" -ForegroundColor Green
    }
}

# Step 4: Create database
Write-Host ""
Write-Host "📋 Step 4: Creating database..." -ForegroundColor Yellow

$psqlPath = $null
if ($pgPath) {
    $psqlPath = Get-ChildItem $pgPath.FullName -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-not $psqlPath) {
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        $psqlPath = @{ FullName = $psqlCmd.Source }
    }
}

if (-not $psqlPath) {
    Write-Host "⚠️  psql.exe not found. Please create database manually:" -ForegroundColor Yellow
    Write-Host "   psql -U postgres" -ForegroundColor White
    Write-Host "   CREATE DATABASE lms_db;" -ForegroundColor White
} else {
    # Load password from .env
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "DB_PASSWORD=(.+)") {
        $env:PGPASSWORD = $matches[1].Trim()
    }
    
    # Check if database exists
    $dbCheck = & $psqlPath.FullName -U postgres -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='lms_db'" 2>&1
    if ($dbCheck -match "1") {
        Write-Host "✅ Database 'lms_db' exists!" -ForegroundColor Green
    } else {
        Write-Host "Creating database..." -ForegroundColor Gray
        & $psqlPath.FullName -U postgres -d postgres -c "CREATE DATABASE lms_db;" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database created!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not create database. Please create manually." -ForegroundColor Yellow
        }
    }
}

# Step 5: Run schema
Write-Host ""
Write-Host "📋 Step 5: Running database schema..." -ForegroundColor Yellow

$schemaPath = Join-Path (Get-Location) "server\database\schema.sql"
if (Test-Path $schemaPath) {
    if ($psqlPath) {
        Write-Host "Running schema..." -ForegroundColor Gray
        & $psqlPath.FullName -U postgres -d lms_db -f $schemaPath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schema executed!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Schema had warnings (might be OK if tables exist)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  psql.exe not found. Please run schema manually:" -ForegroundColor Yellow
        Write-Host "   psql -U postgres -d lms_db -f database\schema.sql" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  schema.sql not found at: $schemaPath" -ForegroundColor Yellow
}

# Step 6: Create test user
Write-Host ""
Write-Host "📋 Step 6: Creating test user..." -ForegroundColor Yellow

$serverPath = Join-Path (Get-Location) "server"
if (Test-Path (Join-Path $serverPath "create-test-user.js")) {
    Push-Location $serverPath
    node create-test-user.js
    Pop-Location
} else {
    Write-Host "⚠️  create-test-user.js not found" -ForegroundColor Yellow
}

# Step 7: Test connection
Write-Host ""
Write-Host "📋 Step 7: Testing database connection..." -ForegroundColor Yellow

if (Test-Path (Join-Path $serverPath "test-db-connection.js")) {
    Push-Location $serverPath
    node test-db-connection.js
    Pop-Location
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start server: cd server && npm run dev" -ForegroundColor White
Write-Host "  2. Login at: http://localhost:5173/pages/auth/login.html" -ForegroundColor White
Write-Host "  3. Use credentials:" -ForegroundColor White
Write-Host "     Email: test@example.com" -ForegroundColor Gray
Write-Host "     Password: test123456" -ForegroundColor Gray
Write-Host ""

