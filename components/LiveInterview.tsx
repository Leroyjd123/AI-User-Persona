import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Persona } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { X, Mic, MicOff, PhoneOff, Loader2, Wifi, WifiOff, RotateCw, Clock, User } from 'lucide-react';

interface LiveInterviewProps {
  persona: Persona;
  onClose: () => void;
  authMode: 'unselected' | 'free' | 'custom';
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ persona, onClose, authMode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New State
  const [timeLeft, setTimeLeft] = useState<number | null>(authMode === 'free' ? 300 : null); // 5 mins in seconds
  const [isMuted, setIsMuted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState(0); // 0-4 scale

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Live API Session Ref
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Audio Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup Function
  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
  }, []);

  const startSession = useCallback(async () => {
    try {
      setError(null);
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      // Init Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      const systemInstruction = `
        You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} living in ${persona.location}.
        Roleplay this persona accurately in a user research interview.
        Bio: ${persona.bio}.
        Motivations: ${persona.motivations.join(', ')}.
        Frustrations: ${persona.frustrations.join(', ')}.
        Speak casually and naturally. Do not sound like an AI assistant.
      `;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction,
        },
        callbacks: {
          onopen: async () => {
            console.log('Live Session Connected');
            setIsConnected(true);
            setRetryCount(0); // Reset retry on success

            try {
              streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
              if (!inputAudioContextRef.current) return;

              // Apply mute state if needed
              streamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);

              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

            } catch (err) {
              console.error("Mic Error:", err);
              setError("Microphone access denied.");
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
               setIsSpeaking(true);
               
               const ctx = outputAudioContextRef.current;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 base64ToUint8Array(base64Audio),
                 ctx,
                 24000,
                 1
               );

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               
               source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0) setIsSpeaking(false);
               });

               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            setIsConnected(false);
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            setIsConnected(false);
            // Auto-reconnect logic handled in useEffect or separate wrapper if needed, 
            // but simple retry logic inside error handler:
            if (retryCount < 1) {
                console.log("Attempting auto-reconnect...");
                setRetryCount(prev => prev + 1);
                cleanupAudio();
                setTimeout(startSession, 1000);
            } else {
                setError("Connection lost.");
            }
          }
        }
      });

    } catch (err: any) {
      setError(err.message || "Failed to start live session");
    }
  }, [persona, isMuted, retryCount, cleanupAudio]);

  const stopSession = useCallback(() => {
    cleanupAudio();
    setIsConnected(false);
    onClose();
  }, [cleanupAudio, onClose]);

  const handleCloseRequest = () => {
    if (isConnected) {
        if (window.confirm("Are you sure you want to end the interview session?")) {
            stopSession();
        }
    } else {
        stopSession();
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
        setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Initial mount
  useEffect(() => {
    startSession();
    return () => cleanupAudio();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer Effect
  useEffect(() => {
    if (authMode !== 'free' || !isConnected || timeLeft === null) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          alert("Free tier session limit (5 min) reached.");
          stopSession();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authMode, isConnected, timeLeft, stopSession]);

  // Connection Quality Sim
  useEffect(() => {
    if(isConnected) {
        const interval = setInterval(() => {
            setConnectionQuality(3 + (Math.random() > 0.8 ? -1 : 0)); // Mostly full bars
        }, 3000);
        return () => clearInterval(interval);
    }
  }, [isConnected]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md transition-all duration-300">
      <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl max-w-sm w-full flex flex-col items-center relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

        {/* Top Controls */}
        <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
             {timeLeft !== null && (
                 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-white/10 border-white/10 text-white/70'}`}>
                     <Clock className="w-3 h-3" />
                     {formatTime(timeLeft)}
                 </div>
             )}
        </div>

        <button 
          onClick={handleCloseRequest}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content */}
        <div className="mb-8 mt-12 relative z-10 flex flex-col items-center">
          
          {/* Avatar Ring */}
          <div className="relative">
             {/* Pulse Ring */}
             {isSpeaking && (
                 <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping"></div>
             )}
             
             <div className={`relative w-40 h-40 rounded-full p-1.5 transition-all duration-300 ${isSpeaking ? 'bg-gradient-to-tr from-indigo-400 to-purple-400 shadow-xl shadow-indigo-500/40 scale-105' : 'bg-white/10 scale-100'}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                    {persona.avatarUrl ? (
                        <img src={persona.avatarUrl} alt="Persona" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                             <User className="w-16 h-16" />
                        </div>
                    )}
                </div>
             </div>
          </div>
          
          <div className="mt-6 text-center">
             <h3 className="text-2xl font-bold text-white mb-1">{persona.name}</h3>
             <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                {isConnected ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <Wifi className="w-3 h-3" />
                        <span>Connected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-amber-400">
                         <WifiOff className="w-3 h-3" />
                         <span>Disconnected</span>
                    </div>
                )}
             </div>
          </div>
        </div>
        
        {/* Error State */}
        {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/20 text-red-200 text-xs rounded-xl border border-red-500/30 backdrop-blur-sm text-center w-full relative z-10">
                <p className="mb-2">{error}</p>
                <button 
                  onClick={() => { setError(null); setRetryCount(0); startSession(); }}
                  className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                >
                    <RotateCw className="w-3 h-3" /> Retry
                </button>
            </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-4 relative z-10 w-full mt-auto">
            <button
                onClick={toggleMute}
                disabled={!isConnected}
                className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
                    isMuted 
                    ? 'bg-red-500/20 border-red-500/30 text-red-200' 
                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                } disabled:opacity-50`}
            >
                 {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                 <span className="text-sm font-bold">{isMuted ? "Muted" : "Mute"}</span>
            </button>
            
            <button
                onClick={handleCloseRequest}
                className="h-14 w-14 bg-red-500 hover:bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
                <PhoneOff className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;