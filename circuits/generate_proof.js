const snarkjs = require("snarkjs");
const path = require("path");
const crypto = require("crypto");

async function main() {
    try {
        if (process.argv.length < 5) {
            throw new Error("Usage: node generate_proof.js <ndvi_drop> <rain_anomaly> <yield_loss>");
        }

        const ndvi_drop = process.argv[2];
        const rain_anomaly = process.argv[3];
        const yield_loss = process.argv[4];

        const wasmPath = path.join(__dirname, "insurance_eligibility_js", "insurance_eligibility.wasm");
        const zkeyPath = path.join(__dirname, "insurance_eligibility_final.zkey");

        const input = {
            ndvi_drop,
            rain_anomaly,
            yield_loss
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

        const proofStr = JSON.stringify(proof);
        const proofHash = crypto.createHash("sha256").update(proofStr).digest("hex");
        
        const output = {
            proof,
            publicSignals,
            eligible: publicSignals[0] === "1",
            proof_hash: proofHash
        };

        console.log(JSON.stringify(output, null, 2));
    } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
    }
}

main();
