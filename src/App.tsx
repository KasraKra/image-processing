/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InteractiveLab } from './components/InteractiveLab';
import { NotebookViewer } from './components/NotebookViewer';
import { TheoryGuide } from './components/TheoryGuide';
import { buildGonzalezJupyterNotebook } from './utils/imageTransforms';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lab' | 'notebook' | 'theory'>('lab');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Check URL query parameters (e.g. ?tab=notebook or ?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'notebook' || tabParam === 'theory' || tabParam === 'lab') {
      setActiveTab(tabParam);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Download the official .ipynb file
  const handleDownloadNotebook = () => {
    const notebookData = buildGonzalezJupyterNotebook();
    const jsonStr = JSON.stringify(notebookData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb');
  };

  // Copy full Python script
  const handleCopyPythonCode = () => {
    const notebook = buildGonzalezJupyterNotebook();
    const codeCells = notebook.cells
      .filter((c) => c.cell_type === 'code')
      .map((c) => c.source.join(''))
      .join('\n\n# ' + '='.repeat(70) + '\n\n');

    const fullScript = `# Digital Image Processing - Rafael C. Gonzalez & Richard E. Woods
# Chapter 3: Intensity Transformations and Spatial Filtering
# Log Transform, Power-Law (Gamma), and Median Filtering
\n${codeCells}`;

    navigator.clipboard.writeText(fullScript).then(() => {
      setCopiedCode(true);
      showToast('Copied Python code to clipboard!');
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadNotebook={handleDownloadNotebook}
        onCopyPythonCode={handleCopyPythonCode}
        copiedCode={copiedCode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'lab' && (
          <InteractiveLab onDownloadNotebook={handleDownloadNotebook} />
        )}
        {activeTab === 'notebook' && (
          <NotebookViewer onDownloadNotebook={handleDownloadNotebook} />
        )}
        {activeTab === 'theory' && <TheoryGuide />}
      </main>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl shadow-emerald-950 flex items-center gap-2 border border-emerald-400/30 animate-fade-in">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Based on <em>Digital Image Processing</em> (3rd & 4th Ed.) by Rafael C. Gonzalez & Richard E. Woods.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('theory')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Formulas & Derivations
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('notebook')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Jupyter Notebook (.ipynb)
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadNotebook}
              className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              Download .ipynb
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
