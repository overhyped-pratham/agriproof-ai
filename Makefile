# ============================================================
# AgriProof AI — Root Makefile
# One-command setup and run
# ============================================================

.PHONY: all setup setup-zk setup-backend setup-frontend train-models run-backend run-frontend run demo clean help

# Default target
all: help

# ============================================================
# SETUP
# ============================================================

## Full setup (ZK circuits + backend deps + frontend deps + model training)
setup: setup-zk setup-backend setup-frontend train-models
	@echo ""
	@echo "✅ AgriProof AI setup complete!"
	@echo ""
	@echo "Start the app:"
	@echo "  make run"

## Compile ZK circuits and generate proving/verification keys
setup-zk:
	@echo "🔐 Setting up ZK circuits..."
	@cd circuits && npm install
	@cd circuits && node -e "require('snarkjs')" 2>/dev/null || npm install -g snarkjs
	@which circom 2>/dev/null || (echo "⚠️  Circom not found. Install from: https://docs.circom.io/getting-started/installation/" && echo "   Skipping circuit compilation — mock ZK mode will be used.")
	@which circom 2>/dev/null && cd circuits && bash setup.sh || true
	@echo "✅ ZK setup complete (or mock mode enabled)"

## Install Python backend dependencies
setup-backend:
	@echo "🐍 Setting up Python backend..."
	@cd backend && pip install -r requirements.txt
	@echo "✅ Backend dependencies installed"

## Install Node.js frontend dependencies  
setup-frontend:
	@echo "⚛️  Setting up React frontend..."
	@cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

## Train XGBoost models on synthetic data
train-models:
	@echo "🤖 Training ML models..."
	@cd backend && python -m app.services.ml.train
	@echo "✅ Models trained and saved to models/"

# ============================================================
# RUN
# ============================================================

## Start backend API server (http://localhost:8000)
run-backend:
	@echo "🚀 Starting FastAPI backend on http://localhost:8000"
	@cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## Start frontend dev server (http://localhost:5173)
run-frontend:
	@echo "🌐 Starting React frontend on http://localhost:5173"
	@cd frontend && npm run dev

## Start everything (requires two terminals or use tmux/concurrently)
run:
	@echo "Starting AgriProof AI..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo "API docs: http://localhost:8000/docs"
	@echo ""
	@echo "Run these in separate terminals:"
	@echo "  make run-backend"
	@echo "  make run-frontend"

# ============================================================
# DEMO
# ============================================================

## Seed the database with demo farm scenarios
demo:
	@echo "🌾 Seeding demo scenarios..."
	@cd backend && python -c "from app.services.demo.seed import seed_demo_data; import asyncio; asyncio.run(seed_demo_data())"
	@echo "✅ Demo data seeded"

# ============================================================
# TEST
# ============================================================

## Run all backend tests
test:
	@echo "🧪 Running backend tests..."
	@cd backend && pytest tests/ -v

## Test ZK proof round-trip
test-zk:
	@echo "🔐 Testing ZK proof round-trip..."
	@cd circuits && node test_proof.js

# ============================================================
# CLEAN
# ============================================================

## Remove generated files (models, DB, compiled circuits)
clean:
	@rm -f backend/agriproof.db
	@rm -f models/*.pkl models/*.pt
	@rm -f circuits/*.r1cs circuits/*.sym circuits/*.wasm circuits/*.zkey circuits/verification_key.json
	@rm -rf circuits/insurance_eligibility_js/
	@echo "✅ Cleaned generated files"

# ============================================================
# HELP
# ============================================================

## Show this help
help:
	@echo ""
	@echo "AgriProof AI — Satellite-Verified Crop Insurance"
	@echo "================================================"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          Full setup (ZK + backend + frontend + models)"
	@echo "  make setup-zk       Compile ZK circuits"
	@echo "  make setup-backend  Install Python dependencies"
	@echo "  make setup-frontend Install Node.js dependencies"
	@echo "  make train-models   Train XGBoost models"
	@echo ""
	@echo "Run:"
	@echo "  make run-backend    Start FastAPI (localhost:8000)"
	@echo "  make run-frontend   Start React (localhost:5173)"
	@echo ""
	@echo "Demo:"
	@echo "  make demo           Seed demo farm scenarios"
	@echo ""
	@echo "Test:"
	@echo "  make test           Run backend unit tests"
	@echo "  make test-zk        Test ZK proof round-trip"
	@echo ""
	@echo "  make clean          Remove generated files"
	@echo ""
