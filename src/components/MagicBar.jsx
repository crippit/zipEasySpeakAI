import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { aiService } from '../services/ai';

export default function MagicBar({ sentence, onSelect, context }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modelLoading, setModelLoading] = useState(true);

    // Initialize Model once on mount
    useEffect(() => {
        setModelLoading(true);
        aiService.init().then(() => {
            setModelLoading(false);
        });
    }, []);

    // Generate suggestions when sentence changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (sentence.length === 0) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            // Extract just the labels or phrases for the AI
            const words = sentence.map(t => t.phrase);
            const results = await aiService.expandSentence(words, context);
            setSuggestions(results);
            setLoading(false);
        }, 600); // 600ms debounce to wait for user to stop typing

        return () => clearTimeout(timer);
    }, [sentence, context]);

    // Don't render if empty and not loading model
    if (sentence.length === 0 && !modelLoading) return null;

    return (
        <div className="mx-4 md:mx-6 mb-4">
            <div className={`
        bg-white border-2 border-indigo-100 rounded-2xl p-2 md:p-3 flex items-center gap-3 relative overflow-hidden shadow-lg transition-all
        ${modelLoading ? 'opacity-80' : 'opacity-100'}
      `}>

                {/* Label / Status Indicator */}
                <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider shrink-0 border-r-2 border-indigo-100 pr-3 py-1">
                    {modelLoading ? (
                        <>
                            <Loader2 className="animate-spin text-indigo-500" size={18} />
                            <span className="hidden sm:inline">Loading Brain...</span>
                        </>
                    ) : loading ? (
                        <>
                            <Loader2 className="animate-spin text-indigo-500" size={18} />
                            <span className="hidden sm:inline">Thinking</span>
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={18} className="text-indigo-500" />
                            <span className="hidden sm:inline">AI Ready</span>
                        </>
                    )}
                </div>

                {/* Suggestions Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center flex-1 min-h-[40px] py-1">

                    {/* Initial State Hint */}
                    {!modelLoading && sentence.length === 0 && (
                        <span className="text-indigo-300 text-sm font-medium italic pl-1">Start typing...</span>
                    )}

                    {/* Results */}
                    {suggestions.map((text, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(text)}
                            className="flex-shrink-0 animate-in fade-in slide-in-from-left-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-800 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all whitespace-nowrap active:scale-95"
                        >
                            {text}
                        </button>
                    ))}
                </div>

                {/* Context Badge (Debugging/Visual) */}
                {context && !modelLoading && (
                    <div className="absolute top-0 right-0 text-[9px] uppercase font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-b border-l border-indigo-100 shadow-sm">
                        {context}
                    </div>
                )}
            </div>
        </div>
    );
}