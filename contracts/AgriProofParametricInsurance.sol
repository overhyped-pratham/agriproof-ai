// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IGroth16Verifier
 * @notice Interface for Circom SnarkJS Groth16 verifier contract.
 */
interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) external view returns (bool r);
}

/**
 * @title IERC20Minimal
 * @notice Minimal ERC-20 interface for automated USDC/stablecoin payouts.
 */
interface IERC20Minimal {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AgriProofParametricInsurance
 * @notice Zero-Trust Satellite-Verified Parametric Crop Insurance with ZK Proofs.
 * Insurers pool liquidity; farmers receive instant, guaranteed payouts when
 * objective satellite triggers (NDVI drop, drought, yield loss) are proven via zk-SNARKs.
 */
contract AgriProofParametricInsurance {
    address public immutable insurerAdmin;
    IGroth16Verifier public verifier;
    IERC20Minimal public immutable payoutToken;

    struct Policy {
        bytes32 policyId;
        bytes32 farmCommitment; // SHA-256(Sort(Coordinates) || Salt)
        address farmer;
        uint256 coverageAmount; // Payout in token base units (e.g., 5000 USDC)
        uint256 premiumAmount;
        uint256 validUntil;
        bool isClaimed;
        bool isActive;
    }

    struct ClaimRecord {
        bytes32 claimId;
        bytes32 policyId;
        bytes32 evidenceHash;
        uint256 payoutAmount;
        uint256 settledAtBlock;
        string txHash;
    }

    mapping(bytes32 => Policy) public policies;
    mapping(bytes32 => ClaimRecord) public claims;
    mapping(address => bytes32[]) public farmerPolicies;
    bytes32[] public allPolicyIds;

    event PolicyCreated(bytes32 indexed policyId, address indexed farmer, bytes32 farmCommitment, uint256 coverage);
    event ClaimSettled(bytes32 indexed claimId, bytes32 indexed policyId, address indexed farmer, uint256 amount);
    event LiquidityDeposited(address indexed depositor, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == insurerAdmin, "AgriProof: Only insurer admin permitted");
        _;
    }

    constructor(address _verifier, address _payoutToken) {
        insurerAdmin = msg.sender;
        verifier = IGroth16Verifier(_verifier);
        payoutToken = IERC20Minimal(_payoutToken);
    }

    function updateVerifier(address _newVerifier) external onlyAdmin {
        require(_newVerifier != address(0), "Invalid address");
        verifier = IGroth16Verifier(_newVerifier);
    }

    /**
     * @notice Registers a new parametric policy with zero-PII farm commitment hash.
     */
    function registerPolicy(
        bytes32 policyId,
        bytes32 farmCommitment,
        address farmer,
        uint256 coverageAmount,
        uint256 premiumAmount,
        uint256 durationDays
    ) external onlyAdmin {
        require(!policies[policyId].isActive, "AgriProof: Policy ID already exists");
        require(farmer != address(0), "AgriProof: Invalid farmer address");

        policies[policyId] = Policy({
            policyId: policyId,
            farmCommitment: farmCommitment,
            farmer: farmer,
            coverageAmount: coverageAmount,
            premiumAmount: premiumAmount,
            validUntil: block.timestamp + (durationDays * 1 days),
            isClaimed: false,
            isActive: true
        });

        farmerPolicies[farmer].push(policyId);
        allPolicyIds.push(policyId);

        emit PolicyCreated(policyId, farmer, farmCommitment, coverageAmount);
    }

    /**
     * @notice Verifies the Groth16 zk-SNARK proof and triggers instantaneous parametric payout.
     * @param policyId Policy identifier.
     * @param claimId Unique claim tracking identifier.
     * @param evidenceHash Canonical hash of satellite multi-spectral observation cube.
     * @param a zk-SNARK proof point A.
     * @param b zk-SNARK proof point B.
     * @param c zk-SNARK proof point C.
     */
    function verifyAndDisbursePayout(
        bytes32 policyId,
        bytes32 claimId,
        bytes32 evidenceHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c
    ) external {
        Policy storage policy = policies[policyId];
        require(policy.isActive, "AgriProof: Policy not active");
        require(!policy.isClaimed, "AgriProof: Policy already settled and paid");
        require(block.timestamp <= policy.validUntil, "AgriProof: Policy expired");

        // Public signal: eligible must equal 1
        uint256[1] memory publicSignals = [uint256(1)];

        // Cryptographic ZK Verification (Circom BN128)
        if (address(verifier) != address(0)) {
            bool valid = verifier.verifyProof(a, b, c, publicSignals);
            require(valid, "AgriProof: ZK Proof Verification Failed (Metrics below policy trigger)");
        }

        // Mark policy as claimed
        policy.isClaimed = true;
        policy.isActive = false;

        // Record immutable claim
        claims[claimId] = ClaimRecord({
            claimId: claimId,
            policyId: policyId,
            evidenceHash: evidenceHash,
            payoutAmount: policy.coverageAmount,
            settledAtBlock: block.number,
            txHash: ""
        });

        // Execute ERC-20 transfer to farmer wallet
        if (address(payoutToken) != address(0)) {
            require(
                payoutToken.transfer(policy.farmer, policy.coverageAmount),
                "AgriProof: Stablecoin payout transfer failed (Insufficient pool liquidity)"
            );
        }

        emit ClaimSettled(claimId, policyId, policy.farmer, policy.coverageAmount);
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function getFarmerPolicies(address farmer) external view returns (bytes32[] memory) {
        return farmerPolicies[farmer];
    }
}
