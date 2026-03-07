import React, { useState, useEffect } from 'react';
import { 
    Sparkles, 
    Settings, 
    Link, 
    ArrowRight, 
    Volume2, 
    BrainCircuit, 
    CheckCircle2, 
    LayoutGrid, 
    Globe
} from 'lucide-react';

export default function OnboardingWizard({ 
    onComplete, 
    onPairRequest, 
    currentConfig, 
    onUpdateConfig 
}) {
    const [step, setStep] = useState(1);
    const [availableVoices, setAvailableVoices] = useState([]);

    // Temporary local state for the wizard before committing to the main app config
    const [wizardState, setWizardState] = useState({
        voiceURI: currentConfig.settings.voiceURI || null,
        gridSize: currentConfig.settings.gridSize || "auto",
        aiContext: currentConfig.settings.aiContext || ""
    });

    useEffect(() => {
        const loadVoices = () => {
            setAvailableVoices(window.speechSynthesis.getVoices());
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const testVoice = () => {
        const utterance = new SpeechSynthesisUtterance("Hello, I am ready to speak");
        if (wizardState.voiceURI) {
            const selectedVoice = availableVoices.find(v => v.voiceURI === wizardState.voiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    const handleFinish = () => {
        // Commit changes up to the parent App.jsx
        onUpdateConfig({
            voiceURI: wizardState.voiceURI,
            gridSize: wizardState.gridSize,
            aiContext: wizardState.aiContext,
            onboardingComplete: true
        });
        onComplete();
    };


    return (
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Sequence */}
                <div className="bg-blue-600 p-6 sm:p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    
                    <h1 className="text-3xl font-extrabold mb-2 relative z-10">Welcome to Zip</h1>
                    <p className="text-blue-100 font-medium relative z-10">Let's set up your communication exactly how you need it.</p>
                </div>

                {/* Steps Container */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
                    
                    {/* STEP 1: WELCOME & CONNECT */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right direction-normal fade-in duration-300 relative z-10">
                            <div className="text-center space-y-4 mb-8">
                                <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full text-blue-600 mb-2">
                                    <Sparkles size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">How do you want to set up?</h2>
                                <p className="text-slate-500">You can inherit a profile managed by a teacher/parent, or set up entirely offline.</p>
                            </div>

                            <button onClick={onPairRequest} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors group">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Link size={24} />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg">Pair with Dashboard</h3>
                                    <p className="text-sm text-slate-500">I have a sync code from my Teacher or SLP</p>
                                </div>
                                <ArrowRight className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button onClick={() => setStep(2)} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Settings size={24} />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg">Setup Locally</h3>
                                    <p className="text-sm text-slate-500">I want to customize everything on this device</p>
                                </div>
                                <ArrowRight className="text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    )}


                    {/* STEP 2: VOICE & GRID */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right direction-normal fade-in duration-300 relative z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Volume2 className="text-blue-500" /> Voice & Layout
                                </h2>
                                <p className="text-slate-500">Choose how the app sounds and looks.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Text-to-Speech Voice</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={wizardState.voiceURI || ""} 
                                            onChange={e => setWizardState(p => ({...p, voiceURI: e.target.value}))} 
                                            className="flex-1 p-3 border-2 border-slate-200 rounded-xl text-slate-800 bg-white"
                                        >
                                            <option value="">System Default Voice</option>
                                            {availableVoices.map(v => (
                                                <option key={v.voiceURI} value={v.voiceURI}>
                                                    {v.name} ({v.lang})
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={testVoice} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl whitespace-nowrap">
                                            Test Play
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Grid Display Density</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['auto', 3, 4, 5, 8].map(size => (
                                            <button 
                                                key={size}
                                                onClick={() => setWizardState(p => ({...p, gridSize: size}))}
                                                className={`p-3 rounded-xl border-2 flex items-center justify-between font-bold ${wizardState.gridSize == size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{size === 'auto' ? 'Auto-Fit' : `${size} Columns`}</span>
                                                {size !== 'auto' && <LayoutGrid size={16} className="opacity-50" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Back</button>
                                <button onClick={() => setStep(3)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 group">
                                    Next Step <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}


                    {/* STEP 3: AI PERSONALIZATION */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right direction-normal fade-in duration-300 relative z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <BrainCircuit className="text-purple-500" /> Train the Predictor
                                </h2>
                                <p className="text-slate-500">Zip predicts what you want to say offline. Tell the AI what you like to talk about to make it smarter.</p>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <label className="block text-sm font-bold text-purple-900 mb-2">Interests, Hobbies, & Common Needs</label>
                                <textarea 
                                    value={wizardState.aiContext}
                                    onChange={e => setWizardState(p => ({...p, aiContext: e.target.value}))}
                                    placeholder="e.g. I love dinosaurs, Minecraft, and playing outside. I frequently ask for sensory toys, water, and breaks..."
                                    className="w-full p-4 border-2 border-purple-200 rounded-xl bg-white text-slate-800 min-h-[120px] resize-y placeholder:text-slate-400"
                                />
                                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                                    <Globe size={12} /> This data never leaves your device.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Back</button>
                                <button onClick={handleFinish} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 group">
                                    <CheckCircle2 size={20} /> Finish Setup
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
