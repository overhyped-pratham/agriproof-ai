#!/bin/bash
# AgriProof AI Setup Script (Linux / macOS)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_ZK=${SKIP_ZK:-false}
SKIP_MODELS=${SKIP_MODELS:-false}
SKIP_FRONTEND=${SKIP_FRONTEND:-false}

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN} AgriProof AI — Satellite-Verified Crop Insurance${NC}"
echo -e "${GREEN} Zero-Knowledge Proof Engine Setup${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""

# ─── Prerequisites ────────────────────────────────────────────────────────

echo -e "${CYAN}Checking prerequisites...${NC}"

check_cmd() {
    if command -v "$1" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $2 found"
        return 0
    else
        echo -e "  ${YELLOW}✗${NC} $2 NOT found — Install from: $3"
        return 1
    fi
}

check_cmd python3 "Python 3.10+" "https://python.org" || exit 1
check_cmd node "Node.js 18+" "https://nodejs.org" || exit 1
check_cmd npm "npm" "https://nodejs.org" || exit 1
HAS_CIRCOM=false
check_cmd circom "Circom" "https://docs.circom.io/getting-started/installation/" && HAS_CIRCOM=true || true

# ─── Step 1: Backend ──────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}Step 1/4: Installing Python dependencies...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo -e "  ${GREEN}✓${NC} Python dependencies installed"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
fi

cd "$PROJECT_ROOT"

# ─── Step 2: ZK Circuits ──────────────────────────────────────────────────

if [ "$SKIP_ZK" != "true" ]; then
    echo ""
    echo -e "${CYAN}Step 2/4: Setting up ZK circuits...${NC}"
    cd "$PROJECT_ROOT/circuits"
    
    npm install 2>/dev/null
    echo -e "  ${GREEN}✓${NC} snarkjs installed"
    
    if [ "$HAS_CIRCOM" = "true" ]; then
        echo "  Compiling Circom circuit..."
        circom insurance_eligibility.circom --r1cs --wasm --sym --output .
        
        if [ ! -f "pot12_final.ptau" ]; then
            echo "  Downloading Powers of Tau (hermez 12)..."
            curl -L "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau" -o pot12_final.ptau
        fi
        
        echo "  Running Groth16 trusted setup..."
        npx snarkjs groth16 setup insurance_eligibility.r1cs pot12_final.ptau insurance_eligibility_0.zkey 2>/dev/null
        
        echo "  Contributing randomness..."
        echo "agriproof-random-$(date +%s)" | npx snarkjs zkey contribute insurance_eligibility_0.zkey insurance_eligibility_final.zkey --name="AgriProof Contribution" 2>/dev/null
        
        echo "  Exporting verification key..."
        npx snarkjs zkey export verificationkey insurance_eligibility_final.zkey verification_key.json 2>/dev/null
        
        echo "  Testing proof round-trip..."
        node test_proof.js
        
        echo -e "  ${GREEN}✓${NC} ZK circuits compiled and tested"
    else
        echo -e "  ${YELLOW}⚠${NC} Circom not found — ZK mock mode will be used"
        echo -e "    Install from: https://docs.circom.io/getting-started/installation/"
    fi
    
    cd "$PROJECT_ROOT"
fi

# ─── Step 3: Train Models ─────────────────────────────────────────────────

if [ "$SKIP_MODELS" != "true" ]; then
    echo ""
    echo -e "${CYAN}Step 3/4: Training ML models on synthetic data...${NC}"
    cd "$PROJECT_ROOT/backend"
    source venv/bin/activate
    python -m app.services.ml.train
    echo -e "  ${GREEN}✓${NC} Models trained and saved to models/"
    cd "$PROJECT_ROOT"
fi

# ─── Step 4: Frontend ─────────────────────────────────────────────────────

if [ "$SKIP_FRONTEND" != "true" ]; then
    echo ""
    echo -e "${CYAN}Step 4/4: Installing frontend dependencies...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npm install 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
    cd "$PROJECT_ROOT"
fi

# ─── Done ─────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN} ✅ Setup Complete!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo -e "${CYAN}Start the application:${NC}"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && source venv/bin/activate"
echo "    uvicorn app.main:app --reload"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo -e "  ${GREEN}Open: http://localhost:5173${NC}"
echo -e "  ${GREEN}API docs: http://localhost:8000/docs${NC}"
echo ""
