# AgriProof AI Circuits

This directory contains the zero-knowledge circuits for AgriProof AI.

## Circuit Design
The `insurance_eligibility.circom` circuit proves that a farmer is eligible for crop insurance without revealing their actual environmental metrics. 
The conditions for eligibility are:
- NDVI Drop > 30.00%
- Rain Anomaly > 40.00%
- Yield Loss > 25.00%

Inputs are given scaled by 100 (e.g., 3000 for 30%). If all conditions are met, the circuit outputs `1` (eligible), otherwise `0`.

## Setup Instructions

You can set up the circuit and generate keys using either the Windows PowerShell script or the Linux/Mac Bash script.

### Windows (PowerShell)
```powershell
./setup.ps1
```

### Linux / macOS (Bash)
```bash
./setup.sh
```

## Running Proofs

Install dependencies first:
```bash
npm install
```

### Generating a Proof
You can use the standalone script:
```bash
node generate_proof.js 3500 5200 3800
```
This will output a JSON containing the proof, public signals, eligibility, and a proof hash.

### Verifying a Proof
```bash
node verify_proof.js '<proof_json_string>' '<public_signals_json_string>'
```

### Testing
To run a test with both eligible and non-eligible inputs:
```bash
node test_proof.js
```
