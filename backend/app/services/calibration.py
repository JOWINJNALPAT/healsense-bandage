import math
from app.services.image_analysis import calculate_ciede2000
from app.models.calibration import CalibrationProfile

# Standard Anthocyanin Experimental Calibration Library (Purple Sweet Potato Anthocyanins)
DEFAULT_ANTHOCYANIN_REFERENCE = [
    {
        "ph": 4.0,
        "rgb": [215, 75, 110],
        "lab": [52.1, 58.4, 12.3],
        "hex": "#D74B6E",
        "label": "Acidic / Pinkish Red",
        "description": "Flavylium cation equilibrium state"
    },
    {
        "ph": 5.0,
        "rgb": [190, 65, 130],
        "lab": [45.2, 54.1, -8.2],
        "hex": "#BE4182",
        "label": "Mildly Acidic / Magenta",
        "description": "Transition state"
    },
    {
        "ph": 6.0,
        "rgb": [155, 70, 155],
        "lab": [42.0, 44.2, -26.1],
        "hex": "#9B469B",
        "label": "Physiological / Violet",
        "description": "Anhydrobase quinonoidal form"
    },
    {
        "ph": 6.5,
        "rgb": [130, 75, 165],
        "lab": [40.1, 33.8, -35.2],
        "hex": "#824BA5",
        "label": "Normal Wound Bed / Deep Violet",
        "description": "Optimal healing microenvironment reference"
    },
    {
        "ph": 7.0,
        "rgb": [100, 85, 170],
        "lab": [40.3, 20.1, -42.4],
        "hex": "#6455AA",
        "label": "Neutral / Purple-Blue",
        "description": "Neutral exudate indicator transition"
    },
    {
        "ph": 7.5,
        "rgb": [70, 105, 170],
        "lab": [44.2, 4.3, -40.1],
        "hex": "#4669AA",
        "label": "Alkaline / Blue",
        "description": "Ionized quinonoidal base"
    },
    {
        "ph": 8.0,
        "rgb": [50, 125, 155],
        "lab": [48.4, -18.2, -28.5],
        "hex": "#327D9B",
        "label": "Significantly Alkaline / Blue-Green",
        "description": "Chronic wound exudate range"
    },
    {
        "ph": 8.5,
        "rgb": [75, 140, 110],
        "lab": [53.1, -28.4, 8.5],
        "hex": "#4B8C6E",
        "label": "Highly Alkaline / Green-Yellow",
        "description": "Retro-chalcone structural degradation"
    }
]

class CalibrationService:
    """
    Manages experimental calibration profiles and performs nearest-reference matching,
    CIE Delta E perceptual color distance calculation, and clinical rule interpretation.
    """

    @classmethod
    def evaluate_scan_color(cls, median_lab: list, median_rgb: list, profile: CalibrationProfile = None, quality_status: str = 'OPTIMAL') -> dict:
        """
        Evaluate measured color against calibration profile.
        Strict requirement: If profile is unvalidated or missing, do NOT fabricate pH.
        """
        if quality_status == 'INSUFFICIENT_QUALITY':
            return {
                'calibration_profile_id': profile.id if profile else None,
                'calibration_status': profile.validation_status if profile else 'UNCALIBRATED',
                'nearest_reference_color': None,
                'color_distance': None,
                'estimated_ph': None,
                'status_category': 'GRAY',
                'requires_review': True,
                'interpretation': "Insufficient image quality. Specular glare, motion blur, or poor contrast prevents dependable colorimetric reading. Repeat scan under neutral diffuse illumination.",
                'limitations': "Unvalidated reading due to inadequate lighting or focus."
            }

        # If no profile or profile is UNVALIDATED / EXPERIMENTAL
        if not profile or profile.validation_status != 'VALIDATED':
            status_text = profile.validation_status if profile else 'UNCALIBRATED'
            return {
                'calibration_profile_id': profile.id if profile else None,
                'calibration_status': status_text,
                'nearest_reference_color': None,
                'color_distance': None,
                'estimated_ph': None,
                'status_category': 'GRAY',
                'requires_review': True,
                'interpretation': f"Color measured successfully (RGB {median_rgb}, CIELAB {median_lab}) — pH estimation unavailable because calibration profile is {status_text.lower()} and not clinically validated. Quantitative pH requires an authorized validated profile.",
                'limitations': "HealSense is a research prototype. Color analysis and experimental pH estimates do not diagnose or exclude wound infection. Clinical assessment is required."
            }

        # Profile IS VALIDATED: evaluate against reference chart
        ref_points = profile.reference_data
        if not ref_points or not isinstance(ref_points, list):
            return {
                'calibration_profile_id': profile.id,
                'calibration_status': 'INVALID_DATA',
                'nearest_reference_color': None,
                'color_distance': None,
                'estimated_ph': None,
                'status_category': 'GRAY',
                'requires_review': True,
                'interpretation': "Calibration profile contains empty or corrupted reference table data.",
                'limitations': "Missing reference points in validated profile."
            }

        # Calculate CIE Delta E (CIEDE2000) for all reference points
        distances = []
        for pt in ref_points:
            ref_lab = pt.get('lab')
            if ref_lab and len(ref_lab) == 3:
                de = calculate_ciede2000(median_lab, ref_lab)
                distances.append({
                    'ref_point': pt,
                    'delta_e': de,
                    'ph': float(pt.get('ph', 7.0))
                })

        if not distances:
            return {
                'calibration_profile_id': profile.id,
                'calibration_status': 'NO_LAB_POINTS',
                'nearest_reference_color': None,
                'color_distance': None,
                'estimated_ph': None,
                'status_category': 'GRAY',
                'requires_review': True,
                'interpretation': "Reference points lack valid CIELAB coordinates.",
                'limitations': "Invalid calibration data."
            }

        # Sort by lowest color distance (most similar color)
        distances.sort(key=lambda x: x['delta_e'])
        nearest = distances[0]
        nearest_pt = nearest['ref_point']
        min_delta_e = nearest['delta_e']

        # Estimate continuous pH: If second nearest point is close, perform distance-weighted interpolation
        estimated_ph = nearest['ph']
        if len(distances) > 1 and distances[1]['delta_e'] < 20.0:
            second = distances[1]
            w1 = 1.0 / max(nearest['delta_e'], 0.1)
            w2 = 1.0 / max(second['delta_e'], 0.1)
            estimated_ph = (nearest['ph'] * w1 + second['ph'] * w2) / (w1 + w2)

        estimated_ph = round(estimated_ph, 2)

        # Map to qualified clinical status
        # Reference wound healing physiological target: pH 5.5 to 6.8
        if 5.5 <= estimated_ph <= 6.8:
            status_category = 'GREEN'
            requires_review = False
            interpretation = (
                f"Within configured reference range (Estimated pH {estimated_ph:.1f}). "
                f"Indicator color matches calibrated profile '{profile.name}' (closest reference: {nearest_pt.get('label')}, ΔE: {min_delta_e:.1f}). "
                f"Note: Measurements within configured reference range do not diagnose or exclude infection."
            )
        elif (5.0 <= estimated_ph < 5.5) or (6.8 < estimated_ph <= 7.4):
            status_category = 'AMBER'
            requires_review = True
            interpretation = (
                f"Outside configured reference range (Estimated pH {estimated_ph:.1f}). "
                f"Mild deviation from target physiological range (5.5 - 6.8). "
                f"Clinician review recommended to correlate with exudate characteristics."
            )
        elif estimated_ph > 7.4:
            status_category = 'RED'
            requires_review = True
            interpretation = (
                f"Priority clinical review — Elevated alkaline shift detected (Estimated pH {estimated_ph:.1f}, ΔE {min_delta_e:.1f}). "
                f"Color matches alkaline indicator band ({nearest_pt.get('label')}). "
                f"Prototype threshold alert: Prompt clinician wound bed evaluation recommended."
            )
        else:
            status_category = 'AMBER'
            requires_review = True
            interpretation = (
                f"Outside configured reference range — Low pH reading (Estimated pH {estimated_ph:.1f}). "
                f"Significant acidic reading outside normal healing range. Clinician review recommended."
            )

        return {
            'calibration_profile_id': profile.id,
            'calibration_status': profile.validation_status,
            'nearest_reference_color': {
                'ph': nearest_pt.get('ph'),
                'hex': nearest_pt.get('hex'),
                'label': nearest_pt.get('label'),
                'rgb': nearest_pt.get('rgb'),
                'lab': nearest_pt.get('lab')
            },
            'color_distance': min_delta_e,
            'estimated_ph': estimated_ph,
            'status_category': status_category,
            'requires_review': requires_review,
            'interpretation': interpretation,
            'limitations': "HealSense is a research prototype. Color analysis and experimental pH estimates do not diagnose or exclude wound infection. Clinical assessment is required."
        }
