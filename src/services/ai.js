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
            // LaMini-Flan-T5 is optimized for instruction following
            this.model = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-248M');
            console.log("ZipAI: Model Loaded");
        } catch (e) {
            console.error("ZipAI: Failed to load model", e);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Expands keywords into a full sentence.
     */
    async expandSentence(words, context = "") {
        if (!this.model || words.length === 0) return [];

        const text = words.join(" ");

        // Reliability Check: Determine if the user intends a question
        const questionStarters = ["who", "what", "where", "when", "why", "how", "can", "do", "does", "is", "are", "may", "could", "would"];
        const isQuestion = questionStarters.includes(words[0].toLowerCase());

        // IMPROVED PROMPTS: "Expand" is more directive for AAC than "Fix grammar"
        let prompt;
        if (isQuestion) {
            prompt = `Expand to a complete question: ${text}`;
        } else {
            prompt = `Expand to a complete sentence: ${text}`;
        }

        if (context) {
            prompt = `Context: ${context}. ${prompt}`;
        }

        try {
            const output = await this.model(prompt, {
                max_new_tokens: 40,
                num_return_sequences: 5,
                temperature: 0.85, // Balanced for variety
                top_k: 40,
                do_sample: true
            });

            // Deduplicate
            const uniqueSuggestions = [...new Set(output.map(o => o.generated_text))];

            // FILTERING: Remove unhelpful meta-responses from the AI
            const validSuggestions = uniqueSuggestions.filter(s => {
                const lower = s.toLowerCase();
                return !lower.includes("context") &&
                    !lower.includes("sorry") &&
                    !lower.includes("provide") &&
                    !lower.includes("language model") &&
                    s.length > 2; // too short is usually junk
            });

            return validSuggestions.slice(0, 3);
        } catch (e) {
            console.error("ZipAI: Generation failed", e);
            return [];
        }
    }
}

export const aiService = new AIService();

export const NEXT_WORD_PREDICTIONS = {
    "i": ["want", "need", "like", "am", "feel", "see", "hear", "can", "will", "don't", "have", "go"],
    "you": ["are", "can", "do", "like", "want", "help", "look", "need", "have", "go"],
    "we": ["are", "can", "go", "want", "play", "need", "have"],
    "it": ["is", "was", "looks", "feels", "sounds", "tastes", "has"],
    "that": ["is", "was", "looks", "sounds"],
    "he": ["is", "wants", "likes", "can", "has"],
    "she": ["is", "wants", "likes", "can", "has"],
    "they": ["are", "want", "like", "can", "have"],
    "me": ["too", "play", "help"],
    "want": ["to", "more", "pizza", "apple", "cookie", "water", "juice", "toy", "ipad", "book", "music", "help", "that", "it"],
    "need": ["help", "break", "toilet", "water", "more", "food", "medicine", "sleep", "to", "it"],
    "like": ["to", "pizza", "it", "that", "playing", "reading", "watching", "music", "dogs", "cats", "you"],
    "go": ["to", "home", "outside", "school", "park", "bathroom", "away", "sleep", "store"],
    "stop": ["it", "that", "now", "please", "talking", "doing"],
    "play": ["with", "game", "outside", "music", "ball", "dolls", "ipad", "tag"],
    "eat": ["pizza", "apple", "banana", "sandwich", "cookie", "breakfast", "lunch", "dinner", "snack"],
    "drink": ["water", "juice", "milk", "soda", "tea"],
    "see": ["it", "that", "you", "mom", "dad", "dog", "cat", "bird"],
    "hear": ["it", "music", "noise", "you"],
    "feel": ["happy", "sad", "tired", "sick", "good", "bad", "hungry", "thirsty", "angry", "scared"],
    "make": ["it", "a", "art", "food", "music"],
    "help": ["me", "please", "you"],
    "look": ["at", "it", "there", "here"],
    "turn": ["on", "off", "page", "it"],
    "open": ["it", "door", "box", "bag"],
    "close": ["it", "door"],
    "read": ["book", "it"],
    "watch": ["tv", "movie", "video", "ipad"],
    "have": ["a", "the", "it", "more"],
    "to": ["go", "eat", "play", "sleep", "watch", "read", "drink", "the"],
    "in": ["the", "my", "your", "box", "room", "car"],
    "on": ["the", "my", "your", "table", "floor", "chair"],
    "with": ["you", "me", "mom", "dad", "friend", "toy"],
    "for": ["me", "you", "mom", "dad"],
    "at": ["home", "school", "park", "store"],
    "the": ["park", "store", "school", "bathroom", "kitchen", "car", "bus", "ipad", "tv", "door", "window"],
    "my": ["turn", "mom", "dad", "toy", "book", "ipad", "food", "drink"],
    "your": ["turn", "mom", "dad", "toy", "book"],
    "a": ["little", "big", "lot", "good", "bad"],
    "more": ["please", "food", "water", "time", "music", "tickles"],
    "yes": ["please", "i do", "it is", "can i"],
    "no": ["thank you", "stop", "i don't", "it isn't", "way"],
    "please": ["help", "give", "open", "turn"],
    "thank": ["you"],
    "hello": ["how", "friend", "mom", "dad", "teacher"],
    "goodbye": ["mom", "dad", "friend", "teacher"],
    "how": ["are", "is", "do"],
    "what": ["is", "do", "are"],
    "where": ["is", "are", "go"],
    "who": ["is", "are"]
};