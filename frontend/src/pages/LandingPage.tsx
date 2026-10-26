import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Camera,
  Cpu,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activePh, setActivePh] = useState<number>(6.5);

  const phSpectrum = [
    { ph: 4.0, hex: '#D74B6E', label: 'Acidic / Pink', state: 'Flavylium Cation' },
    { ph: 5.0, hex: '#BE4182', label: 'Mildly Acidic / Magenta', state: 'Transition Form' },
    { ph: 6.0, hex: '#9B469B', label: 'Violet', state: 'Anhydrobase' },
    { ph: 6.5, hex: '#824BA5', label: 'Optimal Healing Bed / Deep Violet', state: 'Target Reference' },
    { ph: 7.0, hex: '#6455AA', label: 'Neutral / Purple-Blue', state: 'Transition Zone' },
    { ph: 7.5, hex: '#4669AA', label: 'Alkaline / Blue', state: 'Exudate Shift' },
    { ph: 8.0, hex: '#327D9B', label: 'Significantly Alkaline / Teal-Blue', state: 'Biofilm Alert' },
    { ph: 8.5, hex: '#4B8C6E', label: 'Degraded / Green-Yellow', state: 'Chalcone Form' },
  ];

  const currentItem = phSpectrum.find((p) => p.ph === activePh) || phSpectrum[3];

  return (
    <div className="min-h-screen bg-slatebg flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-navy-900 tracking-tight text-xl">
              Heal<span className="text-teal-600">Sense</span>™
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
            <a href="#spectrum" className="hover:text-teal-600 transition-colors">Anthocyanin Science</a>
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#safety" className="hover:text-teal-600 transition-colors">Clinical Safety</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-navy-900 hover:text-teal-600 px-3.5 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl shadow-sm shadow-teal-600/25 transition-all hover:shadow"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Intelligent Wound Dressing Colorimetry & Clinician Decision Support
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.15]">
                Smarter Wound Monitoring. <br />
                <span className="text-teal-600">Clearer Clinical Insights.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                HealSense™ bridges biochemical indicators and digital telehealth. Utilizing purple sweet potato anthocyanin sensor matrix dressings, our optical engine quantifies color shift in CIELAB space, matches calibrated reference curves, and arms clinicians with objective longitudinal data.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 px-6 py-3.5 rounded-xl shadow-md shadow-teal-600/25 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Launch Doctor Dashboard <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-base font-semibold text-navy-900 hover:text-teal-700 bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3.5 rounded-xl transition-all shadow-xs"
                >
                  Explore How It Works
                </a>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  No invasive probes
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  CIEDE2000 colorimetry
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  Audit-logged triage
                </div>
              </div>
            </div>

            {/* Visual Smart Bandage Illustration */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-xs font-semibold text-navy-900">
                  <span className="flex items-center gap-1.5 text-teal-700">
                    <Activity className="w-4 h-4 text-teal-600" /> Smart Dressing Visualizer
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">
                    Non-invasive
                  </span>
                </div>

                {/* Bandage Graphic Representation */}
                <div className="relative w-full aspect-square rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 p-6 flex items-center justify-center">
                  {/* Outer Hydrocolloid Border */}
                  <div className="w-full h-full rounded-2xl bg-white shadow-md border border-slate-200 relative flex items-center justify-center p-6">
                    {/* Corner Reference Fiducials */}
                    <div className="absolute top-2 left-2 w-4 h-4 bg-slate-900 rounded-xs" />
                    <div className="absolute top-2 right-2 w-4 h-4 bg-white border border-slate-400 rounded-xs" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 bg-slate-500 rounded-xs" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-slate-700 rounded-xs" />

                    {/* Absorbent Wound Pad */}
                    <div className="w-4/5 h-4/5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-inner">
                      {/* Anthocyanin Indicator Region */}
                      <div
                        className="w-24 h-24 rounded-full border-2 border-white/60 shadow-lg transition-colors duration-500 flex flex-col items-center justify-center text-white"
                        style={{ backgroundColor: currentItem.hex }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Indicator</span>
                        <span className="text-xs font-extrabold">pH {currentItem.ph.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro Sensor Status Underneath */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Indicator Chromophore</span>
                    <span className="font-semibold text-navy-900">{currentItem.state}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Measured Color</span>
                    <span className="font-mono font-bold text-teal-800">{currentItem.hex}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Interactive Workflow */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">Three-Step Protocol</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              From Bandage Image to Clinician Decision Support
            </p>
            <p className="text-slate-600 mt-4 text-base">
              Standardized optical capture coupled with CIELAB conversion provides reproducible monitoring without disturbing delicate healing tissue.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slatebg rounded-2xl p-8 border border-slate-200 relative group hover:border-teal-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" /> Optical Capture
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Take a photograph of the smart dressing under diffuse, neutral lighting using a smartphone or web camera. Automated fiducial guidelines help maintain consistent framing.
              </p>
            </div>

            <div className="bg-slatebg rounded-2xl p-8 border border-slate-200 relative group hover:border-teal-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-600" /> Colorimetric Analysis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                OpenCV isolates the indicator region, masks specular reflections, computes representative median RGB and CIELAB coordinates, and calculates perceptual color distance ($\Delta E$).
              </p>
            </div>

            <div className="bg-slatebg rounded-2xl p-8 border border-slate-200 relative group hover:border-teal-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" /> Clinician Review
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Authorized physicians inspect scan records, assess quality metrics, review longitudinal pH shifts, and record structured clinical follow-up recommendations with an audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Anthocyanin pH Color Spectrum */}
      <section id="spectrum" className="py-20 bg-slatebg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">Natural Sensor Matrix</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Purple Sweet Potato Anthocyanin Response
            </p>
            <p className="text-slate-600 mt-4 text-sm sm:text-base">
              Acylated anthocyanins exhibit reversible structural transformations when exposed to varying wound exudate hydrogen ion concentrations. Click a pH point to view the calibrated response.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
            {/* Color Swatch Selector Bar */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
              {phSpectrum.map((item) => (
                <button
                  key={item.ph}
                  onClick={() => setActivePh(item.ph)}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                    activePh === item.ph
                      ? 'border-navy-900 bg-slate-50 ring-2 ring-teal-500 scale-105 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full shadow-inner mb-2 border border-black/10"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="text-xs font-bold text-navy-900">pH {item.ph}</span>
                  <span className="text-[10px] text-slate-500 text-center truncate w-full mt-0.5">{item.hex}</span>
                </button>
              ))}
            </div>

            {/* Selected pH Detail Panel */}
            <div className="bg-slatebg rounded-2xl p-6 border border-slate-200 grid md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl border-2 border-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: currentItem.hex }}
                />
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Active Calibrated Point</span>
                  <h4 className="text-xl font-extrabold text-navy-900">pH {currentItem.ph.toFixed(1)}</h4>
                  <p className="text-xs text-slate-600">{currentItem.label}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold block">Chromophore Equilibrium Form</span>
                <p className="text-sm font-semibold text-navy-900 mt-0.5">{currentItem.state}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Calibrated via CIE D65 illuminant in Britton-Robinson buffer series.
                </p>
              </div>

              <div className="md:text-right">
                <span className="text-xs text-slate-400 uppercase font-semibold block">Clinical Interpretation Rule</span>
                <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-semibold ${
                  currentItem.ph >= 5.5 && currentItem.ph <= 6.8
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentItem.ph > 7.4
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentItem.ph >= 5.5 && currentItem.ph <= 6.8
                    ? 'Target Healing Bed Range'
                    : currentItem.ph > 7.4
                    ? 'Elevated Alkaline — Review Advised'
                    : 'Deviated — Monitor Trend'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">Core Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Engineered for Medical Rigor & Data Integrity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slatebg border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-navy-900 mb-2">Configurable Calibration</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Supports batch-specific calibration profiles with experiment metadata. Refuses to invent pH estimates when profiles are unvalidated.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slatebg border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-navy-900 mb-2">Interactive ROI Selection</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated contour segmentation backed by user-adjustable boundary crosshairs allows precise isolation of indicator coupons on complex dressings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slatebg border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-navy-900 mb-2">Longitudinal Trends</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tracks chronological colorimetry and estimated pH across dressing changes to detect alkaline exudate drifts before gross clinical manifestations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Safety & Regulatory Limitation Section */}
      <section id="safety" className="py-16 bg-amber-50/60 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl flex-shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">
                Clinical Safety & Research Prototype Disclosure
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                HealSense™ is an investigational software prototype designed to support biomaterials research and telehealth feasibility studies. <strong>Optical color analysis and anthocyanin pH estimates do not constitute a medical diagnosis and cannot confirm or exclude wound infection.</strong>
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Color values are susceptible to camera optics, flash reflections, ambient lighting spectra, and dressing hydration state.</li>
                <li>Normal physiological pH readings do not rule out biofilm or pathogenic bacterial colonization.</li>
                <li>Clinical evaluation by a licensed physician or certified wound care specialist remains the gold standard for diagnostic assessment.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-navy-950 text-slate-400 py-12 border-t border-navy-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <span className="font-bold text-white text-sm">HealSense™</span>
            <span>— Smart Wound Monitoring System</span>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            Confidential Research Prototype. Not for unsupervised consumer diagnostic use.
          </p>
        </div>
      </footer>
    </div>
  );
};
