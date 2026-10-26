import io
import math
import os
import uuid
import numpy as np
import cv2
from PIL import Image, ImageOps

def rgb_to_cielab(r: float, g: float, b: float):
    """
    Convert sRGB (0-255) to CIELAB using standard D65 reference white.
    Formula: IEC 61966-2-1:1999 sRGB to CIE XYZ, then CIE 1976 L*a*b*.
    """
    # 1. Normalize sRGB to [0, 1] and linearize (inverse gamma companding)
    rgb = [r / 255.0, g / 255.0, b / 255.0]
    rgb_linear = []
    for c in rgb:
        if c > 0.04045:
            rgb_linear.append(((c + 0.055) / 1.055) ** 2.4)
        else:
            rgb_linear.append(c / 12.92)

    # 2. Convert Linear RGB to CIE XYZ (D65)
    X = rgb_linear[0] * 0.4124564 + rgb_linear[1] * 0.3575761 + rgb_linear[2] * 0.1804375
    Y = rgb_linear[0] * 0.2126729 + rgb_linear[1] * 0.7151522 + rgb_linear[2] * 0.0721750
    Z = rgb_linear[0] * 0.0193339 + rgb_linear[1] * 0.1191920 + rgb_linear[2] * 0.9503041

    # D65 standard reference white (normalized so Y=1.0)
    Xn, Yn, Zn = 0.95047, 1.00000, 1.08883

    xr = X / Xn
    yr = Y / Yn
    zr = Z / Zn

    def f(t):
        delta = 6.0 / 29.0
        if t > delta ** 3:
            return t ** (1.0 / 3.0)
        return t / (3.0 * delta ** 2) + 4.0 / 29.0

    fx = f(xr)
    fy = f(yr)
    fz = f(zr)

    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b_val = 200.0 * (fy - fz)

    return round(float(L), 2), round(float(a), 2), round(float(b_val), 2)

def calculate_ciede2000(lab1, lab2) -> float:
    """
    Calculate CIEDE2000 color difference between two CIELAB colors (L1, a1, b1) and (L2, a2, b2).
    Standard formulation for perceptual color difference.
    """
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2

    avg_L = (L1 + L2) / 2.0
    C1 = math.sqrt(a1**2 + b1**2)
    C2 = math.sqrt(a2**2 + b2**2)
    avg_C = (C1 + C2) / 2.0

    G = 0.5 * (1.0 - math.sqrt((avg_C**7) / (avg_C**7 + 25**7 + 1e-9)))
    a1_prime = (1.0 + G) * a1
    a2_prime = (1.0 + G) * a2

    C1_prime = math.sqrt(a1_prime**2 + b1**2)
    C2_prime = math.sqrt(a2_prime**2 + b2**2)
    avg_C_prime = (C1_prime + C2_prime) / 2.0

    h1_prime = math.degrees(math.atan2(b1, a1_prime)) % 360
    h2_prime = math.degrees(math.atan2(b2, a2_prime)) % 360

    if abs(h1_prime - h2_prime) <= 180:
        avg_h_prime = (h1_prime + h2_prime) / 2.0
    elif (h1_prime + h2_prime) < 360:
        avg_h_prime = (h1_prime + h2_prime + 360.0) / 2.0
    else:
        avg_h_prime = (h1_prime + h2_prime - 360.0) / 2.0

    if abs(h1_prime - h2_prime) <= 180:
        deltah_prime = h2_prime - h1_prime
    elif h2_prime <= h1_prime:
        deltah_prime = h2_prime - h1_prime + 360.0
    else:
        deltah_prime = h2_prime - h1_prime - 360.0

    deltaL_prime = L2 - L1
    deltaC_prime = C2_prime - C1_prime
    deltaH_prime = 2.0 * math.sqrt(C1_prime * C2_prime) * math.sin(math.radians(deltah_prime / 2.0))

    T = 1.0 - 0.17 * math.cos(math.radians(avg_h_prime - 30.0)) + \
        0.24 * math.cos(math.radians(2.0 * avg_h_prime)) + \
        0.32 * math.cos(math.radians(3.0 * avg_h_prime + 6.0)) - \
        0.20 * math.cos(math.radians(4.0 * avg_h_prime - 63.0))

    SL = 1.0 + (0.015 * ((avg_L - 50.0)**2)) / math.sqrt(20.0 + (avg_L - 50.0)**2)
    SC = 1.0 + 0.045 * avg_C_prime
    SH = 1.0 + 0.015 * avg_C_prime * T

    delta_theta = 30.0 * math.exp(-(((avg_h_prime - 275.0) / 25.0)**2))
    RC = 2.0 * math.sqrt((avg_C_prime**7) / (avg_C_prime**7 + 25**7 + 1e-9))
    RT = -math.sin(math.radians(2.0 * delta_theta)) * RC

    term1 = deltaL_prime / SL
    term2 = deltaC_prime / SC
    term3 = deltaH_prime / SH
    delta_e = math.sqrt(term1**2 + term2**2 + term3**2 + RT * term2 * term3)
    return round(float(delta_e), 2)

class ImageAnalysisEngine:
    """
    Industrial-grade computer vision pipeline for smart bandage colorimetric analysis.
    Performs validation, EXIF normalization, quality scoring, indicator ROI isolation,
    specular reflection masking, and perceptual color conversion.
    """

    @staticmethod
    def process_image(image_bytes: bytes, user_roi: dict = None, storage_dir: str = None) -> dict:
        warnings = []
        
        # 1. Decode safely via Pillow
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            pil_image.verify()  # Check for integrity
            pil_image = Image.open(io.BytesIO(image_bytes))  # Reopen after verify
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image file: {str(e)}")

        # 2. Exif orientation normalization
        try:
            pil_image = ImageOps.exif_transpose(pil_image)
        except Exception:
            pass

        # Convert to RGB if RGBA or Grayscale
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')

        img_width, img_height = pil_image.size
        if img_width < 100 or img_height < 100:
            raise ValueError("Image dimensions too small (minimum 100x100 pixels required).")

        # Convert to OpenCV BGR format
        cv_img_rgb = np.array(pil_image)
        cv_img_bgr = cv2.cvtColor(cv_img_rgb, cv2.COLOR_RGB2BGR)

        # 3. Assess Image Quality Metrics
        gray = cv2.cvtColor(cv_img_bgr, cv2.COLOR_BGR2GRAY)
        
        # A. Blur score via Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = laplacian_var < 80.0
        if is_blurry:
            warnings.append("High image blur detected. Indicator edges may lack sharpness.")

        # B. Contrast evaluation
        contrast_std = float(np.std(gray))
        is_low_contrast = contrast_std < 25.0
        if is_low_contrast:
            warnings.append("Low dynamic contrast in scene illumination.")

        # C. Specular glare detection (overexposed pixels: luminance > 240)
        glare_mask = gray >= 242
        glare_percent = float(np.sum(glare_mask) / (img_width * img_height)) * 100.0
        if glare_percent > 8.0:
            warnings.append("Excessive flash glare / specular highlights detected.")

        # Composite Quality Score (0 - 100)
        quality_score = 100
        if laplacian_var < 50:
            quality_score -= 30
        elif laplacian_var < 80:
            quality_score -= 15

        if contrast_std < 20:
            quality_score -= 25
        elif contrast_std < 35:
            quality_score -= 10

        if glare_percent > 10.0:
            quality_score -= 30
        elif glare_percent > 4.0:
            quality_score -= 15

        quality_score = max(10, min(100, int(quality_score)))

        if quality_score >= 75:
            quality_status = 'OPTIMAL'
        elif quality_score >= 50:
            quality_status = 'ACCEPTABLE'
        else:
            quality_status = 'INSUFFICIENT_QUALITY'
            warnings.append("Overall image quality is insufficient for dependable clinical interpretation.")

        # 4. Determine Region of Interest (ROI)
        # Check if user provided manual bounding box
        roi_x, roi_y, roi_w, roi_h = None, None, None, None
        
        if user_roi and isinstance(user_roi, dict) and 'width' in user_roi and 'height' in user_roi:
            # Check if normalized coordinates (0.0 to 1.0)
            ux = float(user_roi.get('x', 0))
            uy = float(user_roi.get('y', 0))
            uw = float(user_roi.get('width', 0))
            uh = float(user_roi.get('height', 0))
            
            if uw <= 1.0 and uh <= 1.0 and ux <= 1.0 and uy <= 1.0:
                roi_x = int(ux * img_width)
                roi_y = int(uy * img_height)
                roi_w = int(uw * img_width)
                roi_h = int(uh * img_height)
            else:
                roi_x = int(ux)
                roi_y = int(uy)
                roi_w = int(uw)
                roi_h = int(uh)

            # Clamp to boundaries
            roi_x = max(0, min(roi_x, img_width - 10))
            roi_y = max(0, min(roi_y, img_height - 10))
            roi_w = max(10, min(roi_w, img_width - roi_x))
            roi_h = max(10, min(roi_h, img_height - roi_y))
            roi_detection_method = 'MANUAL'
        else:
            # Automatic ROI Detection
            # Look for anthocyanin coupon (purple/magenta/blue) in central 60% of frame
            hsv = cv2.cvtColor(cv_img_bgr, cv2.COLOR_BGR2HSV)
            h_chan, s_chan, v_chan = cv2.split(hsv)
            
            # Central region bounding
            cx1, cy1 = int(img_width * 0.2), int(img_height * 0.2)
            cx2, cy2 = int(img_width * 0.8), int(img_height * 0.8)
            center_s = s_chan[cy1:cy2, cx1:cx2]
            
            # Find high-saturation or distinctive color region
            _, thresh = cv2.threshold(center_s, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            best_contour = None
            max_area = 0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                # Must be a reasonable size patch
                if area > 400 and area > max_area:
                    max_area = area
                    best_contour = cnt

            if best_contour is not None:
                bx, by, bw, bh = cv2.boundingRect(best_contour)
                roi_x = cx1 + bx
                roi_y = cy1 + by
                roi_w = bw
                roi_h = bh
                roi_detection_method = 'AUTOMATIC_CONTOUR'
            else:
                # Fallback to center 30% crop
                roi_w = int(img_width * 0.35)
                roi_h = int(img_height * 0.35)
                roi_x = int((img_width - roi_w) / 2)
                roi_y = int((img_height - roi_h) / 2)
                roi_detection_method = 'CENTER_DEFAULT'

        # 5. Extract Indicator ROI Pixels and Mask Glare
        roi_rgb = cv_img_rgb[roi_y:roi_y+roi_h, roi_x:roi_x+roi_w]
        roi_gray = gray[roi_y:roi_y+roi_h, roi_x:roi_x+roi_w]
        
        # Glare mask inside ROI: ignore saturated reflection highlights (>240)
        roi_valid_pixels = roi_rgb[roi_gray < 240]
        
        if len(roi_valid_pixels) < 20:
            # If nearly all pixels are glare, fall back to whole ROI
            roi_valid_pixels = roi_rgb.reshape(-1, 3)
            warnings.append("Severe specular reflection across entire selected indicator patch.")

        # Compute robust median color values to suppress noise
        median_r = int(np.median(roi_valid_pixels[:, 0]))
        median_g = int(np.median(roi_valid_pixels[:, 1]))
        median_b = int(np.median(roi_valid_pixels[:, 2]))

        # Convert to HSV (OpenCV HSV: H in 0-179, S in 0-255, V in 0-255)
        pixel_bgr = np.uint8([[[median_b, median_g, median_r]]])
        hsv_cv = cv2.cvtColor(pixel_bgr, cv2.COLOR_BGR2HSV)[0][0]
        h_deg = round(float(hsv_cv[0]) * 2.0, 1)  # Scale to 0-360 deg
        s_pct = round(float(hsv_cv[1]) / 255.0 * 100.0, 1)  # 0-100%
        v_pct = round(float(hsv_cv[2]) / 255.0 * 100.0, 1)  # 0-100%

        # Convert to CIELAB using strict D65 reference
        lab_L, lab_a, lab_b = rgb_to_cielab(median_r, median_g, median_b)

        # 6. Save original image and annotated crop to storage directory
        storage_key = None
        thumbnail_key = None
        if storage_dir:
            os.makedirs(storage_dir, exist_ok=True)
            unique_id = uuid.uuid4().hex
            orig_filename = f"scan_{unique_id}.jpg"
            thumb_filename = f"thumb_{unique_id}.jpg"
            
            orig_path = os.path.join(storage_dir, orig_filename)
            thumb_path = os.path.join(storage_dir, thumb_filename)
            
            # Save original compressed JPEG
            pil_image.save(orig_path, "JPEG", quality=88, optimize=True)
            
            # Save cropped ROI thumbnail
            roi_pil = Image.fromarray(roi_rgb)
            roi_pil.save(thumb_path, "JPEG", quality=92)
            
            storage_key = orig_filename
            thumbnail_key = thumb_filename

        return {
            'image_storage_key': storage_key,
            'thumbnail_key': thumbnail_key,
            'image_dimensions': {'width': img_width, 'height': img_height},
            'roi_coordinates': {
                'x': roi_x,
                'y': roi_y,
                'width': roi_w,
                'height': roi_h,
                'detection_method': roi_detection_method
            },
            'median_rgb': [median_r, median_g, median_b],
            'median_hsv': [h_deg, s_pct, v_pct],
            'median_lab': [lab_L, lab_a, lab_b],
            'hex_color': f"#{median_r:02X}{median_g:02X}{median_b:02X}",
            'quality_score': quality_score,
            'image_quality_status': quality_status,
            'quality_details': {
                'laplacian_blur_var': round(laplacian_var, 1),
                'contrast_std': round(contrast_std, 1),
                'glare_percent': round(glare_percent, 2),
                'valid_roi_pixels': int(len(roi_valid_pixels)),
                'warnings': warnings
            }
        }
