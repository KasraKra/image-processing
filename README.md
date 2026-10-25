# Gonzalez & Woods Image Processing Lab (Chapter 3)

An interactive visual workbench and complete Jupyter Notebook implementation of **Intensity Transformations and Spatial Filtering** based on Chapter 3 of Rafael C. Gonzalez and Richard E. Woods' classic textbook, *Digital Image Processing*.

---

## What's Included

1. **Interactive Web Visualizer**:
   - Real-time hardware-accelerated canvas experimentation.
   - **Logarithmic Transformations** ($s = c \cdot \ln(1 + r)$) with automatic scaling constant $c$ computation and dynamic range compression analysis.
   - **Power-Law (Gamma) Transformations** ($s = c \cdot r^\gamma$) with fractional $\gamma < 1$ (brightening dark regions) and high $\gamma > 1$ (contrast enhancement).
   - **Median Spatial Filtering** ($\hat{f}(x, y) = \text{median}\{g(s, t)\}$) with $3\times3, 5\times5, 7\times7$ kernels and comparison against linear Mean / Box filtering.
   - Textbook benchmark test patterns: Fourier Power Spectrum (Fig 3.5), Spine Scan (Fig 3.8), Washed-out Aerial View (Fig 3.9), and Printed Circuit Board with salt-and-pepper noise (Fig 3.35).
   - Custom image upload support, 256-bin intensity histograms, transfer curve plots, and interactive curtain-wipe split comparison.

2. **Jupyter Notebook (`.ipynb`)**:
   - Located at: `public/Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb` (and `notebooks/`).
   - Self-contained, runnable Python notebook with LaTeX equations, NumPy, OpenCV (`cv2`), and Matplotlib implementations.

---

## 🚀 How to Run the Visual App Locally on Your PC

### Prerequisites
Make sure you have **Node.js** (version 18, 20, or higher) installed on your computer:
- Download Node.js: [https://nodejs.org/](https://nodejs.org/)
- Verify in your terminal/command prompt:
  ```bash
  node -v
  npm -v
  ```

### Step 1: Clone the GitHub Repository
Open your terminal (Terminal on macOS/Linux, or PowerShell / Git Bash on Windows):
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### Step 2: Install Node Dependencies
Run:
```bash
npm install
```

### Step 3: Start the Local Development Server
Run:
```bash
npm run dev
```

### Step 4: Open in Your Browser
You will see output similar to:
```
  VITE v8.3.x  ready in 200 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://<your-ip>:3000/
```
Open **`http://localhost:3000`** in Google Chrome, Edge, Firefox, or Safari!

---

## 📓 How to Run the Jupyter Notebook Locally

The project includes the ready-to-run notebook file:
`public/Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb`

### Option 1: Using VS Code (Easiest)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Python** and **Jupyter** extensions from the VS Code Marketplace.
3. Open `public/Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb`.
4. Install the required Python libraries if prompted, or run in your terminal:
   ```bash
   pip install numpy opencv-python matplotlib scipy
   ```
5. Click **"Run All"** at the top of the notebook.

### Option 2: Using JupyterLab or Classic Jupyter Notebook
1. Open terminal and install Jupyter and the scientific libraries:
   ```bash
   pip install jupyterlab numpy opencv-python matplotlib scipy
   ```
2. Start JupyterLab from the project directory:
   ```bash
   jupyter lab
   ```
3. In the file explorer sidebar, navigate to `public/` and double-click `Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb`.

### Option 3: Using Google Colab (No Local Python Install Needed)
1. Go to [Google Colab](https://colab.research.google.com/).
2. Click **File** → **Upload notebook**.
3. Select `Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb` from your cloned folder.
4. Run all cells in the cloud for free!

---

## 🛠️ Project Structure

```
├── public/
│   └── Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb   # Official notebook
├── notebooks/
│   └── Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb   # Mirror copy
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Top navigation & download trigger
│   │   ├── InteractiveLab.tsx     # Real-time visual workbench & sliders
│   │   ├── NotebookViewer.tsx     # In-browser notebook cell viewer
│   │   ├── TheoryGuide.tsx        # Chapter 3 mathematical theory & derivations
│   │   ├── HistogramChart.tsx     # 256-bin intensity histogram
│   │   ├── TransferCurveChart.tsx # Transfer function curve s = T(r)
│   │   └── SplitViewSlider.tsx    # Interactive before/after curtain wipe
│   ├── utils/
│   │   ├── imageTransforms.ts     # Core pure algorithms & notebook JSON builder
│   │   └── imageTransforms.test.ts # Fast Node unit tests
│   ├── App.tsx                    # Main application wrapper
│   └── main.tsx                   # React entry point
├── package.json
└── vite.config.ts
```

---

## 🧪 Running Unit Tests
To test the core mathematical transformation algorithms:
```bash
npm test # or: npx tsx --test src/utils/imageTransforms.test.ts
```
