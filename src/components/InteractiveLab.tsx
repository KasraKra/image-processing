import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sliders,
  Sparkles,
  Upload,
  RefreshCw,
  Eye,
  Columns,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import {
  applyLogTransform,
  applyPowerLawTransform,
  applyMedianFilter,
  applyBoxFilter,
  addSaltAndPepperNoise,
  calculateHistogram,
  generateTestPattern,
  HistogramData
} from '../utils/imageTransforms';
import { HistogramChart } from './HistogramChart';
import { TransferCurveChart } from './TransferCurveChart';
import { SplitViewSlider } from './SplitViewSlider';

interface InteractiveLabProps {
  onDownloadNotebook: () => void;
}

export const InteractiveLab: React.FC<InteractiveLabProps> = ({ onDownloadNotebook }) => {
  // Method selection
  const [method, setMethod] = useState<'log' | 'power_law' | 'median'>('log');

  // Benchmark image selection
  const [testImageKey, setTestImageKey] = useState<'fourier' | 'dark_spine' | 'washed_out' | 'circuit_board' | 'custom'>('fourier');

  // Parameters
  // Log
  const [logAutoC, setLogAutoC] = useState(true);
  const [logC, setLogC] = useState(45.98);
  const [effectiveC, setEffectiveC] = useState(45.98);

  // Power Law (Gamma)
  const [gamma, setGamma] = useState(0.4);
  const [powerC, setPowerC] = useState(1.0);

  // Median Filter
  const [kernelSize, setKernelSize] = useState<3 | 5 | 7>(3);
  const [saltProb, setSaltProb] = useState(0.05);
  const [pepperProb, setPepperProb] = useState(0.05);
  const [noiseSeed, setNoiseSeed] = useState(42);
  const [noiseApplied, setNoiseApplied] = useState(true);
  const [compareWithBox, setCompareWithBox] = useState(true);

  // View mode: 'sideBySide' | 'split' | 'difference'
  const [viewMode, setViewMode] = useState<'sideBySide' | 'split' | 'difference'>('sideBySide');

  // Image data & stats
  const [imgDim, setImgDim] = useState({ width: 256, height: 256 });
  const [inputHist, setInputHist] = useState<HistogramData>({ bins: new Array(256).fill(0), min: 0, max: 255, mean: 128, stdDev: 40 });
  const [outputHist, setOutputHist] = useState<HistogramData>({ bins: new Array(256).fill(0), min: 0, max: 255, mean: 128, stdDev: 40 });
  const [metrics, setMetrics] = useState<{ mse: number; psnr: number } | null>(null);

  // Canvases
  const rawBaseDataRef = useRef<Uint8ClampedArray | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageRevision, setImageRevision] = useState(0);

  // Suggest default test image when switching methods
  useEffect(() => {
    if (method === 'log' && testImageKey !== 'custom') {
      setTestImageKey('fourier');
    } else if (method === 'power_law' && testImageKey !== 'custom') {
      setTestImageKey('dark_spine');
      setGamma(0.4);
    } else if (method === 'median' && testImageKey !== 'custom') {
      setTestImageKey('circuit_board');
      setNoiseApplied(true);
    }
  }, [method]);

  // Load / Generate base image
  const reloadBaseImage = useCallback(() => {
    if (testImageKey === 'custom') return; // Handled by file upload
    const { width, height } = imgDim;
    const base = generateTestPattern(testImageKey, width, height);
    rawBaseDataRef.current = base;
    setImageRevision((r) => r + 1);
  }, [testImageKey, imgDim]);

  useEffect(() => {
    reloadBaseImage();
  }, [reloadBaseImage]);

  // Execute processing pipeline
  const processImage = useCallback(() => {
    if (!rawBaseDataRef.current) return;
    const { width, height } = imgDim;

    // Step 1: determine effective input (with or without noise for median filter)
    let currentInput: Uint8ClampedArray;
    if (method === 'median' && noiseApplied) {
      currentInput = addSaltAndPepperNoise(rawBaseDataRef.current, saltProb, pepperProb, noiseSeed);
    } else {
      currentInput = new Uint8ClampedArray(rawBaseDataRef.current);
    }

    // Render Input Canvas
    const inCanvas = originalCanvasRef.current;
    if (inCanvas) {
      inCanvas.width = width;
      inCanvas.height = height;
      const ctx = inCanvas.getContext('2d');
      if (ctx) {
        const imgData = new ImageData(new Uint8ClampedArray(currentInput), width, height);
        ctx.putImageData(imgData, 0, 0);
      }
    }
    const inStats = calculateHistogram(currentInput, width, height);
    setInputHist(inStats);

    // Step 2: Apply chosen method
    let result: Uint8ClampedArray;
    let boxResult: Uint8ClampedArray | null = null;

    if (method === 'log') {
      const logRes = applyLogTransform(currentInput, logAutoC ? undefined : logC);
      result = logRes.output;
      setEffectiveC(logRes.effectiveC);
    } else if (method === 'power_law') {
      const powRes = applyPowerLawTransform(currentInput, gamma, powerC);
      result = powRes.output;
    } else {
      // Median filtering
      result = applyMedianFilter(currentInput, width, height, kernelSize);
      if (compareWithBox) {
        boxResult = applyBoxFilter(currentInput, width, height, kernelSize);
      }

      // Compute MSE / PSNR between pristine clean reference and median output
      if (rawBaseDataRef.current) {
        const clean = rawBaseDataRef.current;
        let sumSq = 0;
        const total = width * height;
        for (let i = 0; i < result.length; i += 4) {
          const diff = clean[i] - result[i];
          sumSq += diff * diff;
        }
        const mse = sumSq / total;
        const psnr = mse === 0 ? 99.9 : 10 * Math.log10((255 * 255) / mse);
        setMetrics({ mse, psnr });
      }
    }

    // Render Output Canvas
    const outCanvas = outputCanvasRef.current;
    if (outCanvas) {
      outCanvas.width = width;
      outCanvas.height = height;
      const ctx = outCanvas.getContext('2d');
      if (ctx) {
        const outImgData = new ImageData(new Uint8ClampedArray(result), width, height);
        ctx.putImageData(outImgData, 0, 0);
      }
    }

    const outStats = calculateHistogram(result, width, height);
    setOutputHist(outStats);

    // Render Box Canvas if needed
    if (boxResult && boxCanvasRef.current) {
      const bCanvas = boxCanvasRef.current;
      bCanvas.width = width;
      bCanvas.height = height;
      const ctx = bCanvas.getContext('2d');
      if (ctx) {
        const bImgData = new ImageData(new Uint8ClampedArray(boxResult), width, height);
        ctx.putImageData(bImgData, 0, 0);
      }
    }

    // Render Difference Canvas (|Input - Output| amplified for visualization)
    if (diffCanvasRef.current) {
      const dCanvas = diffCanvasRef.current;
      dCanvas.width = width;
      dCanvas.height = height;
      const ctx = dCanvas.getContext('2d');
      if (ctx) {
        const diffData = new Uint8ClampedArray(result.length);
        for (let i = 0; i < result.length; i += 4) {
          const dR = Math.min(255, Math.abs(currentInput[i] - result[i]) * 2);
          const dG = Math.min(255, Math.abs(currentInput[i + 1] - result[i + 1]) * 2);
          const dB = Math.min(255, Math.abs(currentInput[i + 2] - result[i + 2]) * 2);
          diffData[i] = dR;
          diffData[i + 1] = dG;
          diffData[i + 2] = dB;
          diffData[i + 3] = 255;
        }
        const diffImgData = new ImageData(diffData, width, height);
        ctx.putImageData(diffImgData, 0, 0);
      }
    }
  }, [
    imgDim,
    method,
    logAutoC,
    logC,
    gamma,
    powerC,
    kernelSize,
    saltProb,
    pepperProb,
    noiseSeed,
    noiseApplied,
    compareWithBox,
    imageRevision
  ]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Constrain to reasonable 256x256 or 384x384 for fast real-time interactive filtering
        const targetDim = 256;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetDim;
        offCanvas.height = targetDim;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetDim, targetDim);
          const imgData = ctx.getImageData(0, 0, targetDim, targetDim);
          rawBaseDataRef.current = imgData.data;
          setImgDim({ width: targetDim, height: targetDim });
          setTestImageKey('custom');
          processImage();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with book citation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Gonzalez & Woods Reference Implementation
            </span>
            <span className="text-slate-400 text-xs">• Section 3.2 & 3.5</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Spatial Intensity Transformations & Order-Statistic Filtering
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Experiment with exact textbook transformations: Dynamic range compression via Logarithmic mapping, contrast enhancement with Power-Law (Gamma), and non-linear Median Filtering for impulse noise eradication without edge degradation.
          </p>
        </div>

        <button
          onClick={onDownloadNotebook}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all shrink-0 cursor-pointer"
          aria-label="Download Gonzalez Jupyter Notebook"
        >
          <FileDown className="w-4 h-4" />
          <span>Get .ipynb Notebook</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Technique Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Select Transformation Technique
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMethod('log')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  method === 'log'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="Select Log Transform"
              >
                <span className="text-xs">Log Transform</span>
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">s = c·ln(1+r)</span>
              </button>

              <button
                onClick={() => setMethod('power_law')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  method === 'power_law'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="Select Power Law Gamma Transform"
              >
                <span className="text-xs">Power-Law</span>
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">s = c·r^γ</span>
              </button>

              <button
                onClick={() => setMethod('median')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  method === 'median'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="Select Median Spatial Filter"
              >
                <span className="text-xs">Median Filter</span>
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">median(Sxy)</span>
              </button>
            </div>
          </div>

          {/* Test Image Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Benchmark Test Image
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                aria-label="Upload custom image"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Custom</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setTestImageKey('fourier')}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  testImageKey === 'fourier'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs">Fourier Spectrum</div>
                <div className="text-[10px] text-slate-500">Log transform demo (Fig 3.5)</div>
              </button>

              <button
                onClick={() => setTestImageKey('dark_spine')}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  testImageKey === 'dark_spine'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs">Spine Scan (Dark)</div>
                <div className="text-[10px] text-slate-500">γ &lt; 1 demo (Fig 3.8)</div>
              </button>

              <button
                onClick={() => setTestImageKey('washed_out')}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  testImageKey === 'washed_out'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs">Aerial (Washed)</div>
                <div className="text-[10px] text-slate-500">γ &gt; 1 demo (Fig 3.9)</div>
              </button>

              <button
                onClick={() => setTestImageKey('circuit_board')}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  testImageKey === 'circuit_board'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs">Circuit Board</div>
                <div className="text-[10px] text-slate-500">Median filter demo (Fig 3.35)</div>
              </button>
            </div>
            {testImageKey === 'custom' && (
              <div className="text-[11px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Custom user image loaded ({imgDim.width}×{imgDim.height}px)</span>
              </div>
            )}
          </div>

          {/* Dynamic Parameter Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Transformation Parameters
              </label>
              <span className="text-[11px] font-mono text-indigo-400">
                {method === 'log' && `c = ${effectiveC.toFixed(2)}`}
                {method === 'power_law' && `γ = ${gamma.toFixed(2)}, c = ${powerC.toFixed(1)}`}
                {method === 'median' && `Kernel: ${kernelSize}×${kernelSize}`}
              </span>
            </div>

            {/* LOG TRANSFORM CONTROLS */}
            {method === 'log' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-medium text-slate-200">Auto-Compute Constant c</span>
                    <p className="text-[10px] text-slate-400">c = 255 / ln(1 + max(r)) as per Gonzalez</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={logAutoC}
                    onChange={(e) => setLogAutoC(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    aria-label="Auto Compute c"
                  />
                </div>

                {!logAutoC && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>Manual Scaling Constant c</span>
                      <span className="font-mono text-indigo-400">{logC.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="0.5"
                      value={logC}
                      onChange={(e) => setLogC(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                      aria-label="Scaling constant c"
                    />
                  </div>
                )}

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-300">Gonzalez Note (Sec. 3.2.2):</div>
                  <p>
                    Log transformation compresses extreme dynamic range (e.g., Fourier spectra where the DC peak completely overwhelms fine high-frequency spectrum rings). Dark pixels are mapped to a much broader visible intensity range.
                  </p>
                </div>
              </div>
            )}

            {/* POWER LAW (GAMMA) CONTROLS */}
            {method === 'power_law' && (
              <div className="space-y-3.5 text-xs">
                {/* Gamma slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Gamma Parameter (γ)</span>
                    <span className="font-mono font-bold text-indigo-400">{gamma.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="5.0"
                    step="0.05"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                    aria-label="Gamma parameter slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.05 (Very Bright)</span>
                    <span>1.0 (Linear)</span>
                    <span>5.0 (High Contrast)</span>
                  </div>
                </div>

                {/* Quick Gamma Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Textbook Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[0.3, 0.4, 0.6, 1.0, 1.8, 3.0, 4.0].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGamma(g)}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                          gamma === g
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        aria-label={`Set Gamma to ${g}`}
                      >
                        γ={g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multiplier c */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Scaling Multiplier (c)</span>
                    <span className="font-mono text-indigo-400">{powerC.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={powerC}
                    onChange={(e) => setPowerC(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                    aria-label="Multiplier c"
                  />
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-indigo-300">Gonzalez Note (Sec. 3.2.3):</div>
                  <p>
                    {gamma < 1
                      ? 'γ < 1 curves upward: expands dark gray levels, revealing hidden anatomy in dark MRI/X-ray scans.'
                      : gamma > 1
                      ? 'γ > 1 curves downward: compresses dark levels and expands bright levels, restoring washed-out overexposed images.'
                      : 'γ = 1: Linear identity transformation.'}
                  </p>
                </div>
              </div>
            )}

            {/* MEDIAN FILTER CONTROLS */}
            {method === 'median' && (
              <div className="space-y-3.5 text-xs">
                {/* Kernel Size */}
                <div className="space-y-1.5">
                  <span className="text-slate-400">Neighborhood Mask Size (Kernel):</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 5, 7] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setKernelSize(k)}
                        className={`py-1.5 rounded-lg border text-center font-mono text-xs font-medium transition-all ${
                          kernelSize === k
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                        aria-label={`Kernel size ${k}x${k}`}
                      >
                        {k} × {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salt and pepper noise injection */}
                <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">Impulse (Salt & Pepper) Noise</span>
                    <button
                      onClick={() => setNoiseSeed((s) => s + 1)}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                      aria-label="Reseed noise"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reseed</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Salt (White: 255)</span>
                        <span className="font-mono text-indigo-400">{Math.round(saltProb * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={saltProb}
                        onChange={(e) => setSaltProb(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                        aria-label="Salt probability"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Pepper (Black: 0)</span>
                        <span className="font-mono text-indigo-400">{Math.round(pepperProb * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={pepperProb}
                        onChange={(e) => setPepperProb(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                        aria-label="Pepper probability"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setNoiseApplied(!noiseApplied)}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        noiseApplied
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                      aria-label="Toggle noise injection"
                    >
                      {noiseApplied ? 'Noise Injected (Active)' : 'Inject Noise'}
                    </button>
                    <button
                      onClick={() => {
                        setSaltProb(0.05);
                        setPepperProb(0.05);
                        setNoiseApplied(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400"
                      aria-label="Reset noise"
                    >
                      Reset 10%
                    </button>
                  </div>
                </div>

                {/* Compare with Linear Mean Filter */}
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-medium text-slate-200">Compare with Mean / Box Filter</span>
                    <p className="text-[10px] text-slate-400">Shows why linear smoothing smears impulse noise</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={compareWithBox}
                    onChange={(e) => setCompareWithBox(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    aria-label="Compare with Mean Box filter"
                  />
                </div>

                {/* Quality Metrics */}
                {metrics && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mean Squared Error (MSE)</span>
                      <span className="text-emerald-400 font-semibold">{metrics.mse.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PSNR Quality</span>
                      <span className="text-cyan-400 font-semibold">{metrics.psnr.toFixed(2)} dB</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transfer Curve / Formula preview */}
          {method !== 'median' ? (
            <TransferCurveChart
              type={method}
              gamma={gamma}
              c={powerC}
              effectiveC={effectiveC}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Median Filter Mathematical Definition</span>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono text-center text-indigo-400 text-[11px]">
                {'f_hat(x, y) = median_{(s, t) in S_xy} { g(s, t) }'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Replaces pixel (x, y) with the median gray-level in neighborhood S_xy. Impulse noise pixels (0 or 255) are outliers that naturally get pushed to extreme indices when sorted, selecting true boundary intensities.
              </p>
            </div>
          )}
        </div>

        {/* Right Preview & Visual Workbench */}
        <div className="lg:col-span-8 space-y-5">
          {/* View Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('sideBySide')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'sideBySide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Side by side view"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side by Side</span>
              </button>

              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Split wipe curtain view"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Curtain Wipe</span>
              </button>

              <button
                onClick={() => setViewMode('difference')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'difference' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Difference map view"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Difference Map</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Hardware Accelerated Canvas</span>
            </div>
          </div>

          {/* Interactive Visual Canvas Area */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            {viewMode === 'sideBySide' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        Input Image {method === 'median' && noiseApplied ? '(Corrupted with Impulse Noise)' : '(Original)'}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{imgDim.width}×{imgDim.height}px</span>
                    </div>
                    <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center min-h-[260px]">
                      <canvas
                        ref={originalCanvasRef}
                        className="max-w-full h-auto rounded-lg shadow-md block"
                      />
                    </div>
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-400">
                        {method === 'log' && 'Logarithmically Transformed'}
                        {method === 'power_law' && `Power-Law Transformed (γ=${gamma.toFixed(2)})`}
                        {method === 'median' && `Median Filter Output (${kernelSize}×${kernelSize})`}
                      </span>
                      <span className="text-indigo-400 font-mono text-[11px]">Processed</span>
                    </div>
                    <div className="bg-slate-950 rounded-xl border border-indigo-900/40 p-2 flex items-center justify-center min-h-[260px]">
                      <canvas
                        ref={outputCanvasRef}
                        className="max-w-full h-auto rounded-lg shadow-md block"
                      />
                    </div>
                  </div>
                </div>

                {/* Comparison with Box Filter if median filtering is active */}
                {method === 'median' && compareWithBox && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-amber-400">Linear Mean / Box Filter ({kernelSize}×{kernelSize})</span>
                        <span className="text-[10px] text-slate-400">— Note how salt-and-pepper noise is blurred into gray halos instead of removed!</span>
                      </div>
                      <span className="text-amber-400 font-mono text-[11px]">Linear Comparison</span>
                    </div>
                    <div className="bg-slate-950 rounded-xl border border-amber-900/40 p-2 flex items-center justify-center">
                      <canvas
                        ref={boxCanvasRef}
                        className="max-h-[220px] w-auto rounded-lg shadow-md block"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'split' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 mb-2">
                  Drag the slider handle horizontally across the canvas to inspect edge crispness and contrast transitions:
                </div>
                <SplitViewSlider
                  beforeCanvasRef={originalCanvasRef}
                  afterCanvasRef={outputCanvasRef}
                  beforeLabel={method === 'median' ? 'Noisy Input' : 'Original'}
                  afterLabel={method === 'median' ? `Median ${kernelSize}×${kernelSize}` : `Transformed`}
                  width={imgDim.width}
                  height={imgDim.height}
                />
              </div>
            )}

            {viewMode === 'difference' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300">
                    Difference Map <code className="text-cyan-400 font-mono text-[11px]">|Original - Transformed| × 2</code>
                  </span>
                  <span className="text-slate-400 text-[11px]">Bright areas indicate significant spatial alteration</span>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center min-h-[300px]">
                  <canvas
                    ref={diffCanvasRef}
                    className="max-h-[340px] w-auto rounded-lg shadow-md block"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Histogram Visualizer Component */}
          <HistogramChart
            inputHist={inputHist}
            outputHist={outputHist}
            label={
              method === 'log'
                ? 'Dynamic Range Histogram: Compressed Spectrum'
                : method === 'power_law'
                ? `Histogram Redistribution (Gamma γ = ${gamma.toFixed(2)})`
                : 'Noise Removal Histogram: S&P Outlier Suppression'
            }
          />

          {/* Quick takeaway summary box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-white block">Key Gonzalez & Woods Insight</span>
              {method === 'log' && (
                <p>
                  In Fourier transforms, the central 0-frequency term ($F(0,0)$) is usually thousands of times brighter than higher frequencies. A linear display renders high-frequency details completely invisible as pure black ($0$). The log transform stretches the lower range, unveiling the delicate concentric diffraction rings and spectral cross patterns.
                </p>
              )}
              {method === 'power_law' && (
                <p>
                  Gamma correction ($s = c \cdot r^\gamma$) is universally employed in television, digital photography, and medical imaging. When $\gamma &lt; 1$, shadows and underexposed regions are brightened without blowing out highlights. When $\gamma &gt; 1$, hazy or washed-out images gain rich contrast and localized saturation.
                </p>
              )}
              {method === 'median' && (
                <p>
                  Linear convolution filters (like mean or Gaussian averaging) blur edges because every pixel in the window contributes to the weighted sum, turning sharp lines fuzzy. In contrast, the median filter selects the median value in the ranked sequence: an isolated salt (255) or pepper (0) impulse is completely discarded, leaving crisp structural edges untouched.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
