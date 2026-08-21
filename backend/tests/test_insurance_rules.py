import pytest
from app.services.insurance.rules_engine import InsuranceRulesEngine

def test_eligible_standard():
    engine = InsuranceRulesEngine()
    result = engine.evaluate(
        policy_id="POLICY-001",
        ndvi_drop_pct=35.0,  # >= 30 (True)
        rain_anomaly_abs_pct=45.0,  # >= 40 (True)
        yield_loss_pct=26.0  # >= 25 (True)
    )
    assert result["eligible"] is True
    assert result["conditions_met"]["ndvi_drop"] is True
    assert result["conditions_met"]["rain_anomaly"] is True
    assert result["conditions_met"]["yield_loss"] is True

def test_ineligible_standard():
    engine = InsuranceRulesEngine()
    result = engine.evaluate(
        policy_id="POLICY-001",
        ndvi_drop_pct=10.0,  # False
        rain_anomaly_abs_pct=20.0,  # False
        yield_loss_pct=30.0  # True
    )
    # Only 1 condition met, needs 2
    assert result["eligible"] is False
    assert result["conditions_met"]["ndvi_drop"] is False
    assert result["conditions_met"]["rain_anomaly"] is False
    assert result["conditions_met"]["yield_loss"] is True

def test_premium_eligible_with_lower_thresholds():
    engine = InsuranceRulesEngine()
    # Standard would fail on these, but premium should pass
    result = engine.evaluate(
        policy_id="POLICY-002",
        ndvi_drop_pct=22.0,  # >= 20 (True)
        rain_anomaly_abs_pct=35.0,  # >= 30 (True)
        yield_loss_pct=10.0  # < 15 (False)
    )
    # 2 conditions met
    assert result["eligible"] is True
