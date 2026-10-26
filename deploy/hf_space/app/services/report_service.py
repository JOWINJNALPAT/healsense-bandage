import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.units import inch

class ReportService:
    @staticmethod
    def generate_scan_pdf(scan, patient, notes=None) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#14263D'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#0D9488'),
            fontName='Helvetica-Bold'
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#243B53')
        )
        body_bold = ParagraphStyle(
            'ReportBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        disclaimer_style = ParagraphStyle(
            'ReportDisclaimer',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#627D98'),
            fontName='Helvetica-Oblique'
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("HealSense™ Smart Wound Dressing System", title_style))
        elements.append(Paragraph("CLINICAL SCAN & COLORIMETRIC ANALYSIS REPORT", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0D9488'), spaceBefore=2, spaceAfter=15))

        # 2. Patient & Scan Demographics Table
        scan_date_str = scan.created_at.strftime("%Y-%m-%d %H:%M UTC") if scan.created_at else "N/A"
        demo_data = [
            [
                Paragraph("<b>Patient Reference:</b>", body_style),
                Paragraph(patient.patient_reference if patient else "N/A", body_bold),
                Paragraph("<b>Scan Record ID:</b>", body_style),
                Paragraph(f"#{scan.id}", body_bold),
            ],
            [
                Paragraph("<b>Patient Name:</b>", body_style),
                Paragraph(patient.name if patient else "N/A", body_style),
                Paragraph("<b>Scan Timestamp:</b>", body_style),
                Paragraph(scan_date_str, body_style),
            ],
            [
                Paragraph("<b>Wound Location:</b>", body_style),
                Paragraph(patient.wound_location if patient else "N/A", body_style),
                Paragraph("<b>Review Status:</b>", body_style),
                Paragraph(f"{scan.review_status} ({scan.status_category})", body_bold),
            ],
            [
                Paragraph("<b>Wound Type:</b>", body_style),
                Paragraph(patient.wound_type or "Unspecified", body_style),
                Paragraph("<b>Quality Score:</b>", body_style),
                Paragraph(f"{scan.quality_score}/100 ({scan.image_quality_status})", body_style),
            ],
        ]
        demo_table = Table(demo_data, colWidths=[1.5*inch, 2.2*inch, 1.5*inch, 2.2*inch])
        demo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(demo_table)
        elements.append(Spacer(1, 15))

        # 3. Colorimetric Measurements Table
        elements.append(Paragraph("<b>Indicator Colorimetric Measurements</b>", styles['Heading3']))
        elements.append(Spacer(1, 5))

        rgb_val = scan.median_rgb
        hsv_val = scan.median_hsv
        lab_val = scan.median_lab
        hex_color = f"#{rgb_val[0]:02X}{rgb_val[1]:02X}{rgb_val[2]:02X}" if len(rgb_val) == 3 else "#888888"

        meas_data = [
            [
                Paragraph("<b>Metric</b>", body_bold),
                Paragraph("<b>Measured Value</b>", body_bold),
                Paragraph("<b>Calibrated Profile / Context</b>", body_bold)
            ],
            [
                Paragraph("Measured Color Swatch", body_style),
                Paragraph(f"<b>Hex:</b> {hex_color} | <b>RGB:</b> ({rgb_val[0]}, {rgb_val[1]}, {rgb_val[2]})", body_style),
                Paragraph("Representative median of glare-filtered valid pixels in ROI", body_style)
            ],
            [
                Paragraph("HSV Color Space", body_style),
                Paragraph(f"H: {hsv_val[0]}° | S: {hsv_val[1]}% | V: {hsv_val[2]}%", body_style),
                Paragraph("Cylindrical perceptual color coordinates", body_style)
            ],
            [
                Paragraph("CIELAB Coordinates", body_style),
                Paragraph(f"L*: {lab_val[0]} | a*: {lab_val[1]} | b*: {lab_val[2]}", body_style),
                Paragraph("Standard Illuminant D65 reference white observer", body_style)
            ],
            [
                Paragraph("Estimated Exudate pH", body_style),
                Paragraph(f"<b>{scan.estimated_ph:.1f}</b>" if scan.estimated_ph is not None else "<b>Unavailable (Unvalidated)</b>", body_bold),
                Paragraph(f"Profile: {scan.calibration_profile.name if scan.calibration_profile else 'None'} ({scan.calibration_status})", body_style)
            ],
            [
                Paragraph("Perceptual Color Distance", body_style),
                Paragraph(f"ΔE*: {scan.color_distance:.1f}" if scan.color_distance is not None else "N/A", body_style),
                Paragraph("CIEDE2000 distance to closest reference anthocyanin coupon", body_style)
            ],
        ]
        meas_table = Table(meas_data, colWidths=[2.2*inch, 2.7*inch, 2.5*inch])
        meas_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0D9488')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(meas_table)
        elements.append(Spacer(1, 15))

        # 4. Algorithmic Interpretation & Clinical Recommendations
        elements.append(Paragraph("<b>Algorithmic Interpretation</b>", styles['Heading3']))
        elements.append(Spacer(1, 4))
        
        status_box_color = colors.HexColor('#DCFCE7') if scan.status_category == 'GREEN' else (
            colors.HexColor('#FEF3C7') if scan.status_category == 'AMBER' else (
                colors.HexColor('#FEE2E2') if scan.status_category == 'RED' else colors.HexColor('#F1F5F9')
            )
        )
        status_table = Table([[
            Paragraph(f"<b>STATUS: {scan.status_category}</b><br/>{scan.interpretation}", body_style)
        ]], colWidths=[7.4*inch])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), status_box_color),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94A3B8')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 15))

        # 5. Clinician Review & Notes
        elements.append(Paragraph("<b>Clinician Assessment & Review History</b>", styles['Heading3']))
        elements.append(Spacer(1, 4))

        if notes and len(notes) > 0:
            notes_rows = [[
                Paragraph("<b>Date & Clinician</b>", body_bold),
                Paragraph("<b>Assessment</b>", body_bold),
                Paragraph("<b>Clinical Note</b>", body_bold)
            ]]
            for n in notes:
                date_str = n.created_at.strftime("%Y-%m-%d") if n.created_at else ""
                notes_rows.append([
                    Paragraph(f"{date_str}<br/>{n.clinician.name if n.clinician else 'Clinician'}", body_style),
                    Paragraph(n.assessment, body_bold),
                    Paragraph(n.note, body_style)
                ])
            notes_table = Table(notes_rows, colWidths=[2.0*inch, 2.0*inch, 3.4*inch])
            notes_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(notes_table)
        else:
            elements.append(Paragraph("<i>No clinician notes recorded yet for this scan record.</i>", body_style))

        elements.append(Spacer(1, 25))

        # 6. Prominent Regulatory & Medical Disclaimer
        disclaimer_text = (
            "<b>IMPORTANT REGULATORY & CLINICAL SAFETY NOTICE:</b><br/>"
            "HealSense™ is an experimental research prototype for smart wound dressing monitoring. "
            "Optical color analysis and anthocyanin pH indicator calculations are research-grade estimates and do NOT "
            "constitute an official medical diagnosis, nor do they confirm or rule out infection or healing status. "
            "Normal pH measurements do not exclude bacterial colonization, and elevated pH must be clinically correlated "
            "with erythema, exudate volume, purulence, warmth, odor, and licensed medical evaluation."
        )
        disclaimer_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[7.4*inch])
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(disclaimer_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_scans_csv(scans) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Scan ID',
            'Patient Reference',
            'Patient Name',
            'Scan Timestamp',
            'RGB',
            'HSV',
            'CIELAB',
            'Estimated pH',
            'Calibration Status',
            'Color Distance (Delta E)',
            'Image Quality Score',
            'Quality Status',
            'Category',
            'Requires Review',
            'Review Status',
            'Reviewed By'
        ])
        for s in scans:
            writer.writerow([
                s.id,
                s.patient.patient_reference if s.patient else 'N/A',
                s.patient.name if s.patient else 'N/A',
                s.created_at.isoformat() if s.created_at else '',
                f"{s.median_rgb[0]},{s.median_rgb[1]},{s.median_rgb[2]}" if s.median_rgb else '',
                f"{s.median_hsv[0]},{s.median_hsv[1]},{s.median_hsv[2]}" if s.median_hsv else '',
                f"{s.median_lab[0]},{s.median_lab[1]},{s.median_lab[2]}" if s.median_lab else '',
                s.estimated_ph if s.estimated_ph is not None else 'N/A',
                s.calibration_status,
                s.color_distance if s.color_distance is not None else 'N/A',
                s.quality_score,
                s.image_quality_status,
                s.status_category,
                s.requires_review,
                s.review_status,
                s.reviewer.name if s.reviewer else ''
            ])
        return output.getvalue()
