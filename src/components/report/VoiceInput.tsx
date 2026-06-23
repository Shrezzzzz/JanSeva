import { useCallback, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

// SpeechRecognition is a browser API not fully typed in lib.dom — use any-cast
type AnySpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSR(): (new () => AnySpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!getSR());
  const recognitionRef = useRef<AnySpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    const r = new SR();
    r.continuous     = false;
    r.interimResults = false;
    r.lang           = 'en-IN';
    r.onresult  = (e) => { onTranscript(e.results[0][0].transcript); setListening(false); };
    r.onerror   = () => setListening(false);
    r.onend     = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      aria-label={listening ? 'Stop recording' : 'Start voice input'}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200',
        listening
          ? 'border-[#DC2626] text-[#DC2626] bg-red-50 animate-pulse'
          : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#1A6B3C] hover:text-[#1A6B3C]',
      )}
    >
      {listening ? <Square size={13} /> : <Mic size={13} />}
      {listening ? 'Stop recording' : 'Voice input'}
    </button>
  );
}
