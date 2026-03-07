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
                            <CheckCircle2 className="text-emerald-500" size={18} /> Deep Dark Protocol
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6 space-y-2">
                            A complete sweeping overhaul to Zip EasySpeak's design elements introducing comprehensive Dark Mode support across all configuration panels, onboarding flows, setup menus, and keyboard tiles. Keep your eyes rested!
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500" size={18} /> Natively Intelligent Setup
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6">
                            A streamlined Onboarding sequence. Train your offline local AI instantly and pull down district configurations rapidly through embedded QR pairing workflows.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500" size={18} /> Security & Reporting Tools
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6">
                            Added dedicated links in the App Settings to directly submit reports of erroneous, off-topic, or inappropriate offline Xenova/Transformers suggestions for review & safety alignment.
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
