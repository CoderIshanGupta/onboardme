// apps/web/src/components/VoicePlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VoicePlayerProps {
  voiceUrl: string;
  transcript?: string;
  initialMode?: string;
  onModeChange?: (mode: string) => void;
}

const VOICE_MODES = [
  { id: "professional", label: "Professional", icon: "👔", description: "Clear and formal" },
  { id: "technical", label: "Technical", icon: "🔧", description: "Detailed and precise" },
  { id: "beginner", label: "Beginner Friendly", icon: "🌱", description: "Simple explanations" },
  { id: "casual", label: "Casual", icon: "😊", description: "Relaxed tone" },
  { id: "brutal", label: "Direct", icon: "⚡", description: "Straight to the point" },
];

export default function VoicePlayer({
  voiceUrl,
  transcript,
  initialMode = "professional",
  onModeChange,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wordsRef = useRef<string[]>([]);
  const wordMapRef = useRef<{ start: number; end: number }[]>([]);

  // Determine if using browser TTS
  const useBrowserTTS = !voiceUrl || voiceUrl.startsWith("__TTS__");

  // Parse transcript into words
  const words = transcript ? transcript.split(/(\s+)/).filter((w) => w.trim().length > 0) : [];

  // Build character position map for each word
  useEffect(() => {
    if (!transcript) return;
    const map: { start: number; end: number }[] = [];
    let pos = 0;
    const allTokens = transcript.split(/(\s+)/);

    allTokens.forEach((token) => {
      if (token.trim().length > 0) {
        const start = transcript.indexOf(token, pos);
        map.push({ start, end: start + token.length });
        pos = start + token.length;
      }
    });

    wordMapRef.current = map;
    wordsRef.current = words;
  }, [transcript]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  const speakFromWord = useCallback(
    (startWordIndex: number = 0) => {
      if (!transcript || typeof window === "undefined" || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Get text from the clicked word onwards
      const map = wordMapRef.current;
      if (startWordIndex >= map.length) return;

      const textFromWord = transcript.slice(map[startWordIndex].start);

      const utterance = new SpeechSynthesisUtterance(textFromWord);
      utteranceRef.current = utterance;

      const rates: Record<string, number> = {
        professional: 0.95,
        technical: 0.9,
        beginner: 0.85,
        casual: 1.0,
        brutal: 1.15,
      };

      utterance.rate = rates[selectedMode] || 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.name.includes("Natural") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en-US") && !v.name.includes("Compact")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;

      // Track word boundaries for highlighting
      let charOffset = 0;
      utterance.onboundary = (event) => {
        if (event.name === "word") {
          charOffset = event.charIndex;

          // Find which word index in the FULL transcript this corresponds to
          const absoluteCharPos = map[startWordIndex].start + charOffset;

          let wordIdx = startWordIndex;
          for (let i = startWordIndex; i < map.length; i++) {
            if (absoluteCharPos >= map[i].start && absoluteCharPos < map[i].end) {
              wordIdx = i;
              break;
            }
            if (map[i].start > absoluteCharPos) {
              wordIdx = Math.max(startWordIndex, i - 1);
              break;
            }
          }

          setCurrentWordIndex(wordIdx);
        }
      };

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
      };

      window.speechSynthesis.speak(utterance);
    },
    [transcript, selectedMode]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      speakFromWord(0);
    }
  };

  const handleWordClick = (wordIndex: number) => {
    stopSpeech();
    // Small delay to let cancel complete
    setTimeout(() => {
      speakFromWord(wordIndex);
      setShowTranscript(true);
    }, 100);
  };

  const handleModeChange = (mode: string) => {
    const wasPlaying = isPlaying;
    const currentWord = currentWordIndex;

    stopSpeech();
    setSelectedMode(mode);
    onModeChange?.(mode);

    // If was playing, restart from current word with new voice
    if (wasPlaying && currentWord >= 0) {
      setTimeout(() => {
        speakFromWord(currentWord);
      }, 200);
    }
  };

  const handleCopyTranscript = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = transcript;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices on mount (some browsers need this)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Voice Mode Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-600">Voice Style</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {VOICE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`p-3 rounded-xl border-2 transition-all text-left active:scale-95 ${
                selectedMode === mode.id
                  ? "border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-500/10"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="text-xl mb-1">{mode.icon}</div>
              <div className="text-sm font-medium text-slate-800">{mode.label}</div>
              <div className="text-xs text-slate-500">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-4">
          {/* Play Button */}
          <button
            onClick={handlePlayPause}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/25"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-purple-500/25"
            }`}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-slate-800">
              {isPlaying ? "Playing..." : "Voice Walkthrough"}
            </div>
            <div className="text-sm text-slate-500">
              {VOICE_MODES.find((m) => m.id === selectedMode)?.label} •{" "}
              {useBrowserTTS ? "Browser TTS" : "AI Voice"}
            </div>
          </div>

          {/* Waveform */}
          {isPlaying && (
            <div className="flex items-end gap-[3px] h-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                  style={{
                    animation: `wave 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                    height: "8px",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Section */}
      {transcript && (
        <div className="space-y-3">
          {/* Toggle + Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showTranscript ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showTranscript ? "Hide Transcript" : "Show Transcript"}
            </button>

            {showTranscript && (
              <button
                onClick={handleCopyTranscript}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  copiedTranscript
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {copiedTranscript ? "✓ Copied" : "Copy Transcript"}
              </button>
            )}
          </div>

          {/* Interactive Transcript */}
          {showTranscript && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-fadeIn">
              <p className="text-sm text-slate-500 mb-4">
                💡 Click any word to start playing from that point
              </p>
              <div className="leading-relaxed text-slate-700 select-text">
                {words.map((word, i) => (
                  <span
                    key={i}
                    onClick={() => handleWordClick(i)}
                    className={`inline-block cursor-pointer px-[2px] py-[1px] mx-[1px] rounded transition-all duration-150 ${
                      i === currentWordIndex
                        ? "bg-cyan-500 text-white scale-105 shadow-md shadow-cyan-500/30"
                        : i < currentWordIndex && currentWordIndex >= 0
                        ? "text-slate-400"
                        : "text-slate-700 hover:bg-cyan-100 hover:text-cyan-700"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS for waveform animation */}
      <style jsx>{`
        @keyframes wave {
          from {
            height: 8px;
          }
          to {
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
}