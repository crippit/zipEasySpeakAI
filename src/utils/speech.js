/**
 * Shared Web Speech API helpers with safe feature detection.
 */

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export const getAvailableVoices = () => {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
};

export const mapDashboardVoice = (remoteName, availableVoices) => {
  if (typeof remoteName !== 'string' || !availableVoices.length) return null;
  const q = remoteName.toLowerCase();

  const exact = availableVoices.find((v) => v.name.toLowerCase() === q);
  if (exact) return exact.voiceURI;

  const isFemale = q.includes('female') || q.includes('girl') || q.includes('woman');
  const isMale = q.includes('male') || q.includes('boy') || q.includes('man');

  let candidates = availableVoices.filter((v) => v.lang.startsWith('en-'));
  if (candidates.length === 0) candidates = availableVoices;

  if (isFemale) {
    const f = candidates.find(
      (v) =>
        v.name.includes('Samantha') ||
        v.name.includes('Zira') ||
        v.name.includes('Victoria') ||
        v.name.includes('Google US English') ||
        v.name.includes('Karen')
    );
    if (f) return f.voiceURI;
  } else if (isMale) {
    const m = candidates.find(
      (v) =>
        v.name.includes('Daniel') ||
        v.name.includes('David') ||
        v.name.includes('Mark') ||
        v.name.includes('Alex') ||
        v.name.includes('Fred')
    );
    if (m) return m.voiceURI;
  }

  return candidates[0]?.voiceURI || null;
};
