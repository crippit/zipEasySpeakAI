import { pipeline, env } from '@xenova/transformers';

// Configure to use CDN models (no local file setup needed for PWA)
env.allowLocalModels = false;
env.useBrowserCache = true;

class AIService {
    constructor() {
        this.model = null;
        this.isLoading = false;
    }

    async init() {
        if (this.model) return;
        this.isLoading = true;
        try {
            // LaMini-Flan-T5 is optimized for instruction following and is relatively lightweight
            this.model = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-248M');
            console.log("ZipAI: Model Loaded");
        } catch (e) {
            console.error("ZipAI: Failed to load model", e);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Expands keywords into a full sentence, biased by context.
     * @param {string[]} words - The keywords (e.g., ["I", "Want"])
     * @param {string} context - The time context (e.g., "morning", "evening")
     */
    async expandSentence(words, context = "") {
        if (!this.model || words.length === 0) return [];

        const text = words.join(" ");

        // Context-Aware Prompt Engineering
        let prompt = `Expand keywords to sentence: ${text}`;
        if (context) {
            prompt = `Context: ${context}. ${prompt}`;
        }

        try {
            const output = await this.model(prompt, {
                max_new_tokens: 25,
                num_return_sequences: 3,
                temperature: 0.6,
                do_sample: true
            });

            // Deduplicate and clean results
            const suggestions = [...new Set(output.map(o => o.generated_text))];
            return suggestions;
        } catch (e) {
            console.error("ZipAI: Generation failed", e);
            return [];
        }
    }
}

export const aiService = new AIService();

// Simple Bigram Map for Next-Word Highlighting (Immediate feedback)
export const NEXT_WORD_PREDICTIONS = {
    "i": ["want", "need", "like", "am", "feel", "see"],
    "want": ["to", "more", "pizza", "apple", "cookie", "water"],
    "like": ["to", "pizza", "it", "that"],
    "go": ["to", "home", "outside", "school"],
    "stop": ["it", "that", "now"],
    "more": ["please", "food", "water"],
    "yes": ["please"],
    "no": ["thank you", "stop"],
    "play": ["with", "game", "outside"]
};