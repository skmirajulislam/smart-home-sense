#!/usr/bin/env python3
"""
End-to-end integration tests for Smart Home Sense API.
Tests critical ML logic, safety rules, and API validation.
"""

from app.services.model_service import ModelService
from app.services.safety_service import SafetyService
from app.schemas.prediction import PredictionRequest
from app.schemas.telemetry import TelemetrySensors, TelemetrySnapshot


def test_safe_environment():
    """Test normal/safe environmental conditions."""
    print("\n🧪 Test 1: Safe Environment")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=22,
        humidity=45,
        aqi=40,
        gas=100,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Safe", f"Expected Safe, got {pred}"
    print(f"✅ PASS: Safe environment correctly identified")
    print(f"   Prediction: {pred}")
    print(f"   Probabilities: {probs}")


def test_warning_environment():
    """Test warning-level environmental conditions."""
    print("\n🧪 Test 2: Warning Environment")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=23,
        humidity=70,
        aqi=150,
        gas=400,
        motion=1
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred in ["Warning", "Danger"], f"Expected Warning/Danger, got {pred}"
    print(f"✅ PASS: Warning environment correctly identified")
    print(f"   Prediction: {pred}")
    print(f"   Probabilities: {probs}")


def test_dangerous_environment():
    """Test dangerous environmental conditions."""
    print("\n🧪 Test 3: Dangerous Environment")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=18,
        humidity=80,
        aqi=250,
        gas=1000,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger, got {pred}"
    print(f"✅ PASS: Dangerous environment correctly identified")
    print(f"   Prediction: {pred}")
    print(f"   Probabilities: {probs}")


def test_extreme_humidity():
    """Test extreme humidity safety override (100%)."""
    print("\n🧪 Test 4: Extreme Humidity Safety Override")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=25,
        humidity=100,
        aqi=50,
        gas=100,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger override for humidity=100, got {pred}"
    print(f"✅ PASS: Extreme humidity correctly triggers Danger")
    print(f"   Prediction: {pred} (safety override applied)")


def test_extreme_aqi():
    """Test extreme AQI safety override (300+)."""
    print("\n🧪 Test 5: Extreme AQI Safety Override")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=25,
        humidity=60,
        aqi=350,
        gas=100,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger override for AQI=350, got {pred}"
    print(f"✅ PASS: Extreme AQI correctly triggers Danger")
    print(f"   Prediction: {pred} (safety override applied)")


def test_extreme_temperature_high():
    """Test extreme high temperature safety override (50°C)."""
    print("\n🧪 Test 6: Extreme High Temperature Safety Override")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=50,
        humidity=40,
        aqi=50,
        gas=100,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger override for temperature=50, got {pred}"
    print(f"✅ PASS: Extreme temperature correctly triggers Danger")
    print(f"   Prediction: {pred} (safety override applied)")


def test_extreme_temperature_low():
    """Test extreme low temperature safety override (0°C)."""
    print("\n🧪 Test 7: Extreme Low Temperature Safety Override")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=0,
        humidity=30,
        aqi=50,
        gas=100,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger override for temperature=0, got {pred}"
    print(f"✅ PASS: Extreme low temperature correctly triggers Danger")
    print(f"   Prediction: {pred} (safety override applied)")


def test_extreme_gas():
    """Test extreme gas safety override (2000+)."""
    print("\n🧪 Test 8: Extreme Gas Safety Override")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=25,
        humidity=65,
        aqi=100,
        gas=2500,
        motion=0
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred == "Danger", f"Expected Danger override for gas=2500, got {pred}"
    print(f"✅ PASS: Extreme gas correctly triggers Danger")
    print(f"   Prediction: {pred} (safety override applied)")


def test_high_aqi_warning():
    """Test high AQI that should be Warning (200-300 range)."""
    print("\n🧪 Test 9: High AQI Warning Level")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=23,
        humidity=50,
        aqi=250,
        gas=150,
        motion=1
    )
    pred, idx, probs, _ = model_svc.predict(req)
    assert pred != "Safe", f"Expected Warning/Danger, got {pred}"
    print(f"✅ PASS: High AQI correctly triggers {pred}")
    print(f"   Prediction: {pred}")


def test_validation_rejects_invalid_humidity():
    """Test that validation rejects humidity > 100."""
    print("\n🧪 Test 10: Validation Rejects Invalid Humidity")
    try:
        req = PredictionRequest(
            temperature=25,
            humidity=150,  # Invalid: > 100
            aqi=50,
            gas=100,
            motion=0
        )
        assert False, "Should have raised validation error"
    except Exception as e:
        assert "humidity" in str(e).lower()
        print(f"✅ PASS: Invalid humidity correctly rejected")
        print(f"   Error: {e}")


def test_validation_rejects_invalid_temperature():
    """Test that validation rejects extreme temperature."""
    print("\n🧪 Test 11: Validation Rejects Invalid Temperature")
    try:
        req = PredictionRequest(
            temperature=-100,  # Invalid: < -50
            humidity=50,
            aqi=50,
            gas=100,
            motion=0
        )
        assert False, "Should have raised validation error"
    except Exception as e:
        assert "temperature" in str(e).lower()
        print(f"✅ PASS: Invalid temperature correctly rejected")
        print(f"   Error: {e}")


def test_validation_rejects_invalid_aqi():
    """Test that validation rejects AQI > 500."""
    print("\n🧪 Test 12: Validation Rejects Invalid AQI")
    try:
        req = PredictionRequest(
            temperature=25,
            humidity=50,
            aqi=600,  # Invalid: > 500
            gas=100,
            motion=0
        )
        assert False, "Should have raised validation error"
    except Exception as e:
        assert "aqi" in str(e).lower()
        print(f"✅ PASS: Invalid AQI correctly rejected")
        print(f"   Error: {e}")


def test_telemetry_validation():
    """Test telemetry schema validation."""
    print("\n🧪 Test 13: Telemetry Schema Validation")
    try:
        sensors = TelemetrySensors(
            temperature=-10,
            humidity=100,
            airQuality=50,
            motion=1,
            light=500,
            door=0,
            gas=100
        )
        print(f"✅ PASS: Valid telemetry accepted")
    except Exception as e:
        assert False, f"Should accept valid telemetry: {e}"


def test_model_probability_sum():
    """Test that model probabilities sum to approximately 1.0."""
    print("\n🧪 Test 14: Model Probability Sum Validation")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=22,
        humidity=45,
        aqi=50,
        gas=100,
        motion=0
    )
    _, _, probs, _ = model_svc.predict(req)
    
    if probs:
        prob_sum = sum(probs.values())
        assert abs(prob_sum - 1.0) < 0.05, f"Probabilities sum to {prob_sum}, not 1.0"
        print(f"✅ PASS: Probabilities sum to {prob_sum:.4f}")
    else:
        print(f"⚠️  SKIP: No probabilities returned")


def test_shap_contributions():
    """Test SHAP contribution calculation."""
    print("\n🧪 Test 15: SHAP Contribution Calculation")
    model_svc = ModelService()
    
    req = PredictionRequest(
        temperature=25,
        humidity=75,
        aqi=200,
        gas=500,
        motion=0
    )
    shap = model_svc.shap_contributions(req)
    
    total = sum(shap.values())
    assert 90 <= total <= 110, f"SHAP contributions should sum to ~100, got {total}"
    print(f"✅ PASS: SHAP contributions sum to {total}")
    print(f"   Top contributors: {sorted(shap.items(), key=lambda x: x[1], reverse=True)[:3]}")


def run_all_tests():
    """Run all E2E tests."""
    print("=" * 70)
    print("Smart Home Sense - End-to-End Integration Tests")
    print("=" * 70)
    
    tests = [
        test_safe_environment,
        test_warning_environment,
        test_dangerous_environment,
        test_extreme_humidity,
        test_extreme_aqi,
        test_extreme_temperature_high,
        test_extreme_temperature_low,
        test_extreme_gas,
        test_high_aqi_warning,
        test_validation_rejects_invalid_humidity,
        test_validation_rejects_invalid_temperature,
        test_validation_rejects_invalid_aqi,
        test_telemetry_validation,
        test_model_probability_sum,
        test_shap_contributions,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"❌ FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {e}")
            failed += 1
    
    print("\n" + "=" * 70)
    print(f"Test Results: {passed} passed, {failed} failed out of {len(tests)} total")
    print("=" * 70)
    
    if failed > 0:
        exit(1)
    else:
        print("\n✅ All E2E tests PASSED!")


if __name__ == "__main__":
    run_all_tests()
