import React from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

export default function WhatsNewModal({ version, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Sequence */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4 text-white">
                        <Sparkles size={28} />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-1">What's New in Zip EasySpeak</h2>
                    <p className="text-blue-100/80 font-medium text-sm">Version {version} Release Notes</p>
                </div>

                {/* Features List */}
                <div className="p-8 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500" size={18} /> Support for Base64 & Custom SVGs
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6 space-y-2">
                            The application now natively supports rendering raw `&lt;svg&gt;` inline elements and `base64` embedded data sources through the Custom AAC JSON pages API. Generate highly customized symbol libraries without external hosting!
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500" size={18} /> Background Auto-Updating
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6">
                            The Progressive Web Application (PWA) framework has been upgraded with a persistent active Service Worker connection. The app will now silently listen for dashboard updates and dynamically load new patches in the background. 
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500" size={18} /> Bug Fixes & UX improvements
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6 space-y-2">
                            <span>Resolved a bug where using a button Tile to navigate to a Custom Hidden Page would incorrectly force the user back to the home screen.</span>
                            <br/>
                            <span>Implemented a touch-screen Drag and Drop Engine polyfill, restoring full Edit Mode re-ordering support on iOS and Android devices!</span>
                        </p>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 mt-auto">
                    <button 
                        onClick={onClose} 
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-sm transition-colors"
                    >
                        Got it!
                    </button>
                </div>

            </div>
        </div>
    );
}
