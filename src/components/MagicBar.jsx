import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '../services/ai';

export default function MagicBar({ sentence, onSelect }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modelReady, setModelReady] = useState(false);

    // Initialize Model once on mount
    useEffect(() => {
        aiService.init().then(() => setModelReady(true));
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
            const results = await aiService.expandSentence(words);
            setSuggestions(results);
            setLoading(false);
        }, 600); // 600ms debounce to wait for user to stop typing

        return () => clearTimeout(timer);
    }, [sentence]);

    if (sentence.length === 0 && !loading) return null;

    return (
        <div className="mx-6 mb-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden shadow-sm">

                {/* Label */}
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider shrink-0 border-r border-indigo-200 pr-3">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    <span>Magic Bar</span>
                </div>

                {/* Suggestions Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center flex-1">
                    {/* Loading Placeholder */}
                    {loading && suggestions.length === 0 && (
                        <span className="text-indigo-300 text-sm italic">Thinking...</span>
                    )}

                    {/* Intro Text */}
                    {!loading && suggestions.length === 0 && sentence.length > 0 && (
                        <span className="text-indigo-300 text-sm italic">...</span>
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
            </div>
        </div>
    );
}