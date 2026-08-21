$ErrorActionPreference = "Stop"

Write-Host "Checking for circom..."
if (-not (Get-Command circom -ErrorAction SilentlyContinue)) {
    Write-Warning "circom is not installed. Please install it from https://docs.circom.io/"
}

Write-Host "Checking for snarkjs..."
if (-not (Get-Command snarkjs -ErrorAction SilentlyContinue)) {
    Write-Warning "snarkjs is not installed. Run 'npm install -g snarkjs'"
}

Write-Host "Compiling circuit..."
circom insurance_eligibility.circom --r1cs --wasm --sym

Write-Host "Downloading Powers of Tau file..."
if (-not (Test-Path pot12_final.ptau)) {
    Invoke-WebRequest -Uri "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau" -OutFile "pot12_final.ptau"
}

Write-Host "Running Groth16 setup..."
snarkjs groth16 setup insurance_eligibility.r1cs pot12_final.ptau insurance_eligibility_0.zkey

Write-Host "Contributing randomness..."
snarkjs zkey contribute insurance_eligibility_0.zkey insurance_eligibility_final.zkey -e "random text here" -v

Write-Host "Exporting verification key..."
snarkjs zkey export verificationkey insurance_eligibility_final.zkey verification_key.json

Write-Host "Generating test witness and proof..."
node insurance_eligibility_js/generate_witness.js insurance_eligibility_js/insurance_eligibility.wasm input.json witness.wtns
snarkjs groth16 prove insurance_eligibility_final.zkey witness.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json

Write-Host "Setup complete! Generated files:"
Get-ChildItem -File | Select-Object Name
