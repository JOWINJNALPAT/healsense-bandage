import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Patient, CalibrationProfile, RoiCoordinates } from '../types';
import { AlertBanner } from '../components/common/AlertBanner';
import {
  Camera,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Video,
  VideoOff,
  Crosshair,
} from 'lucide-react';

export const NewScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultPatientId = searchParams.get('patient_id');

  // Patient & Calibration State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId || '');
  const [profiles, setProfiles] = useState<CalibrationProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [scanNotes, setScanNotes] = useState('');

  // Mode: 'UPLOAD' or 'CAMERA'
  const [captureMode, setCaptureMode] = useState<'UPLOAD' | 'CAMERA'>('UPLOAD');

  // Image & Camera State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual ROI Box State (percentage 0 - 100)
  const [roiBox, setRoiBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 32,
    y: 32,
    w: 36,
    h: 36,
  });
  const [isManualRoiActive, setIsManualRoiActive] = useState(false);
  const [isDraggingRoi, setIsDraggingRoi] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Patients & Calibration Profiles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patRes, calRes] = await Promise.all([
          api.getPatients({ per_page: 100 }),
          api.getCalibrationProfiles(),
        ]);
        setPatients(patRes.patients);
        setProfiles(calRes);

        if (!selectedPatientId && patRes.patients.length > 0) {
          setSelectedPatientId(patRes.patients[0].id.toString());
        }

        const validatedProfile = calRes.find((p) => p.validation_status === 'VALIDATED');
        if (validatedProfile) {
          setSelectedProfileId(validatedProfile.id.toString());
        } else if (calRes.length > 0) {
          setSelectedProfileId(calRes[0].id.toString());
        }
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to initialize scan dependencies.');
      }
    };
    fetchData();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Camera access denied or device camera is not available. Please use image upload.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Frame from Camera
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setImagePreviewUrl(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setSubmitError('Unsupported image format. Please upload JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      setSubmitError('Image size exceeds 16MB limit.');
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Scan to API
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setSubmitError('Please capture or upload a dressing image first.');
      return;
    }

    if (!selectedPatientId) {
      setSubmitError('Please select or register a patient for this scan.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('patient_id', selectedPatientId);
    if (selectedProfileId) {
      formData.append('calibration_profile_id', selectedProfileId);
    }
    if (scanNotes) {
      formData.append('scan_notes', scanNotes);
    }

    // Include normalized ROI if manual ROI adjustment is selected
    if (isManualRoiActive) {
      const normalizedRoi = {
        x: roiBox.x / 100.0,
        y: roiBox.y / 100.0,
        width: roiBox.w / 100.0,
        height: roiBox.h / 100.0,
      };
      formData.append('roi_coordinates', JSON.stringify(normalizedRoi));
    }

    try {
      const resultScan = await api.analyzeScan(formData);
      navigate(`/scans/${resultScan.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Image color analysis failed.');
      setIsSubmitting(false);
    }
  };

  const selectedProfile = profiles.find((p) => p.id === Number(selectedProfileId));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Smart Bandage Optical Scan & Color Analysis
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detect and quantify purple sweet potato anthocyanin sensor matrix coloration
        </p>
      </div>

      {submitError && (
        <AlertBanner type="warning" title="Scan Processing Notice" message={submitError} />
      )}

      {/* Grid: Left Column Capture, Right Column Clinical Parameters */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Image Capture / Preview & ROI Tool */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            {/* Capture Mode Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-navy-900">Image Ingestion Mode</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setCaptureMode('UPLOAD');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    captureMode === 'UPLOAD'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> File Upload
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode('CAMERA');
                    startCamera();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    captureMode === 'CAMERA'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Live Camera
                </button>
              </div>
            </div>

            {/* Live Camera Viewfinder */}
            {captureMode === 'CAMERA' && !imagePreviewUrl && (
              <div className="relative aspect-4/3 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
                {cameraError ? (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    <VideoOff className="w-8 h-8 mx-auto text-rose-500 mb-2" />
                    <p className="font-semibold text-rose-400">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder crosshairs overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-teal-400/80 rounded-2xl flex items-center justify-center">
                        <Crosshair className="w-8 h-8 text-teal-400/70" />
                      </div>
                      <span className="absolute bottom-4 bg-slate-900/80 text-teal-300 text-[11px] px-3 py-1 rounded-full backdrop-blur-xs font-mono">
                        Center dressing indicator in crosshairs
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={captureFrame}
                      className="absolute bottom-6 px-6 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Camera className="w-4 h-4" /> Capture Frame
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Upload Drag & Drop Area */}
            {captureMode === 'UPLOAD' && !imagePreviewUrl && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-4/3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/20 cursor-pointer flex flex-col items-center justify-center p-6 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-300 shadow-xs mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-navy-900">Drag dressing photograph here</p>
                <p className="text-xs text-slate-500 mt-1">Or browse files on your computer or device</p>
                <span className="mt-3 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 bg-white rounded border border-slate-200 text-slate-500">
                  PNG, JPEG, WebP • Max 16MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Interactive Image Preview with ROI Selection Overlay */}
            {imagePreviewUrl && (
              <div className="space-y-4">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 select-none">
                  <img
                    src={imagePreviewUrl}
                    alt="Captured Bandage"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Manual / Automatic ROI Bounding Box Overlay */}
                  {isManualRoiActive && (
                    <div
                      className="absolute border-2 border-teal-400 bg-teal-400/20 shadow-md cursor-move rounded-md"
                      style={{
                        left: `${roiBox.x}%`,
                        top: `${roiBox.y}%`,
                        width: `${roiBox.w}%`,
                        height: `${roiBox.h}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-teal-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                        Selected Indicator Region
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreviewUrl(null);
                      if (captureMode === 'CAMERA') startCamera();
                    }}
                    className="absolute top-3 right-3 bg-slate-900/75 hover:bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake / Clear
                  </button>
                </div>

                {/* ROI Fine-Tuning Controls */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manualRoi"
                      checked={isManualRoiActive}
                      onChange={(e) => setIsManualRoiActive(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="manualRoi" className="font-semibold text-slate-700 cursor-pointer">
                      Manual Region-of-Interest (ROI) Override
                    </label>
                  </div>

                  {isManualRoiActive && (
                    <span className="text-[11px] text-teal-700 font-mono">
                      Box: {roiBox.w}% × {roiBox.h}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clinical Photography Guidelines Box */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs space-y-2">
            <h4 className="font-bold text-teal-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-700" /> Standardized Optical Capture Guide:
            </h4>
            <ul className="text-slate-600 text-[11px] space-y-1 list-disc pl-4">
              <li>Use neutral, diffuse daylight or clinical room lighting; avoid direct camera flash glare.</li>
              <li>Keep dressing indicator coupon flat and perpendicular to the camera lens.</li>
              <li>Maintain ~15–25 cm (6–10 inches) lens-to-dressing distance.</li>
              <li>Include neutral reference fiducial markers in the frame when available.</li>
              <li>Avoid capturing unrelated patient identifiable data or personal items.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Scan Parameters, Calibration, Patient Choice */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy-900 pb-3 border-b border-slate-100">
              Scan Metadata & Calibration
            </h2>

            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl text-navy-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select a registered patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_reference} — {p.name} ({p.wound_location})
                  </option>
                ))}
              </select>
            </div>

            {/* Calibration Profile Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Calibration Profile</label>
                {selectedProfile && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedProfile.validation_status === 'VALIDATED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedProfile.validation_status}
                  </span>
                )}
              </div>

              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl text-navy-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {profiles.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} (Batch: {prof.material_batch})
                  </option>
                ))}
              </select>

              {selectedProfile?.validation_status !== 'VALIDATED' && (
                <p className="text-[11px] text-amber-700 mt-1 italic">
                  Note: Experimental profiles report color measurements only. Quantitative pH will remain unvalidated.
                </p>
              )}
            </div>

            {/* Optional Scan Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Scan Notes</label>
              <textarea
                rows={3}
                value={scanNotes}
                onChange={(e) => setScanNotes(e.target.value)}
                placeholder="e.g. Day 4 post-op, moderate serous exudate, dressing intact prior to change."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Analyze Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isSubmitting || !selectedFile}
              className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Computer Vision Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Indicator Color</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
