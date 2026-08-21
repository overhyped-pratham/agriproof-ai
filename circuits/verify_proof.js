const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    try {
        if (process.argv.length < 4) {
            throw new Error("Usage: node verify_proof.js '<proof_json>' '<public_signals_json>'");
        }

        const proof = JSON.parse(process.argv[2]);
        const publicSignals = JSON.parse(process.argv[3]);
        
        const vKeyPath = path.join(__dirname, "verification_key.json");
        const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf-8"));

        const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        if (valid) {
            console.log(JSON.stringify({ valid: true, message: "Proof verified successfully" }));
        } else {
            console.log(JSON.stringify({ valid: false, message: "Invalid proof" }));
        }
    } catch (err) {
        console.error(JSON.stringify({ valid: false, error: err.message }));
        process.exit(1);
    }
}

main();
