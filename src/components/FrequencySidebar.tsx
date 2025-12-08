import React, { useState, useRef } from 'react';
import { 
  Music, X, Pause, Volume2, Lock, 
  Wind, Heart, Brain 
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  hz?: number;
  base?: number;
  beat?: number;
  type: 'mono' | 'binaural';
  desc: string;
  icon: React.ReactNode;
  color: string;
  isLocked: boolean;
}

const FrequencySidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef1 = useRef<OscillatorNode | null>(null);
  const oscRef2 = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const tracks: Track[] = [
    {
      id: '432hz',
      title: "Nature's Balance",
      hz: 432,
      type: "mono",
      desc: "Grounding & Relaxation",
      icon: <Wind size={18} />,
      color: "from-teal-400 to-emerald-500",
      isLocked: false
    },
    {
      id: '528hz',
      title: "Miracle Tone",
      hz: 528,
      type: "mono",
      desc: "Healing & Positivity",
      icon: <Heart size={18} />,
      color: "from-rose-400 to-pink-500",
      isLocked: true
    },
    {
      id: '14hz',
      title: "Deep Focus",
      base: 200,
      beat: 14,
      type: "binaural",
      desc: "Beta Waves for Study",
      icon: <Brain size={18} />,
      color: "from-blue-400 to-indigo-500",
      isLocked: true
    }
  ];

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
  };

  const stopAudio = () => {
    if (oscRef1.current) { 
      try { oscRef1.current.stop(); oscRef1.current.disconnect(); } catch (e) {} 
      oscRef1.current = null; 
    }
    if (oscRef2.current) { 
      try { oscRef2.current.stop(); oscRef2.current.disconnect(); } catch (e) {} 
      oscRef2.current = null; 
    }
    setIsPlaying(false);
  };

  const playFrequency = (track: Track) => {
    initAudio();
    stopAudio();

    if (track.isLocked && !isPremium) {
      setShowPaywall(true);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (audioCtxRef.current?.state === 'suspended') { 
      audioCtxRef.current.resume(); 
    }

    const ctx = audioCtxRef.current!;
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (track.type === 'mono' && track.hz) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(track.hz, ctx.currentTime);
      osc.connect(masterGain);
      osc.start();
      oscRef1.current = osc;
    } else if (track.type === 'binaural' && track.base && track.beat) {
      const oscL = ctx.createOscillator();
      const panL = ctx.createStereoPanner();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(track.base, ctx.currentTime);
      panL.pan.value = -1; 
      oscL.connect(panL);
      panL.connect(masterGain);

      const oscR = ctx.createOscillator();
      const panR = ctx.createStereoPanner();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(track.base + track.beat, ctx.currentTime);
      panR.pan.value = 1; 
      oscR.connect(panR);
      panR.connect(masterGain);

      oscL.start();
      oscR.start();
      oscRef1.current = oscL;
      oscRef2.current = oscR;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.1);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300 flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold
            ${isPlaying 
              ? `bg-gradient-to-r ${currentTrack?.color || 'from-indigo-500 to-purple-500'} animate-pulse` 
              : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
            }
          `}
        >
          {isPlaying ? <Volume2 size={20} /> : <Music size={20} />}
          <span className="hidden md:inline">{isPlaying ? 'Therapy Active' : 'Sound Therapy'}</span>
        </button>
      )}

      {/* Slide-over Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music size={18} className="text-indigo-400"/> BEAT Therapy
            </h2>
            <p className="text-xs text-slate-400">Enhance your journaling</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Tracks List */}
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-200px)]">
          {tracks.map(track => {
            const active = currentTrack?.id === track.id;
            const locked = track.isLocked && !isPremium;
            return (
              <div 
                key={track.id} 
                onClick={() => playFrequency(track)}
                className={`group p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${active ? 'bg-slate-800 border-indigo-500' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}`}
              >
                <div className="flex items-center gap-3 relative z-10">
                   <div className={`w-10 h-10 rounded flex items-center justify-center text-white bg-gradient-to-br ${track.color} shadow-lg`}>
                      {active && isPlaying ? <Pause size={16} /> : track.icon}
                   </div>
                   <div>
                     <div className="text-sm font-bold text-slate-200">{track.title}</div>
                     <div className="text-xs text-slate-400">{track.desc}</div>
                   </div>
                </div>
                {locked && <div className="absolute top-3 right-3 text-slate-500"><Lock size={14} /></div>}
              </div>
            )
          })}
        </div>

        {/* Mini Player Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-slate-900 border-t border-slate-800">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Master Volume</span>
             <span className="text-xs text-indigo-400">{Math.round(volume * 100)}%</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="1" 
             step="0.01" 
             value={volume} 
             onChange={handleVolume} 
             className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
           />
           
           {!isPremium && (
             <button 
               onClick={() => setShowPaywall(true)} 
               className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/10"
             >
               Unlock All Tones
             </button>
           )}
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setShowPaywall(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Unlock Premium Frequencies</h3>
            <p className="text-slate-400 text-sm mb-4">Get access to 528Hz Miracle Tone and Binaural Focus beats.</p>
            <button 
              onClick={() => { setIsPremium(true); setShowPaywall(false); }} 
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FrequencySidebar;
