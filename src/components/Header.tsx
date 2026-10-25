import React from 'react';
import { BookOpen, Download, FileCode, Sliders, Sparkles, Copy, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: 'lab' | 'notebook' | 'theory';
  setActiveTab: (tab: 'lab' | 'notebook' | 'theory') => void;
  onDownloadNotebook: () => void;
  onCopyPythonCode: () => void;
  copiedCode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadNotebook,
  onCopyPythonCode,
  copiedCode
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Titles */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            G&W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Gonzalez & Woods Image Processing Lab
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Chapter 3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Intensity Transformations (Log, Power-Law) & Spatial Median Filtering
            </p>
          </div>
        </div>

        {/* View Mode Navigation */}
        <nav className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800" aria-label="Main Navigation">
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'lab'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            aria-label="Interactive Lab Workbench"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'notebook'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            aria-label="Jupyter Notebook Viewer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Jupyter Notebook (.ipynb)</span>
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            aria-label="Gonzalez & Woods Reference Theory"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theory & Formulas</span>
          </button>
        </nav>

        {/* Actions: Download .ipynb & Copy Python */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCopyPythonCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Copy executable Python code"
            aria-label="Copy Python Code"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Python</span>
              </>
            )}
          </button>

          <button
            onClick={onDownloadNotebook}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download Gonzalez_Intensity_Transformations_and_Spatial_Filtering.ipynb"
            aria-label="Download Jupyter Notebook File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ipynb</span>
          </button>
        </div>
      </div>
    </header>
  );
};
