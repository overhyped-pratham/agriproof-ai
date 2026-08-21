#!/bin/bash
set -e

echo "Checking for circom..."
if ! command -v circom &> /dev/null; then
    echo "Warning: circom is not installed. Please install it from https://docs.circom.io/"
fi

echo "Checking for snarkjs..."
if ! command -v snarkjs &> /dev/null; then
    echo "Warning: snarkjs is not installed. Run 'npm install -g snarkjs'"
fi

echo "Compiling circuit..."
circom insurance_eligibility.circom --r1cs --wasm --sym

echo "Downloading Powers of Tau file..."
if [ ! -f pot12_final.ptau ]; then
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o pot12_final.ptau
fi

echo "Running Groth16 setup..."
snarkjs groth16 setup insurance_eligibility.r1cs pot12_final.ptau insurance_eligibility_0.zkey

echo "Contributing randomness..."
echo "random entropy" | snarkjs zkey contribute insurance_eligibility_0.zkey insurance_eligibility_final.zkey

echo "Exporting verification key..."
snarkjs zkey export verificationkey insurance_eligibility_final.zkey verification_key.json

echo "Generating test witness and proof..."
node insurance_eligibility_js/generate_witness.js insurance_eligibility_js/insurance_eligibility.wasm input.json witness.wtns
snarkjs groth16 prove insurance_eligibility_final.zkey witness.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json

echo "Setup complete! Generated files:"
ls -l
