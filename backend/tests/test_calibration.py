import pytest
from app.services.calibration import CalibrationService, DEFAULT_ANTHOCYANIN_REFERENCE
from app.models.calibration import CalibrationProfile

def test_unvalidated_profile_refuses_ph_estimation():
    class DummyProfile:
        id = 1
        name = "Experimental Indicator"
        validation_status = "EXPERIMENTAL"
        reference_data = DEFAULT_ANTHOCYANIN_REFERENCE

    result = CalibrationService.evaluate_scan_color(
        median_lab=[40.0, 33.0, -35.0],
        median_rgb=[130, 75, 165],
        profile=DummyProfile(),
        quality_status='OPTIMAL'
    )

    assert result['estimated_ph'] is None
    assert result['status_category'] == 'GRAY'
    assert "pH estimation unavailable" in result['interpretation']

def test_validated_profile_computes_accurate_ph():
    class ValidatedProfile:
        id = 2
        name = "Validated PSPA Standard"
        validation_status = "VALIDATED"
        reference_data = DEFAULT_ANTHOCYANIN_REFERENCE

    # Test physiological purple (pH 6.5 reference in default table is [40.1, 33.8, -35.2])
    result = CalibrationService.evaluate_scan_color(
        median_lab=[40.1, 33.8, -35.2],
        median_rgb=[130, 75, 165],
        profile=ValidatedProfile(),
        quality_status='OPTIMAL'
    )

    assert result['estimated_ph'] is not None
    assert 6.3 <= result['estimated_ph'] <= 6.7
    assert result['status_category'] == 'GREEN'
    assert result['color_distance'] is not None
    assert result['color_distance'] < 1.0  # Exact match

def test_insufficient_quality_status_blocks_evaluation():
    result = CalibrationService.evaluate_scan_color(
        median_lab=[40.0, 33.0, -35.0],
        median_rgb=[130, 75, 165],
        profile=None,
        quality_status='INSUFFICIENT_QUALITY'
    )

    assert result['estimated_ph'] is None
    assert result['status_category'] == 'GRAY'
    assert result['requires_review'] is True
    assert "Insufficient image quality" in result['interpretation']
