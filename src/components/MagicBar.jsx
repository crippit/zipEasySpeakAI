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
        <div className="mx-6 mb-4">
            <div className={`
        bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden shadow-sm transition-all
        ${modelLoading ? 'opacity-80' : 'opacity-100'}
      `}>

                {/* Label / Status Indicator */}
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider shrink-0 border-r border-indigo-200 pr-3">
                    {modelLoading ? (
                        <>
                            <Loader2 className="animate-spin text-indigo-400" size={16} />
                            <span>Loading Brain...</span>
                        </>
                    ) : loading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Thinking</span>
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={16} />
                            <span>AI Ready</span>
                        </>
                    )}
                </div>

                {/* Suggestions Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center flex-1 min-h-[32px]">

                    {/* Initial State Hint */}
                    {!modelLoading && sentence.length === 0 && (
                        <span className="text-indigo-300 text-xs italic">Start typing to see magic suggestions...</span>
                    )}

                    {/* Results */}
                    {suggestions.map((text, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(text)}
                            className="flex-shrink-0 animate-in fade-in slide-in-from-left-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all whitespace-nowrap"
                        >
                            {text}
                        </button>
                    ))}
                </div>

                {/* Context Badge (Debugging/Visual) */}
                {context && !modelLoading && (
                    <div className="absolute top-1 right-1 text-[8px] uppercase font-bold text-indigo-200 bg-indigo-50 px-1 rounded border border-indigo-100">
                        {context}
                    </div>
                )}
            </div>
        </div>
    );
}