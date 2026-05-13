"""
Safety validation service that applies hard rules to ensure dangerous sensor conditions
always escalate to Warning or Danger predictions, not Safe.
"""

from ..schemas.prediction import PredictionRequest


class SafetyService:
    """
    Implements hard safety rules that take precedence over model predictions.
    Rules are based on scientific thresholds for human health and safety.
    """

    # Hard safety thresholds
    HUMIDITY_DANGER = 100.0  # 100% humidity is impossible/critical
    HUMIDITY_WARNING = 85.0  # Above 85% encourages mold/mildew

    AQI_DANGER = 300.0  # AQI >= 300 is Hazardous (changed from 301)
    AQI_WARNING = 200.0  # AQI > 200 is Very Unhealthy (changed from 201)

    GAS_DANGER = 2000.0  # Extreme gas levels
    GAS_WARNING = 500.0  # High gas levels

    TEMPERATURE_EXTREME_HIGH = 50.0  # Above 50°C is dangerous
    TEMPERATURE_EXTREME_LOW = 0.0  # Below 0°C is dangerous
    TEMPERATURE_WARNING_HIGH = 40.0  # Above 40°C is concerning

    @classmethod
    def apply_safety_overrides(
        cls, payload: PredictionRequest, model_prediction: str
    ) -> tuple[str, bool]:
        """
        Apply hard safety rules to override model prediction if necessary.

        Args:
            payload: The input sensor data
            model_prediction: The prediction from the ML model ("Safe", "Warning", or "Danger")

        Returns:
            Tuple of (final_prediction, was_overridden)
        """
        severity_score = cls._calculate_safety_score(payload)

        if severity_score >= 2:
            # Critical danger conditions
            return "Danger", True
        elif severity_score >= 1:
            # Warning conditions
            if model_prediction == "Safe":
                return "Warning", True
            return model_prediction, False
        else:
            # No safety override needed
            return model_prediction, False

    @classmethod
    def _calculate_safety_score(cls, payload: PredictionRequest) -> float:
        """
        Calculate an overall safety score based on hard thresholds.
        Score >= 2: Danger
        Score >= 1: Warning
        Score < 1: Safe (let model decide)
        """
        score = 0.0

        # Temperature checks (critical)
        if payload.temperature >= cls.TEMPERATURE_EXTREME_HIGH or payload.temperature <= cls.TEMPERATURE_EXTREME_LOW:
            score += 2.0  # Immediate danger
        elif payload.temperature >= cls.TEMPERATURE_WARNING_HIGH:
            score += 0.5  # Warning level

        # Humidity checks (critical)
        if payload.humidity >= cls.HUMIDITY_DANGER:
            score += 2.0  # Impossible/Critical
        elif payload.humidity >= cls.HUMIDITY_WARNING:
            score += 0.5  # Warning level

        # AQI checks (critical for air quality)
        if payload.aqi >= cls.AQI_DANGER:
            score += 2.0  # Hazardous
        elif payload.aqi >= cls.AQI_WARNING:
            score += 1.0  # Very Unhealthy → Warning

        # Gas checks (critical)
        if payload.gas >= cls.GAS_DANGER:
            score += 2.0  # Extreme gas danger
        elif payload.gas >= cls.GAS_WARNING:
            score += 1.0  # Warning level

        return score

    @classmethod
    def validate_sensor_ranges(cls, payload: PredictionRequest) -> list[str]:
        """
        Validate sensor values and return list of detected anomalies.
        This can be used for logging and auditing.
        """
        anomalies = []

        if payload.temperature >= cls.TEMPERATURE_EXTREME_HIGH:
            anomalies.append(f"Critical temperature: {payload.temperature}°C (>= {cls.TEMPERATURE_EXTREME_HIGH}°C)")
        elif payload.temperature <= cls.TEMPERATURE_EXTREME_LOW:
            anomalies.append(
                f"Critical temperature: {payload.temperature}°C (<= {cls.TEMPERATURE_EXTREME_LOW}°C)"
            )

        if payload.humidity >= cls.HUMIDITY_DANGER:
            anomalies.append(f"Critical humidity: {payload.humidity}% (>= {cls.HUMIDITY_DANGER}%)")
        elif payload.humidity >= cls.HUMIDITY_WARNING:
            anomalies.append(f"Warning humidity: {payload.humidity}% (>= {cls.HUMIDITY_WARNING}%)")

        if payload.aqi >= cls.AQI_DANGER:
            anomalies.append(f"Hazardous AQI: {payload.aqi} (>= {cls.AQI_DANGER})")
        elif payload.aqi >= cls.AQI_WARNING:
            anomalies.append(f"Very unhealthy AQI: {payload.aqi} (>= {cls.AQI_WARNING})")

        if payload.gas >= cls.GAS_DANGER:
            anomalies.append(f"Extreme gas level: {payload.gas} (>= {cls.GAS_DANGER})")
        elif payload.gas >= cls.GAS_WARNING:
            anomalies.append(f"High gas level: {payload.gas} (>= {cls.GAS_WARNING})")

        return anomalies
