# AgriProof AI Setup Script (PowerShell)
# Run once to set up the full stack on Windows

param(
    [switch]$SkipZK,
    [switch]$SkipModels,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " AgriProof AI — Satellite-Verified Crop Insurance" -ForegroundColor Green
Write-Host " Zero-Knowledge Proof Engine Setup" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# ─── Check Prerequisites ───────────────────────────────────────────────────

function Check-Command {
    param($Command, $Name, $InstallUrl)
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "  ✓ $Name found" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ $Name NOT found — Install from: $InstallUrl" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "Checking prerequisites..." -ForegroundColor Cyan
$hasPython = Check-Command "python" "Python 3.10+" "https://python.org"
$hasNode = Check-Command "node" "Node.js 18+" "https://nodejs.org"
$hasNpm = Check-Command "npm" "npm" "https://nodejs.org"
$hasCircom = Check-Command "circom" "Circom" "https://docs.circom.io/getting-started/installation/"

if (-not $hasPython) {
    Write-Host "  ⚠ Python is required. Please install it first." -ForegroundColor Red
    exit 1
}
if (-not $hasNode) {
    Write-Host "  ⚠ Node.js is required. Please install it first." -ForegroundColor Red
    exit 1
}

# ─── Step 1: Backend Python deps ──────────────────────────────────────────

Write-Host ""
Write-Host "Step 1/4: Installing Python dependencies..." -ForegroundColor Cyan
Set-Location "$ProjectRoot\backend"

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "  Creating Python virtual environment..."
    python -m venv venv
}

# Activate and install
& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt --quiet
Write-Host "  ✓ Python dependencies installed" -ForegroundColor Green

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  ✓ Created .env from .env.example" -ForegroundColor Green
}

Set-Location $ProjectRoot

# ─── Step 2: ZK Circuit Setup ─────────────────────────────────────────────

if (-not $SkipZK) {
    Write-Host ""
    Write-Host "Step 2/4: Setting up ZK circuits..." -ForegroundColor Cyan
    Set-Location "$ProjectRoot\circuits"
    
    # Install snarkjs
    npm install 2>&1 | Out-Null
    Write-Host "  ✓ snarkjs installed" -ForegroundColor Green
    
    if ($hasCircom) {
        Write-Host "  Compiling Circom circuit..."
        circom insurance_eligibility.circom --r1cs --wasm --sym --output .
        
        # Download Powers of Tau file if not present
        if (-not (Test-Path "pot12_final.ptau")) {
            Write-Host "  Downloading Powers of Tau (hermez 12)..."
            $ptauUrl = "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau"
            Invoke-WebRequest -Uri $ptauUrl -OutFile "pot12_final.ptau" -UseBasicParsing
        }
        
        Write-Host "  Running Groth16 trusted setup..."
        & npx snarkjs groth16 setup insurance_eligibility.r1cs pot12_final.ptau insurance_eligibility_0.zkey 2>&1 | Out-Null
        
        Write-Host "  Contributing randomness..."
        $random = [System.Guid]::NewGuid().ToString()
        echo $random | npx snarkjs zkey contribute insurance_eligibility_0.zkey insurance_eligibility_final.zkey --name="AgriProof Contribution" 2>&1 | Out-Null
        
        Write-Host "  Exporting verification key..."
        npx snarkjs zkey export verificationkey insurance_eligibility_final.zkey verification_key.json 2>&1 | Out-Null
        
        Write-Host "  Testing proof round-trip..."
        node test_proof.js
        
        Write-Host "  ✓ ZK circuits compiled and tested" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Circom not found — ZK mock mode will be used" -ForegroundColor Yellow
        Write-Host "    Install Circom: https://docs.circom.io/getting-started/installation/" -ForegroundColor Yellow
        Write-Host "    Mock proofs will be used for demo (same schema, simulated)" -ForegroundColor Yellow
    }
    
    Set-Location $ProjectRoot
}

# ─── Step 3: Train ML Models ──────────────────────────────────────────────

if (-not $SkipModels) {
    Write-Host ""
    Write-Host "Step 3/4: Training ML models on synthetic data..." -ForegroundColor Cyan
    Set-Location "$ProjectRoot\backend"
    & ".\venv\Scripts\Activate.ps1"
    python -m app.services.ml.train
    Write-Host "  ✓ Models trained and saved to models/" -ForegroundColor Green
    Set-Location $ProjectRoot
}

# ─── Step 4: Frontend ─────────────────────────────────────────────────────

if (-not $SkipFrontend) {
    Write-Host ""
    Write-Host "Step 4/4: Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location "$ProjectRoot\frontend"
    npm install 2>&1 | Out-Null
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
    Set-Location $ProjectRoot
}

# ─── Done ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " ✅ Setup Complete!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "    uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "    cd frontend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Open: http://localhost:5173" -ForegroundColor Green
Write-Host "  API docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
