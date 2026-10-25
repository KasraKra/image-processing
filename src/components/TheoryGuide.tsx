import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export const TheoryGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Title */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Textbook Theory &amp; Mathematical Foundations
          </span>
          <span className="text-slate-400 text-xs">Gonzalez &amp; Woods, 3rd/4th Edition</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Chapter 3: Intensity Transformations and Spatial Filtering
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
          Spatial domain techniques operate directly on the pixels of an image. This chapter covers two fundamental categories: point operations (Intensity Transformations) and neighborhood operations (Spatial Filtering).
        </p>
      </div>

      {/* Section 1: Spatial Domain General Equation */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
            1
          </span>
          <span>General Spatial Domain Formulation</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Spatial domain processes are denoted by the equation:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-cyan-300 text-base">
          {'g(x, y) = T[ f(x, y) ]'}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          where <code className="text-indigo-300">f(x, y)</code> is the input image, <code className="text-indigo-300">g(x, y)</code> is the processed image, and <code className="text-indigo-300">T</code> is an operator on <code className="text-indigo-300">f</code> defined over some neighborhood of point <code className="text-indigo-300">(x, y)</code>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-indigo-300">Neighborhood Size = 1 × 1</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When the neighborhood has size 1×1 (a single pixel), the operator <code className="text-cyan-400">T</code> depends solely on the gray level <code className="text-cyan-400">r</code> at that point, becoming a point intensity transformation: <code className="text-indigo-400">{'s = T(r)'}</code>.
            </p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-indigo-300">Neighborhood Size = m × n (Mask/Kernel)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When the neighborhood is a subimage <code className="text-cyan-400">S_xy</code> of size m×n centered on (x, y), it is called <strong>Spatial Filtering</strong>. Operators can be linear (convolution/average) or non-linear (order-statistics / median).
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Log Transformation */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
            2
          </span>
          <span>Logarithmic Transformation (Section 3.2.2)</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          The general mathematical form of the logarithmic intensity transformation is:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-cyan-300 text-base">
          {'s = c · ln(1 + r)'}
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          where <code className="text-indigo-300">c</code> is a scaling constant, and <code className="text-indigo-300">r ≥ 0</code>. Adding 1 prevents taking the logarithm of 0 (<code className="text-slate-400">ln(0) = -∞</code>), ensuring <code className="text-slate-400">ln(1) = 0</code>.
        </p>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-white">Calculating Scaling Constant c for 8-bit Images:</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            In an 8-bit image with intensities <code className="text-indigo-300">[0, 255]</code>, we want the maximum input intensity <code className="text-indigo-300">max(r)</code> to map to the maximum output display level <code className="text-indigo-300">L - 1 = 255</code>:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-center text-indigo-300 text-sm">
            {'c = (L - 1) / ln(1 + max(r)) = 255 / ln(1 + 255) ≈ 255 / 5.545 ≈ 45.986'}
          </div>
          <div className="text-xs text-slate-400 leading-relaxed pt-1">
            <strong>Key Characteristic:</strong> The log curve maps a narrow range of low-intensity (dark) input values into a wider range of output levels, while compressing high-intensity (bright) levels into a narrow range.
          </div>
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-xs text-slate-300">
            <strong>Textbook Classic Application (Fig 3.5):</strong> 2D Fourier Transforms have dynamic ranges that span 5 to 6 orders of magnitude. The central DC peak is so intense that linear scaling shows only one white dot in a sea of black. The log transform reveals all faint diffraction rings and harmonics.
          </div>
        </div>
      </section>

      {/* Section 3: Power Law (Gamma) */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
            3
          </span>
          <span>Power-Law (Gamma) Transformations (Section 3.2.3)</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Power-law transformations have the basic form:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-cyan-300 text-base">
          {'s = c · r^γ   or   s = c(r + ε)^γ'}
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          where <code className="text-indigo-300">c</code> and <code className="text-indigo-300">γ</code> are positive constants. For normalized digital images where intensities <code className="text-indigo-300">{'r ∈ [0, 1]'}</code>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-xs font-mono">γ &lt; 1</span>
              <span>Fractional Gamma (Brightening)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Plots curve <strong>upward</strong> above the 45° line. A narrow range of dark input values is mapped into a much wider range of output levels.
            </p>
            <div className="text-[11px] text-slate-400">
              <strong>Gonzalez Fig 3.8:</strong> Spine bone scans and MRI images where critical anatomical tissue is underexposed in shadow. Applying γ = 0.6, 0.4, or 0.3 brings out fine bone structures.
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-xs font-mono">γ &gt; 1</span>
              <span>High Gamma (Contrast / Darkening)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Plots curve <strong>downward</strong> below the 45° line. Compresses dark input values and expands bright values, increasing contrast and darkening hazy areas.
            </p>
            <div className="text-[11px] text-slate-400">
              <strong>Gonzalez Fig 3.9:</strong> Aerial photographs that appear washed out and bleached by bright sky haze. Applying γ = 3.0 or 4.0 restores crisp contrast.
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1">
          <span className="font-semibold text-white block">Historical Context: Display Gamma Correction</span>
          <p>
            Cathode Ray Tube (CRT) monitors have an inherent non-linear response where output electron beam intensity follows voltage to power γ, with γ ≈ 2.2. To view images correctly on CRTs, images were pre-corrected by applying the inverse transform <code className="text-cyan-400">{'s = r^(1/2.2) ≈ r^0.45'}</code> before transmission.
          </p>
        </div>
      </section>

      {/* Section 4: Spatial Filtering & Median Filter */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
            4
          </span>
          <span>Spatial Filtering — Median Order-Statistic Filter (Section 3.5.3)</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Order-statistic filters are non-linear spatial filters whose response is based on ranking (ordering) the pixels contained in the image area encompassed by the filter.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-cyan-300 text-base">
          {'f_hat(x, y) = median_{(s, t) in S_xy} { g(s, t) }'}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">Why Linear Averaging Fails and Median Filter Succeeds:</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-rose-900/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Linear Mean / Box Filter Problem</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Linear filters compute a weighted arithmetic mean: <code className="text-rose-300">{'avg = (1 / mn) * sum(g(s, t))'}</code>.
                When an isolated salt (255) or pepper (0) noise spike occurs, it is included in the summation. This smears the impulse noise into a fuzzy gray cloud and blurs sharp structural boundaries.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-emerald-900/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Median Order-Statistic Solution</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The median filter sorts all values in the neighborhood. Because salt (255) and pepper (0) are extreme outliers, they are pushed to the very ends of the ordered list. The middle element selected is almost always an uncorrupted neighbor, completely discarding the noise while preserving sharp edges!
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 leading-relaxed">
            <strong>Gonzalez Fig 3.35 Insight:</strong> On a printed circuit board image with tracks and solder pads corrupted by 10% salt-and-pepper noise, a 3×3 median filter restores the image with near-perfect fidelity, whereas a 3×3 averaging filter leaves visible noise artifacts and degrades edge sharpness.
          </div>
        </div>
      </section>

      {/* Comparison Reference Table */}
      <section className="space-y-4 pt-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
            5
          </span>
          <span>Chapter 3 Reference Summary Table</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Technique</th>
                <th className="py-3 px-4">Mathematical Formula</th>
                <th className="py-3 px-4">Key Parameters</th>
                <th className="py-3 px-4">Primary Application</th>
                <th className="py-3 px-4">Textbook Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Log Transform</td>
                <td className="py-3 px-4 font-mono text-cyan-300">s = c · ln(1 + r)</td>
                <td className="py-3 px-4 font-mono">c = 255 / ln(1 + max(r))</td>
                <td className="py-3 px-4">Dynamic range compression (Fourier spectrum)</td>
                <td className="py-3 px-4 text-indigo-400">Sec. 3.2.2</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Power-Law (γ &lt; 1)</td>
                <td className="py-3 px-4 font-mono text-cyan-300">{'s = c · r^γ (γ < 1)'}</td>
                <td className="py-3 px-4 font-mono">γ = 0.3, 0.4, 0.6</td>
                <td className="py-3 px-4">Brightening dark areas (MRI/bone scans, shadows)</td>
                <td className="py-3 px-4 text-indigo-400">Sec. 3.2.3</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Power-Law (γ &gt; 1)</td>
                <td className="py-3 px-4 font-mono text-cyan-300">{'s = c · r^γ (γ > 1)'}</td>
                <td className="py-3 px-4 font-mono">γ = 1.5, 2.5, 4.0</td>
                <td className="py-3 px-4">Enhancing contrast, restoring washed-out images</td>
                <td className="py-3 px-4 text-indigo-400">Sec. 3.2.3</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Median Spatial Filter</td>
                <td className="py-3 px-4 font-mono text-cyan-300">{'f_hat(x, y) = median{g(s,t)}'}</td>
                <td className="py-3 px-4 font-mono">3×3, 5×5, 7×7</td>
                <td className="py-3 px-4">Impulse noise removal with sharp edge retention</td>
                <td className="py-3 px-4 text-indigo-400">Sec. 3.5.3</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Mean / Box Filter</td>
                <td className="py-3 px-4 font-mono text-cyan-300">{'g(x, y) = (1/mn) * sum(f)'}</td>
                <td className="py-3 px-4 font-mono">Uniform 1/9 mask</td>
                <td className="py-3 px-4">Linear smoothing (blurs impulse noise into halos)</td>
                <td className="py-3 px-4 text-indigo-400">Sec. 3.5.1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
