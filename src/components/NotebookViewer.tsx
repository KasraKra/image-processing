import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  BookOpen,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { buildGonzalezJupyterNotebook } from '../utils/imageTransforms';

interface NotebookViewerProps {
  onDownloadNotebook: () => void;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({ onDownloadNotebook }) => {
  const notebook = buildGonzalezJupyterNotebook();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notebook Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileCode className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Jupyter Notebook (.ipynb v4) Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Python 3.10+ / NumPy / OpenCV / Matplotlib
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gonzalez & Woods: Intensity Transformations & Spatial Filtering
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            A complete, self-contained, reproducible Jupyter Notebook implementing Chapter 3 from <em>Digital Image Processing</em> by Rafael C. Gonzalez & Richard E. Woods. Includes dynamic range log compression, power-law gamma curves, and impulse noise elimination via median filtering.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onDownloadNotebook}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
              aria-label="Download the .ipynb file"
            >
              <Download className="w-4 h-4" />
              <span>Download .ipynb File (21 KB)</span>
            </button>

            <a
              href="https://colab.research.google.com/#create=true"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Open Google Colab</span>
            </a>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>💡 How to run:</span>
            <span>Download this file and upload it to Google Colab, or run with <code>jupyter lab</code> in your terminal.</span>
          </div>
        </div>
      </div>

      {/* Table of Contents Pill Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-400 mr-2 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Notebook Structure:
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          1. Setup & Environment
        </span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {'2. Logarithmic Transform s = c · ln(1+r)'}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {'3. Power-Law s = c · r^γ'}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          4. Median Order-Statistic Filter
        </span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          5. MSE/PSNR Metrics & Exercises
        </span>
      </div>

      {/* Rendered Notebook Cells */}
      <div className="space-y-6">
        {notebook.cells.map((cell, idx) => {
          const rawContent = cell.source.join('');

          if (cell.cell_type === 'markdown') {
            return (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 text-slate-200 space-y-3 leading-relaxed"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2 mb-3">
                  <span className="font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    [Markdown Cell {idx + 1}]
                  </span>
                  <span>Gonzalez & Woods Reference Notes</span>
                </div>

                <div className="prose prose-invert max-w-none text-sm space-y-3">
                  {rawContent.split('\n\n').map((paragraph, pIdx) => {
                    // Check for headers
                    if (paragraph.startsWith('# ')) {
                      return (
                        <h2 key={pIdx} className="text-xl sm:text-2xl font-bold text-white tracking-tight border-b border-slate-800 pb-2">
                          {paragraph.replace('# ', '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h3 key={pIdx} className="text-lg font-bold text-indigo-300 pt-2">
                          {paragraph.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="text-base font-semibold text-slate-100">
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('$$')) {
                      return (
                        <div key={pIdx} className="my-3 p-3 bg-slate-950 rounded-xl border border-indigo-900/30 text-center font-mono text-cyan-300 text-sm overflow-x-auto">
                          {paragraph.replace(/\$\$/g, '').trim()}
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Code Cell
          return (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group"
            >
              {/* Code Cell Header */}
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300 font-medium">In [{cell.execution_count}]:</span>
                  <span className="text-slate-500 text-[11px]">Python (NumPy / OpenCV)</span>
                </div>

                <button
                  onClick={() => handleCopyCode(rawContent, idx)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium cursor-pointer"
                  aria-label={`Copy code from cell ${idx + 1}`}
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Content */}
              <pre className="p-4 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed bg-slate-950/90 selection:bg-indigo-500 selection:text-white">
                <code>{rawContent}</code>
              </pre>

              {/* Simulated Output Badge / Note */}
              <div className="bg-slate-900/40 border-t border-slate-800/60 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Output: Visual plots generated by Matplotlib and printed metric tables.</span>
                <span className="text-indigo-400 font-mono">Executable in Jupyter</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Download CTA */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-indigo-900/40 border border-indigo-800/40 rounded-3xl p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ready to Run this Notebook?</h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
          Download the raw <code className="text-indigo-300">.ipynb</code> file now. You can run it offline in VS Code, JupyterLab, PyCharm, or upload it to Google Colab with one click.
        </p>
        <button
          onClick={onDownloadNotebook}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 transition-all cursor-pointer"
          aria-label="Download the full .ipynb notebook file"
        >
          <Download className="w-4 h-4" />
          <span>Download Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb</span>
        </button>
      </div>
    </div>
  );
};
