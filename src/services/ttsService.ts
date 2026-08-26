import { LanguageCode } from '../types';

class TTSService {
  private voices: SpeechSynthesisVoice[] = [];
  private isVoicesLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.isVoicesLoaded = true;
      }
    }
  }

  public speak(text: string, language: LanguageCode, rate: number = 1.0, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this environment.');
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // 0.75, 1.0, 1.25
    utterance.pitch = 1.0;

    let targetLangCode = 'en-US';
    if (language === 'ko') targetLangCode = 'ko-KR';
    if (language === 'zh') targetLangCode = 'zh-CN';

    utterance.lang = targetLangCode;

    // Find best voice match
    const voice = this.voices.find(
      (v) => v.lang === targetLangCode || v.lang.startsWith(targetLangCode.split('-')[0])
    );
    if (voice) {
      utterance.voice = voice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  }

  public activeRecognition: any = null;

  public startListening(
    language: LanguageCode,
    onResult: (transcript: string) => void,
    onError?: (err: string) => void
  ) {
    this.stopListening();
    this.activeRecognition = this.startSpeechRecognition(
      language,
      onResult,
      (err) => {
        if (onError) onError(err);
      },
      () => {
        this.activeRecognition = null;
      }
    );
  }

  public stopListening() {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch (e) {}
      this.activeRecognition = null;
    }
  }

  /**
   * Compare pronunciation accuracy using Web Speech Recognition (if supported in browser)
   */
  public startSpeechRecognition(
    language: LanguageCode,
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Trình duyệt chưa hỗ trợ nhận diện giọng nói trực tiếp.');
      onEnd();
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      let langCode = 'en-US';
      if (language === 'ko') langCode = 'ko-KR';
      if (language === 'zh') langCode = 'zh-CN';

      recognition.lang = langCode;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        onError(event.error || 'Lỗi nhận diện âm thanh');
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();
      return recognition;
    } catch (e: any) {
      onError(e.message || 'Không thể mở microphone');
      onEnd();
      return null;
    }
  }
}

export const ttsService = new TTSService();
