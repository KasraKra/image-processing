/**
 * Image processing utilities based on Rafael C. Gonzalez & Richard E. Woods
 * "Digital Image Processing" (Chapter 3: Intensity Transformations and Spatial Filtering).
 */

export interface HistogramData {
  bins: number[];
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

/**
 * Logarithmic Transformation: s = c * log(1 + r)
 * Compresses dynamic range of images with large variations in intensity.
 * @param data RGBA Uint8ClampedArray
 * @param c Scaling constant (if undefined or <= 0, auto-calculated as 255 / ln(1 + max_r))
 */
export function applyLogTransform(
  data: Uint8ClampedArray,
  c?: number
): { output: Uint8ClampedArray; effectiveC: number; formula: string } {
  const len = data.length;
  const output = new Uint8ClampedArray(len);

  // Find maximum intensity in the input
  let maxR = 0;
  for (let i = 0; i < len; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    if (gray > maxR) maxR = gray;
  }
  if (maxR === 0) maxR = 255;

  // Gonzalez & Woods formula: c = (L - 1) / log(1 + max(r))
  const effectiveC = c && c > 0 ? c : 255 / Math.log(1 + maxR);

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Compute logarithmic transform for each channel or grayscale
    const sR = Math.min(255, Math.max(0, Math.round(effectiveC * Math.log(1 + r))));
    const sG = Math.min(255, Math.max(0, Math.round(effectiveC * Math.log(1 + g))));
    const sB = Math.min(255, Math.max(0, Math.round(effectiveC * Math.log(1 + b))));

    output[i] = sR;
    output[i + 1] = sG;
    output[i + 2] = sB;
    output[i + 3] = a;
  }

  return {
    output,
    effectiveC,
    formula: `s = ${effectiveC.toFixed(2)} \\cdot \\ln(1 + r)`
  };
}

/**
 * Power-Law (Gamma) Transformation: s = c * r^gamma
 * Maps narrow range of dark inputs into wider range (gamma < 1) or expands bright inputs (gamma > 1).
 * Normalized computation: s = 255 * c * (r / 255)^gamma
 */
export function applyPowerLawTransform(
  data: Uint8ClampedArray,
  gamma: number,
  c: number = 1.0
): { output: Uint8ClampedArray; formula: string } {
  const len = data.length;
  const output = new Uint8ClampedArray(len);

  // Precompute lookup table (LUT) for 0..255 for speed
  const lut = new Uint8Array(256);
  for (let r = 0; r < 256; r++) {
    const normalized = r / 255;
    const transformed = c * Math.pow(normalized, gamma);
    lut[r] = Math.min(255, Math.max(0, Math.round(transformed * 255)));
  }

  for (let i = 0; i < len; i += 4) {
    output[i] = lut[data[i]];
    output[i + 1] = lut[data[i + 1]];
    output[i + 2] = lut[data[i + 2]];
    output[i + 3] = data[i + 3];
  }

  return {
    output,
    formula: `s = ${c.toFixed(2)} \\cdot r^{${gamma.toFixed(2)}}`
  };
}

/**
 * Median Filtering (Order-Statistic Filter):
 * Replaces the value of a pixel by the median of the gray levels in the neighborhood.
 * Highly effective at removing impulse (salt-and-pepper) noise without blurring edges.
 */
export function applyMedianFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernelSize: number = 3
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = Math.floor(kernelSize / 2);
  const windowSize = kernelSize * kernelSize;
  const medianIdx = Math.floor(windowSize / 2);

  const windowR = new Uint8Array(windowSize);
  const windowG = new Uint8Array(windowSize);
  const windowB = new Uint8Array(windowSize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          // Replicate border padding
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + px) * 4;

          windowR[count] = data[idx];
          windowG[count] = data[idx + 1];
          windowB[count] = data[idx + 2];
          count++;
        }
      }

      // Sort arrays to find median
      windowR.sort();
      windowG.sort();
      windowB.sort();

      const outIdx = (y * width + x) * 4;
      output[outIdx] = windowR[medianIdx];
      output[outIdx + 1] = windowG[medianIdx];
      output[outIdx + 2] = windowB[medianIdx];
      output[outIdx + 3] = data[outIdx + 3];
    }
  }

  return output;
}

/**
 * Linear Mean/Box Filter for direct comparison against Median Filter
 * Demonstrates why linear smoothing blurs edges and fails to clean salt-and-pepper noise cleanly.
 */
export function applyBoxFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernelSize: number = 3
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = Math.floor(kernelSize / 2);
  const windowSize = kernelSize * kernelSize;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + px) * 4;

          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
        }
      }

      const outIdx = (y * width + x) * 4;
      output[outIdx] = Math.round(sumR / windowSize);
      output[outIdx + 1] = Math.round(sumG / windowSize);
      output[outIdx + 2] = Math.round(sumB / windowSize);
      output[outIdx + 3] = data[outIdx + 3];
    }
  }

  return output;
}

/**
 * Injects Salt & Pepper noise for realistic testing of median filter
 */
export function addSaltAndPepperNoise(
  data: Uint8ClampedArray,
  saltProb: number = 0.05,
  pepperProb: number = 0.05,
  seed: number = 42
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);
  let s = seed;
  // Simple LCG pseudo-random generator for reproducible deterministic noise
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const p = rand();
    if (p < saltProb) {
      // Salt (pure white: 255)
      output[i] = 255;
      output[i + 1] = 255;
      output[i + 2] = 255;
    } else if (p < saltProb + pepperProb) {
      // Pepper (pure black: 0)
      output[i] = 0;
      output[i + 1] = 0;
      output[i + 2] = 0;
    }
  }

  return output;
}

/**
 * Calculates 256-bin histogram and statistics from pixel data
 */
export function calculateHistogram(
  data: Uint8ClampedArray,
  width: number,
  height: number
): HistogramData {
  const bins = new Array(256).fill(0);
  const totalPixels = width * height;
  let min = 255;
  let max = 0;
  let sum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    bins[gray]++;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
    sum += gray;
  }

  const mean = totalPixels > 0 ? sum / totalPixels : 0;

  let sumSquares = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    sumSquares += (gray - mean) * (gray - mean);
  }
  const stdDev = totalPixels > 0 ? Math.sqrt(sumSquares / totalPixels) : 0;

  return { bins, min, max, mean, stdDev };
}

/**
 * Generates Gonzalez & Woods Synthetic Benchmark Test Images:
 * 1. Fourier Spectrum Simulation (log transform demo)
 * 2. Washed Out / Dark Spine Simulation (power-law gamma demo)
 * 3. Circuit Board / Cameraman Pattern with Salt & Pepper (median filter demo)
 */
export function generateTestPattern(
  type: 'fourier' | 'washed_out' | 'circuit_board' | 'dark_spine',
  width: number = 256,
  height: number = 256
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;

  if (type === 'fourier') {
    // Fourier 2D power spectrum with huge dynamic range (high DC peak at center, decaying ripples)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Exponential decay with cross patterns and concentric Bessel-like rings
        let val = 0;
        if (dist === 0) {
          val = 255;
        } else {
          const cross = (Math.abs(dx) < 2 ? 180 : 0) + (Math.abs(dy) < 2 ? 180 : 0);
          const ring = Math.sin(dist * 0.4) * Math.cos(dist * 0.2);
          const highFreqRipples = Math.abs(ring) * 120 / (1 + dist * 0.08);
          const base = 255 / (1 + Math.pow(dist, 1.2) * 0.2);
          val = Math.min(255, Math.max(0, Math.round(base + highFreqRipples + cross / (1 + dist * 0.05))));
        }
        const idx = (y * width + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
  } else if (type === 'dark_spine') {
    // Simulates fractured vertebra / spine bone scan from Gonzalez Figure 3.8
    // Predominantly dark background with subtle low-intensity structural details
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - cx) / width;
        const dy = (y - cy) / height;
        // Central column structure with vertebrae segments
        const colDist = Math.abs(dx * 4);
        const segment = Math.cos(dy * 30);
        let intensity = 15; // low ambient base
        if (colDist < 0.6) {
          intensity += (1 - colDist / 0.6) * 45;
          if (segment > 0) {
            intensity += segment * 35;
          }
          // Inner bone marrow / detail
          const fineTexture = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 15;
          intensity += fineTexture;
        }
        intensity = Math.min(255, Math.max(0, Math.round(intensity)));
        const idx = (y * width + x) * 4;
        data[idx] = intensity;
        data[idx + 1] = intensity;
        data[idx + 2] = intensity;
        data[idx + 3] = 255;
      }
    }
  } else if (type === 'washed_out') {
    // Washed out high-key image (e.g. overexposed aerial view / high gamma test)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        // Low contrast in upper ranges (190 - 245)
        const landscape = Math.sin(nx * 12) * Math.cos(ny * 12) * 15 + Math.sin(nx * 4) * 15;
        const intensity = Math.min(255, Math.max(0, Math.round(210 + landscape)));
        const idx = (y * width + x) * 4;
        data[idx] = intensity;
        data[idx + 1] = intensity;
        data[idx + 2] = intensity;
        data[idx + 3] = 255;
      }
    }
  } else {
    // Circuit Board test pattern with geometric tracks, pads, and text (Gonzalez Fig 3.35)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let val = 40; // dark green/gray PCB background
        // Horizontal and vertical conductive tracks
        if (y % 32 >= 14 && y % 32 <= 18) val = 200;
        if (x % 32 >= 14 && x % 32 <= 18) val = 200;

        // Circular soldering pads
        const cellX = (x % 64) - 32;
        const cellY = (y % 64) - 32;
        const padDist = Math.sqrt(cellX * cellX + cellY * cellY);
        if (padDist < 12) val = 230;
        if (padDist < 5) val = 20; // drill hole

        // Diagonal trace
        if (Math.abs((x + y) % 64 - 32) < 3) val = 180;

        const idx = (y * width + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
  }

  return data;
}

/**
 * Builds the official Jupyter Notebook JSON (.ipynb v4)
 * with complete Gonzalez & Woods textbook explanations, equations, Python code,
 * Matplotlib graphs, and comparative demonstrations.
 */
export function buildGonzalezJupyterNotebook() {
  return {
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "# Digital Image Processing — Rafael C. Gonzalez & Richard E. Woods\n",
          "## Chapter 3: Intensity Transformations and Spatial Filtering\n",
          "\n",
          "This notebook provides a comprehensive, interactive implementation of the fundamental techniques covered in **Chapter 3 of Gonzalez & Woods' *Digital Image Processing***:\n",
          "\n",
          "1. **Intensity Transformations**:\n",
          "   - **Logarithmic Transformations** ($s = c \\log(1 + r)$) for dynamic range compression.\n",
          "   - **Power-Law (Gamma) Transformations** ($s = c \\cdot r^\\gamma$) for contrast adjustment and display gamma calibration.\n",
          "2. **Spatial Filtering**:\n",
          "   - **Median Filtering** (Order-Statistic Filtering) for non-linear impulse (salt-and-pepper) noise reduction without boundary blurring.\n",
          "   - Direct comparison with linear **Mean / Box Smoothing**.\n",
          "\n",
          "---\n",
          "### Mathematical Framework\n",
          "Spatial domain processes are denoted by the expression:\n",
          "$$\ng(x, y) = T[f(x, y)]\n",
          "$$\n",
          "where $f(x, y)$ is the input image, $g(x, y)$ is the processed image, and $T$ is an operator on $f$ defined over a specified neighborhood about point $(x, y)$. When the neighborhood size is $1 \\times 1$, $T$ becomes an **intensity (gray-level) transformation function** of the form:\n",
          "$$\ns = T(r)\n",
          "$$\n",
          "where $r$ and $s$ denote the intensity of $f(x, y)$ and $g(x, y)$ at any point $(x, y)$."
        ]
      },
      {
        cell_type: "code",
        execution_count: 1,
        metadata: {},
        outputs: [],
        source: [
          "# Essential dependencies\n",
          "import numpy as np\n",
          "import matplotlib.pyplot as plt\n",
          "import cv2\n",
          "from scipy import ndimage\n",
          "\n",
          "# Plot styling for publication-grade figures\n",
          "plt.rcParams['figure.figsize'] = (14, 8)\n",
          "plt.rcParams['image.cmap'] = 'gray'\n",
          "plt.rcParams['font.size'] = 11\n",
          "print('Environment initialized successfully. NumPy version:', np.__version__)"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## Part 1: Logarithmic Transformations\n",
          "\n",
          "### 1.1 Theory (Gonzalez & Woods, Section 3.2.2)\n",
          "The general form of the log transformation is:\n",
          "$$\ns = c \\log(1 + r)\n",
          "$$\n",
          "where $c$ is a scaling constant, and $r \\ge 0$. We add $1$ to the input intensities because $\\log(0)$ is undefined (or $-\\infty$) and $\\log(1) = 0$.\n",
          "\n",
          "#### Key Characteristics:\n",
          "- **Expands dark pixels**: Maps a narrow range of low-intensity input levels into a wider range of output levels.\n",
          "- **Compresses bright pixels**: The opposite is true of higher values of input levels.\n",
          "- **Scaling Constant $c$**: In an 8-bit image where maximum output is $L-1 = 255$:\n",
          "  $$\n",
          "  c = \\frac{L - 1}{\\ln(1 + \\max(r))} = \\frac{255}{\\ln(1 + 255)} \\approx 45.986\n",
          "  $$\n",
          "- **Classic Application**: Visualizing Fourier spectra, where the 0-frequency DC component can be $10^5$ to $10^6$ times larger than high-frequency components."
        ]
      },
      {
        cell_type: "code",
        execution_count: 2,
        metadata: {},
        outputs: [],
        source: [
          "def log_transform(img, c=None):\n",
          "    \"\"\"\n",
          "    Applies logarithmic intensity transformation s = c * ln(1 + r).\n",
          "    \"\"\"\n",
          "    img_float = img.astype(np.float64)\n",
          "    max_r = np.max(img_float)\n",
          "    \n",
          "    # Auto-calculate scaling constant c to map output into [0, 255]\n",
          "    if c is None:\n",
          "        c = 255.0 / np.log(1.0 + max_r) if max_r > 0 else 1.0\n",
          "        \n",
          "    s = c * np.log(1.0 + img_float)\n",
          "    s = np.clip(s, 0, 255).astype(np.uint8)\n",
          "    return s, c\n",
          "\n",
          "# Generate a synthetic 2D Fourier Spectrum (classic Gonzalez example)\n",
          "size = 256\n",
          "y, x = np.ogrid[-size//2:size//2, -size//2:size//2]\n",
          "radius = np.sqrt(x**2 + y**2)\n",
          "radius[radius == 0] = 0.5\n",
          "\n",
          "# Huge dynamic range signal: massive DC peak + faint ripples\n",
          "fourier_spectrum = 255.0 / (1.0 + (radius**1.2) * 0.15)\n",
          "cross_pattern = (np.abs(x) < 2).astype(float) * 150 + (np.abs(y) < 2).astype(float) * 150\n",
          "fourier_spectrum += cross_pattern / (1.0 + radius * 0.05)\n",
          "fourier_spectrum = np.clip(fourier_spectrum, 0, 255).astype(np.uint8)\n",
          "\n",
          "# Apply log transform\n",
          "log_spectrum, c_val = log_transform(fourier_spectrum)\n",
          "\n",
          "# Visualization\n",
          "fig, axes = plt.subplots(1, 3, figsize=(16, 5))\n",
          "\n",
          "axes[0].imshow(fourier_spectrum, cmap='gray')\n",
          "axes[0].set_title('Original Spectrum (Extreme Dynamic Range)')\n",
          "axes[0].axis('off')\n",
          "\n",
          "axes[1].imshow(log_spectrum, cmap='gray')\n",
          "axes[1].set_title(f'Log Transform Result (c = {c_val:.2f})')\n",
          "axes[1].axis('off')\n",
          "\n",
          "# Plot transfer function\n",
          "r_vals = np.linspace(0, 255, 256)\n",
          "s_vals = c_val * np.log(1 + r_vals)\n",
          "axes[2].plot(r_vals, s_vals, 'b-', lw=2.5, label=f's = {c_val:.2f} * ln(1 + r)')\n",
          "axes[2].plot([0, 255], [0, 255], 'k--', alpha=0.5, label='Identity (s = r)')\n",
          "axes[2].set_title('Logarithmic Transfer Curve')\n",
          "axes[2].set_xlabel('Input Intensity r')\n",
          "axes[2].set_ylabel('Output Intensity s')\n",
          "axes[2].grid(True, alpha=0.3)\n",
          "axes[2].legend()\n",
          "\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## Part 2: Power-Law (Gamma) Transformations\n",
          "\n",
          "### 2.1 Theory (Gonzalez & Woods, Section 3.2.3)\n",
          "Power-law transformations have the basic form:\n",
          "$$\ns = c \\cdot r^\\gamma\n",
          "$$\n",
          "or with offset for low-intensity adjustment: $s = c(r + \\epsilon)^\\gamma$.\n",
          "\n",
          "When working with 8-bit digital images normalized to the range $[0, 1]$:\n",
          "$$\ns = 255 \\cdot c \\cdot \\left(\\frac{r}{255}\\right)^\\gamma\n",
          "$$\n",
          "\n",
          "#### Behavior Across Gamma Values:\n",
          "- **$\\gamma < 1$ (Fractional Gamma)**:\n",
          "  - Transfer curve lies **above** the $45^\\circ$ identity line.\n",
          "  - Maps narrow range of dark input values into a broader range of output values.\n",
          "  - **Use Case**: Brightening underexposed images, revealing dark anatomical details in MRI spine scans, astronomical photography.\n",
          "- **$\\gamma > 1$ (High Gamma)**:\n",
          "  - Transfer curve lies **below** the $45^\\circ$ identity line.\n",
          "  - Compresses dark input values and expands bright input values.\n",
          "  - **Use Case**: Restoring washed-out/overexposed images, increasing visual contrast in aerial photography.\n",
          "- **$\\gamma = 1$**: Identity mapping (linear response)."
        ]
      },
      {
        cell_type: "code",
        execution_count: 3,
        metadata: {},
        outputs: [],
        source: [
          "def gamma_transform(img, gamma, c=1.0):\n",
          "    \"\"\"\n",
          "    Applies power-law (gamma) transformation s = c * r^gamma using a Lookup Table (LUT).\n",
          "    \"\"\"\n",
          "    # Build a fast 256-element lookup table\n",
          "    lut = np.empty((1, 256), np.uint8)\n",
          "    for i in range(256):\n",
          "        val = c * ((i / 255.0) ** gamma) * 255.0\n",
          "        lut[0, i] = np.clip(val, 0, 255).astype(np.uint8)\n",
          "    return cv2.LUT(img, lut)\n",
          "\n",
          "# Generate a synthetic underexposed fractured spine scan (Gonzalez Fig. 3.8)\n",
          "y, x = np.ogrid[:256, :256]\n",
          "spine = np.full((256, 256), 20, dtype=np.float32)\n",
          "# Spine column vertebrae with low ambient illumination\n",
          "col_dist = np.abs((x - 128) / 256.0 * 4.0)\n",
          "segment = np.cos((y - 128) / 256.0 * 30.0)\n",
          "mask = col_dist < 0.6\n",
          "spine[mask] += (1.0 - col_dist[mask] / 0.6) * 45.0\n",
          "spine[mask & (segment > 0)] += segment[mask & (segment > 0)] * 40.0\n",
          "dark_spine_img = np.clip(spine, 0, 255).astype(np.uint8)\n",
          "\n",
          "# Gamma experiment with multiple gamma values\n",
          "gammas = [0.3, 0.6, 1.0, 1.8, 3.0]\n",
          "transformed_imgs = [gamma_transform(dark_spine_img, g) for g in gammas]\n",
          "\n",
          "# Plot comparative grid\n",
          "fig, axes = plt.subplots(2, 3, figsize=(16, 9))\n",
          "axes = axes.ravel()\n",
          "\n",
          "axes[0].imshow(dark_spine_img, cmap='bone')\n",
          "axes[0].set_title('Original Input Image (Underexposed)')\n",
          "axes[0].axis('off')\n",
          "\n",
          "for idx, g in enumerate([0.3, 0.6, 1.8, 3.0]):\n",
          "    res = gamma_transform(dark_spine_img, g)\n",
          "    axes[idx + 1].imshow(res, cmap='bone')\n",
          "    role = 'Expanding Dark Details' if g < 1 else 'Compressing / High Contrast'\n",
          "    axes[idx + 1].set_title(f'Gamma $\\gamma = {g}$ ({role})')\n",
          "    axes[idx + 1].axis('off')\n",
          "\n",
          "# Plot the family of power-law curves\n",
          "r = np.linspace(0, 1, 256)\n",
          "for g in [0.2, 0.4, 0.6, 1.0, 1.5, 2.5, 4.0]:\n",
          "    s = r ** g\n",
          "    axes[5].plot(r, s, label=f'$\\gamma = {g}$')\n",
          "axes[5].set_title('Family of Power-Law Transformations')\n",
          "axes[5].set_xlabel('Normalized Input r')\n",
          "axes[5].set_ylabel('Normalized Output s')\n",
          "axes[5].grid(True, alpha=0.3)\n",
          "axes[5].legend(loc='lower right', fontsize=9)\n",
          "\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## Part 3: Spatial Filtering — Median Filtering\n",
          "\n",
          "### 3.1 Theory (Gonzalez & Woods, Section 3.5.3)\n",
          "Spatial filtering operates directly on pixels using a neighborhood subimage (spatial mask or kernel) $S_{xy}$.\n",
          "\n",
          "While linear spatial filters (such as the average / box filter) compute a weighted sum:\n",
          "$$\ng(x, y) = \\sum_{s=-a}^a \\sum_{t=-b}^b w(s, t) f(x + s, y + t)\n",
          "$$\n",
          "\n",
          "The **Median Filter** is the premier **order-statistic (non-linear)** filter:\n",
          "$$\n",
          "\\hat{f}(x, y) = \\text{median}_{(s, t) \\in S_{xy}} \\{ g(s, t) \\}\n",
          "$$\n",
          "\n",
          "#### Why Median Filter is Superior for Impulse Noise:\n",
          "1. **Impulse (Salt-and-Pepper) Noise**: Pixels corrupted to maximum (255) or minimum (0) values appear as statistical outliers.\n",
          "2. **Linear Smoothing Failure**: A linear average filter includes the outlier in its average, spreading the noise into a noticeable blurred gray blotch and blurring sharp edges.\n",
          "3. **Median Filter Triumph**: Because 0 or 255 are extreme values, sorting the neighborhood pushes them to the top or bottom of the array. The median value selected is almost always an uncorrupted neighbor, **completely eliminating the impulse noise without smearing edges!**"
        ]
      },
      {
        cell_type: "code",
        execution_count: 4,
        metadata: {},
        outputs: [],
        source: [
          "def add_salt_and_pepper_noise(image, salt_prob=0.04, pepper_prob=0.04, seed=42):\n",
          "    \"\"\"\n",
          "    Simulates impulse salt-and-pepper noise.\n",
          "    \"\"\"\n",
          "    np.random.seed(seed)\n",
          "    noisy = image.copy()\n",
          "    # Salt noise (255)\n",
          "    num_salt = np.ceil(salt_prob * image.size)\n",
          "    coords = [np.random.randint(0, i - 1, int(num_salt)) for i in image.shape]\n",
          "    noisy[tuple(coords)] = 255\n",
          "\n",
          "    # Pepper noise (0)\n",
          "    num_pepper = np.ceil(pepper_prob * image.size)\n",
          "    coords = [np.random.randint(0, i - 1, int(num_pepper)) for i in image.shape]\n",
          "    noisy[tuple(coords)] = 0\n",
          "    return noisy\n",
          "\n",
          "def custom_median_filter_2d(image, kernel_size=3):\n",
          "    \"\"\"\n",
          "    Educational implementation of 2D Median Filter from scratch (replicate padding).\n",
          "    \"\"\"\n",
          "    h, w = image.shape\n",
          "    pad = kernel_size // 2\n",
          "    padded = np.pad(image, pad, mode='edge')\n",
          "    output = np.zeros_like(image)\n",
          "    \n",
          "    for i in range(h):\n",
          "        for j in range(w):\n",
          "            neighborhood = padded[i:i + kernel_size, j:j + kernel_size]\n",
          "            output[i, j] = np.median(neighborhood)\n",
          "            \n",
          "    return output.astype(np.uint8)\n",
          "\n",
          "# Generate circuit board test image with sharp tracks and pads (Gonzalez Fig 3.35)\n",
          "board = np.full((256, 256), 40, dtype=np.uint8)\n",
          "# Horizontal & vertical metallic bus tracks\n",
          "for line in range(16, 256, 32):\n",
          "    board[line-2:line+2, :] = 200\n",
          "    board[:, line-2:line+2] = 200\n",
          "# Solder pads\n",
          "y_idx, x_idx = np.ogrid[:256, :256]\n",
          "for py in range(32, 256, 64):\n",
          "    for px in range(32, 256, 64):\n",
          "        dist = np.sqrt((x_idx - px)**2 + (y_idx - py)**2)\n",
          "        board[dist < 12] = 235\n",
          "        board[dist < 5] = 25\n",
          "\n",
          "# Add Salt-and-Pepper Noise\n",
          "corrupted_board = add_salt_and_pepper_noise(board, salt_prob=0.05, pepper_prob=0.05)\n",
          "\n",
          "# Apply 3x3 Mean / Average Filter (Linear)\n",
          "mean_filtered = cv2.blur(corrupted_board, (3, 3))\n",
          "\n",
          "# Apply 3x3 Median Filter (Nonlinear Order-Statistic)\n",
          "median_filtered_3x3 = cv2.medianBlur(corrupted_board, 3)\n",
          "\n",
          "# Apply 5x5 Median Filter\n",
          "median_filtered_5x5 = cv2.medianBlur(corrupted_board, 5)\n",
          "\n",
          "# Comparative Visualization\n",
          "fig, axes = plt.subplots(2, 3, figsize=(16, 10))\n",
          "\n",
          "axes[0, 0].imshow(board, cmap='gray')\n",
          "axes[0, 0].set_title('1. Pristine Circuit Board Pattern')\n",
          "axes[0, 0].axis('off')\n",
          "\n",
          "axes[0, 1].imshow(corrupted_board, cmap='gray')\n",
          "axes[0, 1].set_title('2. Corrupted with Salt & Pepper Noise (10%)')\n",
          "axes[0, 1].axis('off')\n",
          "\n",
          "axes[0, 2].imshow(mean_filtered, cmap='gray')\n",
          "axes[0, 2].set_title('3. Linear Mean Filter (3x3) — Blurs Noise into Gray Halos')\n",
          "axes[0, 2].axis('off')\n",
          "\n",
          "axes[1, 0].imshow(median_filtered_3x3, cmap='gray')\n",
          "axes[1, 0].set_title('4. Median Filter (3x3) — Pristine Clean & Sharp Edges!')\n",
          "axes[1, 0].axis('off')\n",
          "\n",
          "axes[1, 1].imshow(median_filtered_5x5, cmap='gray')\n",
          "axes[1, 1].set_title('5. Median Filter (5x5) — Heavy Filtering')\n",
          "axes[1, 1].axis('off')\n",
          "\n",
          "# Edge profile comparison (1D cross section through a corrupted track)\n",
          "row = 16\n",
          "axes[1, 2].plot(corrupted_board[row, 10:80], 'r.', alpha=0.6, label='Noisy Pixels')\n",
          "axes[1, 2].plot(mean_filtered[row, 10:80], 'm--', lw=1.5, label='Mean Filter (Blurred)')\n",
          "axes[1, 2].plot(median_filtered_3x3[row, 10:80], 'g-', lw=2.5, label='Median Filter (Preserved Edge)')\n",
          "axes[1, 2].set_title('Cross-Sectional Intensity Profile')\n",
          "axes[1, 2].set_xlabel('Pixel Column')\n",
          "axes[1, 2].set_ylabel('Intensity Value')\n",
          "axes[1, 2].legend(loc='lower right', fontsize=9)\n",
          "axes[1, 2].grid(True, alpha=0.3)\n",
          "\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## Part 4: Quantitative Evaluation & Metric Comparison\n",
          "\n",
          "Let us evaluate the restoration quality quantitatively using:\n",
          "1. **Mean Squared Error (MSE)**:\n",
          "   $$\n",
          "   \\text{MSE} = \\frac{1}{M N} \\sum_{x=0}^{M-1} \\sum_{y=0}^{N-1} [I(x, y) - \\hat{I}(x, y)]^2\n",
          "   $$\n",
          "2. **Peak Signal-to-Noise Ratio (PSNR)** in decibels (dB):\n",
          "   $$\n",
          "   \\text{PSNR} = 10 \\cdot \\log_{10} \\left( \\frac{255^2}{\\text{MSE}} \\right)\n",
          "   $$\n",
          "Higher PSNR indicates superior reconstruction fidelity."
        ]
      },
      {
        cell_type: "code",
        execution_count: 5,
        metadata: {},
        outputs: [],
        source: [
          "def compute_metrics(original, processed):\n",
          "    mse = np.mean((original.astype(np.float64) - processed.astype(np.float64)) ** 2)\n",
          "    if mse == 0:\n",
          "        return 0.0, float('inf')\n",
          "    psnr = 10.0 * np.log10((255.0 ** 2) / mse)\n",
          "    return mse, psnr\n",
          "\n",
          "filters = {\n",
          "    'Corrupted (Noisy)': corrupted_board,\n",
          "    'Mean Filter (3x3)': mean_filtered,\n",
          "    'Median Filter (3x3)': median_filtered_3x3,\n",
          "    'Median Filter (5x5)': median_filtered_5x5,\n",
          "    'Gaussian Filter (sigma=1.0)': cv2.GaussianBlur(corrupted_board, (3, 3), 1.0)\n",
          "}\n",
          "\n",
          "print(f\"{'Filter Technique':<30} | {'MSE':<12} | {'PSNR (dB)':<12}\")\n",
          "print(\"-\" * 60)\n",
          "for name, filtered_img in filters.items():\n",
          "    mse, psnr = compute_metrics(board, filtered_img)\n",
          "    print(f\"{name:<30} | {mse:<12.2f} | {psnr:<12.2f}\")"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## Part 5: Gonzalez & Woods Chapter 3 Reference Summary\n",
          "\n",
          "| Transformation / Filter | Formula | Primary Purpose | Chapter Section |\n",
          "| :--- | :--- | :--- | :--- |\n",
          "| **Log Transform** | $s = c \\log(1 + r)$ | Dynamic range compression (e.g. Fourier Spectra) | Section 3.2.2 |\n",
          "| **Power-Law (Gamma < 1)** | $s = c \\cdot r^\\gamma$ ($\\gamma < 1$) | Brightening underexposed regions, medical scans | Section 3.2.3 |\n",
          "| **Power-Law (Gamma > 1)** | $s = c \\cdot r^\\gamma$ ($\\gamma > 1$) | Contrast enhancement, washed-out images | Section 3.2.3 |\n",
          "| **Median Spatial Filter** | $\\hat{f}(x,y) = \\text{median}\\{g(s,t)\\}$ | Eliminating impulse (salt-and-pepper) noise | Section 3.5.3 |\n",
          "| **Mean / Box Filter** | $\\frac{1}{mn}\\sum g(s,t)$ | Linear smoothing, background suppression | Section 3.5.1 |\n",
          "\n",
          "### Recommended Exercises from Gonzalez & Woods:\n",
          "1. **Varying Noise Density**: Increase salt-and-pepper noise to $30\\%$ and observe how a $3\\times3$ median filter degrades, while repeated median passes or a $7\\times7$ window perform.\n",
          "2. **Adaptive Median Filter**: Explore Section 3.5.4 where window size increases dynamically if the impulse noise density overwhelms a local $3\\times3$ kernel.\n",
          "3. **Inverse Log Transformation**: Implement $s = c \\cdot (e^r - 1)$ and observe its opposite behavior (stretching high-intensity values)."
        ]
      }
    ],
    metadata: {
      authors: [
        {
          name: "Rafael C. Gonzalez & Richard E. Woods Reference Implementation"
        }
      ],
      language_info: {
        codemirror_mode: {
          name: "ipython",
          version: 3
        },
        file_extension: ".py",
        mimetype: "text/x-python",
        name: "python",
        nbconvert_exporter: "python",
        pygments_lexer: "ipython3",
        version: "3.10.12"
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
}
