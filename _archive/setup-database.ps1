# Complete Database Setup Script
# This script will guide you through setting up PostgreSQL and the database

Write-Host "🚀 LMS Database Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if PostgreSQL is installed
Write-Host "📋 Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow

$pgServices = Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
$pgInstallPath = $null

if (Test-Path "C:\Program Files\PostgreSQL") {
    $pgInstallPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
} elseif (Test-Path "C:\Program Files (x86)\PostgreSQL") {
    $pgInstallPath = Get-ChildItem "C:\Program Files (x86)\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
}

if (-not $pgServices -and -not $pgInstallPath) {
    Write-Host "❌ PostgreSQL is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Install PostgreSQL (remember the password you set!)" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to open download page..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://www.postgresql.org/download/windows/"
    exit 1
}

Write-Host "✅ PostgreSQL found!" -ForegroundColor Green
if ($pgInstallPath) {
    Write-Host "   Installation path: $($pgInstallPath.FullName)" -ForegroundColor Gray
}

# Step 2: Check if PostgreSQL service is running
Write-Host ""
Write-Host "📋 Step 2: Checking PostgreSQL service..." -ForegroundColor Yellow

$pgService = $pgServices | Select-Object -First 1
if (-not $pgService) {
    Write-Host "⚠️  PostgreSQL service not found. Trying to start manually..." -ForegroundColor Yellow
    Write-Host "   Please start PostgreSQL service from Services (services.msc)" -ForegroundColor White
    exit 1
}

if ($pgService.Status -ne 'Running') {
    Write-Host "⚠️  PostgreSQL service is not running. Starting..." -ForegroundColor Yellow
    try {
        Start-Service -Name $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "✅ PostgreSQL service started!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start PostgreSQL service: $_" -ForegroundColor Red
        Write-Host "   Please start it manually from Services (services.msc)" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL service is running!" -ForegroundColor Green
}

# Step 3: Check .env file
Write-Host ""
Write-Host "📋 Step 3: Checking .env file..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  .env file not found. Creating..." -ForegroundColor Yellow
    
    $envContent = @"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update DB_PASSWORD in server/.env with your PostgreSQL password!" -ForegroundColor Yellow
    Write-Host "   File location: $envPath" -ForegroundColor Gray
    Write-Host ""
    $updatePassword = Read-Host "Do you want to update the password now? (y/n)"
    if ($updatePassword -eq 'y') {
        $password = Read-Host "Enter PostgreSQL password (for postgres user)" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        $envContent = $envContent -replace "DB_PASSWORD=postgres", "DB_PASSWORD=$passwordPlain"
        $envContent | Out-File -FilePath $envPath -Encoding utf8
        Write-Host "✅ Password updated!" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env file exists!" -ForegroundColor Green
}

# Step 4: Find psql.exe
Write-Host ""
Write-Host "📋 Step 4: Finding psql.exe..." -ForegroundColor Yellow

$psqlPath = $null
if ($pgInstallPath) {
    $psqlPath = Get-ChildItem $pgInstallPath.FullName -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-not $psqlPath) {
    Write-Host "⚠️  psql.exe not found. Trying to use psql from PATH..." -ForegroundColor Yellow
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlPath) {
        $psqlPath = $psqlPath.Source
    }
}

if (-not $psqlPath) {
    Write-Host "❌ Cannot find psql.exe. Please add PostgreSQL to PATH or specify path manually." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found psql.exe: $($psqlPath.FullName)" -ForegroundColor Green

# Step 5: Create database
Write-Host ""
Write-Host "📋 Step 5: Creating database..." -ForegroundColor Yellow

# Load .env to get password
dotenv.config({ path: $envPath })
$dbPassword = $env:DB_PASSWORD
if (-not $dbPassword) {
    $dbPassword = Read-Host "Enter PostgreSQL password (for postgres user)" -AsSecureString
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
}

$env:PGPASSWORD = $dbPassword

try {
    $result = & $psqlPath.FullName -U postgres -d postgres -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connected to PostgreSQL!" -ForegroundColor Green
        
        # Check if database exists
        $dbExists = & $psqlPath.FullName -U postgres -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='lms_db'" 2>&1
        if ($dbExists -match "1") {
            Write-Host "✅ Database 'lms_db' already exists!" -ForegroundColor Green
        } else {
            Write-Host "Creating database 'lms_db'..." -ForegroundColor Yellow
            & $psqlPath.FullName -U postgres -d postgres -c "CREATE DATABASE lms_db;" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database 'lms_db' created!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to create database" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "❌ Cannot connect to PostgreSQL. Check password in .env file" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Run schema
Write-Host ""
Write-Host "📋 Step 6: Running database schema..." -ForegroundColor Yellow

$schemaPath = Join-Path $PSScriptRoot "database\schema.sql"
if (-not (Test-Path $schemaPath)) {
    Write-Host "⚠️  schema.sql not found at: $schemaPath" -ForegroundColor Yellow
    Write-Host "   Skipping schema execution..." -ForegroundColor Yellow
} else {
    Write-Host "Running schema from: $schemaPath" -ForegroundColor Gray
    & $psqlPath.FullName -U postgres -d lms_db -f $schemaPath 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema executed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Schema execution had warnings (this might be OK if tables already exist)" -ForegroundColor Yellow
    }
}

# Step 7: Create test user
Write-Host ""
Write-Host "📋 Step 7: Creating test user..." -ForegroundColor Yellow

$testEmail = "test@example.com"
$testPassword = "test123456"

# Check if user exists
$userExists = & $psqlPath.FullName -U postgres -d lms_db -t -c "SELECT 1 FROM users WHERE email='$testEmail'" 2>&1

if ($userExists -match "1") {
    Write-Host "✅ Test user already exists!" -ForegroundColor Green
} else {
    Write-Host "Creating test user: $testEmail" -ForegroundColor Gray
    
    # Hash password (using Node.js)
    $hashScript = @"
const bcrypt = require('bcryptjs');
bcrypt.hash('$testPassword', 10).then(hash => console.log(hash));
"@
    
    $hashScript | Out-File -FilePath "$env:TEMP\hash-password.js" -Encoding utf8
    $hashedPassword = node "$env:TEMP\hash-password.js" 2>&1 | Select-Object -Last 1
    
    if ($hashedPassword) {
        $createUserSQL = @"
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, admin_approved, status)
VALUES ('$testEmail', '$hashedPassword', 'Test', 'User', 'student', true, true, 'active')
ON CONFLICT (email) DO NOTHING;
"@
        
        & $psqlPath.FullName -U postgres -d lms_db -c $createUserSQL 2>&1 | Out-Null
        Write-Host "✅ Test user created!" -ForegroundColor Green
        Write-Host "   Email: $testEmail" -ForegroundColor Gray
        Write-Host "   Password: $testPassword" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Could not create test user (password hashing failed)" -ForegroundColor Yellow
    }
}

# Step 8: Test connection
Write-Host ""
Write-Host "📋 Step 8: Testing database connection..." -ForegroundColor Yellow

node test-db-connection.js

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  1. Start server: cd server && npm run dev" -ForegroundColor White
Write-Host "  2. Login with test user:" -ForegroundColor White
Write-Host "     Email: $testEmail" -ForegroundColor Gray
Write-Host "     Password: $testPassword" -ForegroundColor Gray
Write-Host ""

