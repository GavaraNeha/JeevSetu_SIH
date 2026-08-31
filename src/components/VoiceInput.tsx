import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Language } from '@/types/db';

const LANG_MAP: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function VoiceInput({ onTranscript, className = '', size = 'md' }: VoiceInputProps) {
  const { lang } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) return null;

  function toggleListening(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = LANG_MAP[lang] ?? 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Listening...' : 'Voice Input'}
      className={`rounded-xl transition-all duration-200 flex items-center justify-center ${padding} ${
        isListening
          ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-300 shadow-md'
          : 'bg-ink-100 text-ink-600 hover:bg-brand-50 hover:text-brand-600'
      } ${className}`}
    >
      {isListening ? <MicOff size={iconSize} /> : <Mic size={iconSize} />}
    </button>
  );
}
