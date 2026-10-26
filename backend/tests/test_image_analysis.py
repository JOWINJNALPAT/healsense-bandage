import io
import pytest
import numpy as np
from PIL import Image
from app.services.image_analysis import rgb_to_cielab, calculate_ciede2000, ImageAnalysisEngine

def test_rgb_to_cielab_reference_points():
    # Test D65 reference white (255, 255, 255) -> L* should be ~100, a* ~0, b* ~0
    L, a, b = rgb_to_cielab(255, 255, 255)
    assert 99.0 <= L <= 100.1
    assert abs(a) < 1.0
    assert abs(b) < 1.0

    # Test black (0, 0, 0) -> L* should be 0
    L, a, b = rgb_to_cielab(0, 0, 0)
    assert L == 0.0
    assert a == 0.0
    assert b == 0.0

def test_ciede2000_identical_colors():
    # Identical colors must have distance 0.0
    d = calculate_ciede2000([50.0, 20.0, -15.0], [50.0, 20.0, -15.0])
    assert d == 0.0

def test_ciede2000_perceptible_difference():
    # Distinct colors should have Delta E > 5.0
    d = calculate_ciede2000([52.0, 58.0, 12.0], [48.0, -18.0, -28.0])
    assert d > 30.0

def test_process_valid_image():
    # Create test image with purple center
    img = Image.new("RGB", (200, 200), (255, 255, 255))
    pixels = img.load()
    for y in range(70, 130):
        for x in range(70, 130):
            pixels[x, y] = (130, 75, 165)  # Anthocyanin violet

    buf = io.BytesIO()
    img.save(buf, format="PNG") # Lossless to test exact extraction
    img_bytes = buf.getvalue()

    result = ImageAnalysisEngine.process_image(
        image_bytes=img_bytes,
        user_roi={"x": 75, "y": 75, "width": 50, "height": 50}
    )

    assert result['median_rgb'] == [130, 75, 165]
    assert result['quality_score'] >= 50
    assert 'median_lab' in result
    assert 'median_hsv' in result

def test_process_corrupted_image_raises_error():
    with pytest.raises(ValueError, match="Invalid or corrupted"):
        ImageAnalysisEngine.process_image(b"not an image buffer")
