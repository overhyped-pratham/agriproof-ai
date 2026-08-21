const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const wasmPath = path.join(__dirname, "insurance_eligibility_js", "insurance_eligibility.wasm");
const zkeyPath = path.join(__dirname, "insurance_eligibility_final.zkey");
const vKeyPath = path.join(__dirname, "verification_key.json");

async function generateProof(ndviDrop, rainAnomaly, yieldLoss) {
    const input = {
        ndvi_drop: ndviDrop,
        rain_anomaly: rainAnomaly,
        yield_loss: yieldLoss
    };
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    return { proof, publicSignals };
}

async function verifyProof(proof, publicSignals) {
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf-8"));
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    return res;
}

async function main() {
    console.log("Testing ELIGIBLE case...");
    const { proof: p1, publicSignals: ps1 } = await generateProof("3500", "5200", "3800");
    const valid1 = await verifyProof(p1, ps1);
    console.log(`ELIGIBLE case: proof_valid=${valid1}, eligible=${ps1[0]}`);

    console.log("Testing NOT ELIGIBLE case...");
    const { proof: p2, publicSignals: ps2 } = await generateProof("1200", "2000", "1500");
    const valid2 = await verifyProof(p2, ps2);
    console.log(`NOT ELIGIBLE case: proof_valid=${valid2}, eligible=${ps2[0]}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateProof, verifyProof };
