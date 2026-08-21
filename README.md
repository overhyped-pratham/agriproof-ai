# AgriProof AI 🌾🛡️
### Satellite-Verified Crop Risk & Privacy-Preserving Insurance Engine with Zero-Knowledge Proofs

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react)](https://react.dev)
[![Circom](https://img.shields.io/badge/Circom-2.0+-FF8C00.svg)](https://docs.circom.io)
[![SnarkJS](https://img.shields.io/badge/SnarkJS-Groth16-blueviolet.svg)](https://github.com/iden3/snarkjs)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML_Risk_Engine-orange.svg)](https://xgboost.readthedocs.io)

---

## 📌 Executive Summary

Traditional agricultural insurance is plagued by slow claim processing, manual field assessments, verification friction, and vulnerability to fraud. Most critically, farmers are forced to disclose sensitive details (exact GPS coordinates, full yield history, financial bounds) to insurance carriers.

**AgriProof AI (SW-04)** eliminates this paradigm by fusing **Sentinel-2 Earth Observation**, **meteorological intelligence (Open-Meteo)**, **XGBoost AI risk prediction**, and **Zero-Knowledge Proofs (zk-SNARKs via Circom/SnarkJS)** with a **tamper-proof SHA-256 claim ledger**.

> **The Core Innovation**: A farmer cryptographically proves their farm fulfills all parameterized insurance payout conditions (e.g. $\Delta\text{NDVI} > 30\%$, $\Delta\text{Rainfall} > 40\%$, $\Delta\text{Yield Loss} > 25\%$) **without revealing their exact farm location, identity, or private metrics**.

---

## 🏛️ End-to-End Architecture

```
                                      FARMER
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │   React + Tailwind UI   │
                           │  (Leaflet Polygon Draw) │
                           └────────────┬────────────┘
                                        │ REST / WebSocket
                                        ▼
                           ┌─────────────────────────┐
                           │   FastAPI Orchestrator  │
                           └────────────┬────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
      ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
      │  Sentinel-2 Hub  │    │ Open-Meteo Intel │    │ Farm Commitment  │
      │  (eo-learn /     │    │ (Historical /    │    │ (SHA-256 Hash    │
      │   s2cloudless)   │    │  Forecast Anom)  │    │  Privacy Vault)  │
      └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                │                       │                       │
                └───────────────┬───────┘                       │
                                ▼                               │
                    ┌─────────────────────────┐                 │
                    │   AI/ML Risk Engine     │                 │
                    │   • NDVI/EVI/NDWI/NDMI  │                 │
                    │   • XGBoost Yield Model │                 │
                    │   • Damage Classifier   │                 │
                    │   • Composite Risk (0-100)                │
                    └────────────┬────────────┘                 │
                                 │ Private Parameters           │
                                 ▼                              │
                    ┌─────────────────────────┐                 │
                    │  Zero-Knowledge Core    │                 │
                    │  (Circom + SnarkJS)     │                 │
                    │  Groth16 zk-SNARK Proof │                 │
                    └────────────┬────────────┘                 │
                                 │ Proof + Public Claim ID      │
                                 ▼                              ▼
                    ┌───────────────────────────────────────────┐
                    │       Tamper-Proof Claim Ledger           │
                    │      (Immutable SHA-256 Hash Chain)       │
                    └────────────────────┬──────────────────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │   Insurer Dashboard   │
                             │ (ZK Verify & Payout)  │
                             └───────────────────────┘
```

---

## 🔑 Key Features & Mathematical Foundations

### 1. Privacy-Preserving Farm Commitments
The raw farm boundary polygon is never published to public entities or the claim ledger:
$$\text{FarmCommitment} = \text{SHA-256}(\text{Sort}(\text{Coordinates}) \parallel \text{Salt})$$

### 2. Multi-Spectral Satellite Intelligence Pipeline
Extracts optical bands from Sentinel-2 ($B_{02}, B_{03}, B_{04}, B_{08}, B_{11}, B_{12}$):
- **Normalized Difference Vegetation Index (NDVI)**:
  $$\text{NDVI} = \frac{B_{08} - B_{04}}{B_{08} + B_{04}}$$
- **Enhanced Vegetation Index (EVI)**:
  $$\text{EVI} = 2.5 \cdot \frac{B_{08} - B_{04}}{B_{08} + 6 B_{04} - 7.5 B_{02} + 1}$$
- **Normalized Difference Water Index (NDWI)**:
  $$\text{NDWI} = \frac{B_{03} - B_{08}}{B_{03} + B_{08}}$$
- **Normalized Difference Moisture Index (NDMI)**:
  $$\text{NDMI} = \frac{B_{08} - B_{11}}{B_{08} + B_{11}}$$

### 3. Unified Composite Risk Score
$$\text{RiskScore} = (\text{SatelliteHealth} \times 0.30) + (\text{WeatherRisk} \times 0.30) + (\text{YieldLoss} \times 0.25) + (\text{HistoricalAnomaly} \times 0.15)$$

### 4. Zero-Knowledge Circuit Specification
Using **Circom 2.0+** with 32-bit `GreaterThan` comparators over Groth16 curve BN128:
- **Private Signals**: $\text{ndvi\_drop}$, $\text{rain\_anomaly}$, $\text{yield\_loss}$
- **Public Signal**: $\text{eligible} \in \{0, 1\}$
- **Constraint**:
  $$\text{eligible} = (\text{ndvi\_drop} > 3000) \land (\text{rain\_anomaly} > 4000) \land (\text{yield\_loss} > 2500)$$

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ & npm
- *(Optional)*: Circom compiler (mock fallback is built-in if Circom binary is absent)

### Option 1: Automated Script (Recommended)

#### Windows (PowerShell):
```powershell
.\setup.ps1
```

#### Linux / macOS:
```bash
chmod +x setup.sh
./setup.sh
```

---

### Option 2: Manual Step-by-Step

#### 1. Setup Backend & Train AI Models
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate | On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python -m app.services.ml.train
```

#### 2. Setup ZK Circuits
```bash
cd ../circuits
npm install
node test_proof.js
```

#### 3. Setup & Launch Frontend
```bash
cd ../frontend
npm install
npm run dev
```

#### 4. Launch Backend Server
```bash
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Demo Scenarios (Pre-seeded for Judges)

| Scenario ID | Name & Location | Crop Type | Trigger Condition | Status |
|---|---|---|---|---|
| `demo-farm-001` | **Patiala Farm, Punjab** | Wheat | Severe Drought ($\Delta\text{NDVI} -41.5\%$, $\text{Rain} -58.3\%$) | ✅ **ELIGIBLE (ZK Verified)** |
| `demo-farm-002` | **Thrissur Farm, Kerala** | Rice | Monsoon Flood ($\text{Rain} +82.1\%$, $\text{NDWI} +0.45$) | ✅ **ELIGIBLE (ZK Verified)** |
| `demo-farm-003` | **Nagpur Farm, Maharashtra** | Soybean | Normal Growth ($\Delta\text{NDVI} -4.7\%$, Healthy Yield) | ❌ **NOT ELIGIBLE** |

---

## 📁 Repository Map

```
agriproof-ai/
├── circuits/                       # Circom ZK-SNARK circuits & SnarkJS runners
│   ├── insurance_eligibility.circom # Core eligibility circuit
│   ├── generate_proof.js           # CLI proof generation
│   ├── verify_proof.js             # CLI proof verification
│   └── test_proof.js               # Automated circuit tests
├── backend/                        # FastAPI Python Core
│   ├── app/
│   │   ├── api/routes/             # Farm, Claim, Ledger & WebSocket endpoints
│   │   ├── models/                 # SQLAlchemy & Pydantic schema models
│   │   └── services/
│   │       ├── satellite/          # Multi-spectral calculations & cloud masking
│   │       ├── weather/            # Open-Meteo risk analysis
│   │       ├── ml/                 # XGBoost yield & damage models
│   │       ├── zk/                 # ZK proof orchestrator
│   │       └── ledger/             # SHA-256 tamper-proof blockchain
│   └── requirements.txt
├── frontend/                       # Vite + React + Tailwind + Leaflet
│   ├── src/
│   │   ├── pages/                  # Landing, Register, Dashboard, Satellite, Claim, Ledger
│   │   └── components/             # RiskGauge, NDVIChart, ZKProofCard, FarmMap, etc.
│   └── package.json
├── models/                         # Serialized XGBoost & ML model weights
├── data/                           # Demo scenarios & pre-seeded farms
├── docker-compose.yml              # Containerized deployment
├── Makefile                        # One-command orchestration
└── README.md                       # Comprehensive documentation
```

---

## 🛡️ Tamper-Proof Claim Ledger Specification

Each claim submitted to AgriProof AI creates an immutable block appended to the chain:

```json
{
  "block_index": 1,
  "timestamp": "2026-08-20T00:45:00Z",
  "claim_id": "CLM-4821",
  "farmer_commitment": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "satellite_evidence_hash": "a1b2c3d4e5f6...",
  "prediction_hash": "f6e5d4c3b2a1...",
  "zk_proof_hash": "8c7b6a5d4e3f...",
  "eligible": true,
  "previous_block_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "block_hash": "d4f3e2a1..."
}
```

---

## 🏆 Hackathon Winning Pitch

> **"We don't just predict crop loss. We create verifiable, privacy-preserving insurance claims directly from satellite and meteorological intelligence."**
