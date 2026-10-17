/**
 * Text-to-speech service using browser SpeechSynthesis API
 * Supports both Vietnamese (vi-VN) and English (en-US)
 */

class SpeechService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(
    text: string,
    lang: 'vi-VN' | 'en-US' = 'vi-VN',
    rate: number = 0.9,
    onEnd?: () => void
  ) {
    if (!this.isSupported) {
      console.warn('SpeechSynthesis is not supported in this browser environment.');
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate; // slightly slower for primary grade 3 students

      // Try finding preferred voices
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        if (lang === 'vi-VN') {
          const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VIE'));
          if (viVoice) utterance.voice = viVoice;
        } else {
          const enVoice = voices.find(
            v => (v.lang.includes('en-US') || v.lang.includes('en')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
          ) || voices.find(v => v.lang.includes('en'));
          if (enVoice) utterance.voice = enVoice;
        }
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech error:', err);
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
