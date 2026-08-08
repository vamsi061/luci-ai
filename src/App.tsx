import { useState, useEffect, useRef } from "react";
import { LuciAudioSession, LiveState } from "./lib/audio";
import { LuciCoreVisualizer, LuciEmotion } from "./components/LuciCoreVisualizer";
import { BrowserAgent } from "./components/BrowserAgent";
import { HudModals } from "./components/HudModals";
import { 
  Power, 
  Volume2, 
  Info, 
  Sparkles, 
  Globe, 
  Maximize2, 
  Compass, 
  CircleAlert,
  MicOff,
  Mic,
  X,
  Brain,
  Monitor,
  Play,
  Pause,
  Square,
  RefreshCw,
  Video,
  Settings,
  Shield,
  Wifi,
  Cloud,
  FileText,
  Calendar,
  CheckSquare,
  Folder,
  Terminal,
  LayoutGrid,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, MemoryCategory } from "./lib/memoryTypes";
import { MemoryDashboard } from "./components/MemoryDashboard";
import { toEmbeddableSearchUrl } from "./lib/urlUtils";

export default function App() {
  const [state, setState] = useState<LiveState>("disconnected");

  // Real-time Screen Sharing states
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isScreenSharingPaused, setIsScreenSharingPaused] = useState<boolean>(false);
  const [screenVisionMode, setScreenVisionMode] = useState<boolean>(true);

  // References to preserve state across intervals
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenIntervalRef = useRef<any>(null);

  const isPausedRef = useRef<boolean>(false);
  const screenVisionRef = useRef<boolean>(true);
  const stateRef = useRef<LiveState>("disconnected");

  // Real-time Clock & Uptime Counter
  const [clockTime, setClockTime] = useState<string>("");
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(19934); // ~5h 32m 14s

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setClockTime(timeStr);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    const uptimeInterval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Real-time System Telemetry Metrics
  const [systemStats, setSystemStats] = useState({
    cpu: 23,
    memory: 45,
    network: 68,
    battery: 81
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.min(95, Math.max(12, 23 + Math.floor((Math.random() - 0.5) * 6))),
        memory: Math.min(90, Math.max(30, 45 + Math.floor((Math.random() - 0.5) * 4))),
        network: Math.min(99, Math.max(40, 68 + Math.floor((Math.random() - 0.5) * 8))),
        battery: Math.min(100, Math.max(20, 81))
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync state changes with refs
  useEffect(() => {
    isPausedRef.current = isScreenSharingPaused;
  }, [isScreenSharingPaused]);

  useEffect(() => {
    screenVisionRef.current = screenVisionMode;
  }, [screenVisionMode]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clean up streaming intervals on unmount
  useEffect(() => {
    return () => {
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
    };
  }, []);

  const captureFrameAndSend = () => {
    const video = screenVideoRef.current;
    if (!video || isPausedRef.current || !screenVisionRef.current) {
      return;
    }

    if (stateRef.current === "disconnected") {
      return;
    }

    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      if (!screenCanvasRef.current) {
        screenCanvasRef.current = document.createElement("canvas");
      }
      const canvas = screenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxDim = 960;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
      const base64 = dataUrl.split(",")[1];

      if (sessionRef.current && stateRef.current !== "disconnected") {
        sessionRef.current.sendVideoFrame(base64);
      }
    } catch (err) {
      console.error("[Screen Capture] Failed drawing frame to canvas:", err);
    }
  };

  const startScreenSharing = async () => {
    setErrorText(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 5 }
        },
        audio: false
      });

      screenStreamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(e => console.error("Video play warning:", e));
      screenVideoRef.current = video;

      setIsScreenSharing(true);
      setIsScreenSharingPaused(false);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
      screenIntervalRef.current = setInterval(() => {
        captureFrameAndSend();
      }, 2000);

      setTimeout(() => {
        captureFrameAndSend();
      }, 500);

    } catch (e: any) {
      console.error("Screen sharing permission declined:", e);
      if (e.name !== "NotAllowedError") {
        setErrorText(`Could not capture screen: ${e.message || e}`);
      }
    }
  };

  const stopScreenSharing = () => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current = null;
    }

    setIsScreenSharing(false);
    setIsScreenSharingPaused(false);
  };

  const pauseScreenSharing = () => {
    setIsScreenSharingPaused(true);
  };

  const resumeScreenSharing = () => {
    setIsScreenSharingPaused(false);
    setTimeout(() => {
      captureFrameAndSend();
    }, 100);
  };

  const switchScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    await startScreenSharing();
  };

  const [activeEmotion, setActiveEmotion] = useState<LuciEmotion>("idle");
  const [themeColor, setThemeColor] = useState<string>("charcoal");
  const [userCaption, setUserCaption] = useState<string>("");
  const [characterState, setCharacterState] = useState<"idle" | "thinking" | "talking">("idle");
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const detectEmotionFromText = (text: string): LuciEmotion => {
    const lower = text.toLowerCase();
    if (lower.includes("haha") || lower.includes("lol") || lower.includes("funny") || lower.includes("joke") || lower.includes("hehe") || lower.includes("wink")) return "playful";
    if (lower.includes("happy") || lower.includes("harmony") || lower.includes("glad") || lower.includes("joy") || lower.includes("wonderful") || lower.includes("love") || lower.includes("smile")) return "happy";
    if (lower.includes("wow") || lower.includes("awesome") || lower.includes("excited") || lower.includes("amazing") || lower.includes("yay") || lower.includes("incredible") || lower.includes("hype")) return "excited";
    if (lower.includes("really?") || lower.includes("curious") || lower.includes("interest") || lower.includes("tell me more") || lower.includes("why") || lower.includes("how") || lower.includes("wonder")) return "curious";
    if (lower.includes("think") || lower.includes("calculat") || lower.includes("analyz") || lower.includes("hmmm") || lower.includes("process") || lower.includes("let me see") || lower.includes("conclude")) return "thinking";
    if (lower.includes("proud") || lower.includes("achieved") || lower.includes("expert") || lower.includes("skill") || lower.includes("confidence") || lower.includes("succeed")) return "proud";
    if (lower.includes("sad") || lower.includes("sorry") || lower.includes("unfortunate") || lower.includes("grief") || lower.includes("bad") || lower.includes("regret") || lower.includes("alas") || lower.includes("cry")) return "sad";
    if (lower.includes("shock") || lower.includes("surprise") || lower.includes("gasp") || lower.includes("unexpected") || lower.includes("seriously") || lower.includes("oh my")) return "surprised";
    if (lower.includes("blush") || lower.includes("shy") || lower.includes("embarrass") || lower.includes("nervous") || lower.includes("oops") || lower.includes("sorry about")) return "embarrassed";
    if (lower.includes("what?") || lower.includes("confus") || lower.includes("puzzled") || lower.includes("dont know") || lower.includes("not sure") || lower.includes("wait")) return "confused";
    return "idle";
  };

  const [modelCaption, setModelCaption] = useState<string>("");
  const [activeProjectorUrl, setActiveProjectorUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Active HUD Dock Modal State
  const [activeDockModal, setActiveDockModal] = useState<"notes" | "calendar" | "tasks" | "files" | "terminal" | "settings" | null>(null);

  // Myraa Autopilot system controller state and queue
  const [browserTrigger, setBrowserTrigger] = useState<{
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  } | null>(null);

  const toolQueueRef = useRef<Array<{
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  }>>([]);
  const isQueueProcessingRef = useRef<boolean>(false);

  const processNextBrowserTool = () => {
    if (toolQueueRef.current.length > 0) {
      isQueueProcessingRef.current = true;
      const nextTrigger = toolQueueRef.current.shift()!;
      setBrowserTrigger(nextTrigger);
    } else {
      isQueueProcessingRef.current = false;
      setBrowserTrigger(null);
    }
  };

  // Recollections database
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState<boolean>(false);

  const sessionRef = useRef<LuciAudioSession | null>(null);

  useEffect(() => {
    fetch("/api/memories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMemories(data);
        }
      })
      .catch(err => console.error("Initial persistent recollections load failure:", err));
  }, []);

  const handleAddManualMemory = async (category: MemoryCategory, text: string) => {
    try {
      const resp = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text })
      });
      const saved = await resp.json();
      if (saved && saved.id) {
        setMemories((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Manual database recollect upload error:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const resp = await fetch(`/api/memories/${id}`, {
        method: "DELETE"
      });
      const resObj = await resp.json();
      if (resObj && resObj.success) {
        setMemories((prev) => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Manual memory delete execution failed:", err);
    }
  };

  // Initialize audio session
  useEffect(() => {
    sessionRef.current = new LuciAudioSession({
      onStateChange: (newState) => {
        setState(newState);
        if (newState === "disconnected") {
          setUserCaption("");
          setModelCaption("");
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "listening") {
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "speaking") {
          setCharacterState("talking");
        }
      },
      onTranscription: (role, text) => {
        if (role === "user") {
          setUserCaption(text);
          setModelCaption("");
          setCharacterState("thinking");
        } else if (role === "model") {
          setModelCaption((prev) => {
            const next = prev + text;
            const newEmotion = detectEmotionFromText(next);
            setActiveEmotion(newEmotion);
            return next;
          });
          setUserCaption("");
        }
      },
      onToolCall: (name, args, callback) => {
        console.log(`[Luci Core ToolCall] Invoking ${name}:`, args);

        if (name === "openBrowser" || name === "openWebsite" || name === "projectWebsite" || name === "browserOpen") {
          let targetUrl = args.url || args.targetUrl || args.query || "https://google.com";
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            const lower = targetUrl.toLowerCase();
            if (lower === "youtube" || lower === "youtube.com") targetUrl = "https://youtube.com";
            else if (lower.startsWith("youtube ")) {
              const ytQ = targetUrl.replace(/^youtube\s+/gi, "").trim();
              targetUrl = `https://youtube.com/results?search_query=${encodeURIComponent(ytQ)}`;
            }
            else if (lower === "maps" || lower === "google maps" || lower === "maps.google.com" || lower === "google.com/maps") targetUrl = "https://www.google.com/maps";
            else if (lower.startsWith("maps ") || lower.startsWith("google maps ")) {
              const mapQ = targetUrl.replace(/^(google\s+)?maps\s+(for\s+)?/gi, "").trim();
              targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapQ)}`;
            }
            else if (lower.includes("google")) targetUrl = "https://google.com";
            else targetUrl = `https://${targetUrl}`;
          }
          // Google search results can't render inside the sandbox proxy (JS-required),
          // so route them through DuckDuckGo's server-rendered HTML search.
          targetUrl = toEmbeddableSearchUrl(targetUrl);
          setActiveProjectorUrl(targetUrl);

          const triggerItem = {
            type: "browserOpen",
            args: { url: targetUrl },
            id: Math.random().toString(36).substring(7),
            callback: (res: any) => {
              callback({ result: `Successfully opened website frame to ${targetUrl}.` });
              setTimeout(() => {
                processNextBrowserTool();
              }, 120);
            }
          };
          toolQueueRef.current.push(triggerItem);

          if (!isQueueProcessingRef.current) {
            processNextBrowserTool();
          }
        } else if (name.startsWith("browser") || name === "readPageContent") {
          if (!activeProjectorUrl) {
            setActiveProjectorUrl("https://google.com");
          }
          const triggerItem = {
            type: name,
            args,
            id: Math.random().toString(36).substring(7),
            callback: (res: any) => {
              callback(res);
              setTimeout(() => {
                processNextBrowserTool();
              }, 120);
            }
          };
          toolQueueRef.current.push(triggerItem);

          if (!isQueueProcessingRef.current) {
            processNextBrowserTool();
          }
        } else if (name === "changeBackground") {
          const colorName = args.color?.toLowerCase();
          const validColors = ["violet", "crimson", "emerald", "celestial", "gold", "rose", "charcoal"];
          if (colorName && validColors.includes(colorName)) {
            setThemeColor(colorName);
            callback({ result: `Atmosphere shifted to ${colorName}.` });
          } else {
            callback({ error: `Unsupported color '${colorName}'.` });
          }
        } else {
          callback({ error: `Tool ${name} is not implemented.` });
        }
      },
      onError: (err) => {
        setErrorText(err);
      },
      onMemorySync: (updatedMemories) => {
        if (Array.isArray(updatedMemories)) {
          setMemories(updatedMemories);
        }
      }
    });

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleConnection = async () => {
    setErrorText(null);
    if (!sessionRef.current) return;

    if (state === "disconnected") {
      await sessionRef.current.connect();
    } else {
      sessionRef.current.disconnect();
    }
  };

  return (
    <div
      id="luci-hud-desktop"
      className="relative w-full h-screen overflow-hidden bg-[#02050e] text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans"
    >
      {/* Sci-Fi Radial Ambient Light Spots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Cybernetic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* BACKGROUND HOLOGRAM CHARACTER CANVAS */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <LuciCoreVisualizer
          session={sessionRef.current}
          state={state}
          themeColor={themeColor}
          activeEmotion={activeEmotion}
          characterState={characterState}
        />
      </div>

      {/* 1. TOP NAVIGATION HEADER */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto px-2 select-none">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          {/* Glowing Double Ring Logo */}
          <div className="relative w-9 h-9 rounded-full border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.6)] bg-cyan-950/60 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-cyan-300 animate-ping opacity-75" />
            <div className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-mono text-base sm:text-lg font-bold tracking-[0.35em] text-white uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
              L U C I
            </h1>
            <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase -mt-0.5 font-medium">
              Your AI Assistant
            </span>
          </div>
        </div>

        {/* Right Status Controls & Clock */}
        <div className="flex items-center gap-4">
          <div className="text-xs sm:text-sm font-mono tracking-wider text-slate-200 flex items-center gap-1.5 font-medium">
            <span>{clockTime || "08:32 PM"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleConnection}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                state !== "disconnected" 
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]" 
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle Mic / Voice Connection"
            >
              {state !== "disconnected" ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            <button
              onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isScreenSharing 
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]" 
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Screen Sharing / Camera Vision"
            >
              <Video size={16} />
            </button>

            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className={`px-3 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                isZenMode 
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
              }`}
              title={isZenMode ? "Show Full HUD Interface" : "Hide Everything Except Character & Top Bar"}
            >
              {isZenMode ? <Eye size={16} className="text-cyan-300" /> : <EyeOff size={16} />}
              <span className="text-xs font-mono font-medium hidden sm:inline">
                {isZenMode ? "Show HUD" : "Clean View"}
              </span>
            </button>

            <button
              onClick={() => setActiveDockModal("settings")}
              className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="HUD Settings & Aesthetics"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN HUD SECTION & FOOTER (Hidden in Zen / Clean Mode) */}
      {!isZenMode && (
        <>
          <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 sm:gap-6 items-center py-4 my-auto">
        
        {/* LEFT PANEL: STATUS */}
        <div className="hidden lg:flex flex-col gap-4 p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/60 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase font-bold">
              STATUS
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-light tracking-wide text-white font-sans my-1">
              {state === "listening" ? "Listening..." :
               state === "speaking" ? "Speaking..." :
               state === "connecting" ? "Thinking..." : "Standby"}
            </h2>

            {/* Status Waveform Visualizer */}
            <div className="flex items-center gap-1 h-7 my-3">
              {[14, 24, 18, 28, 20, 10, 22, 16, 26, 12, 20, 8].map((h, i) => {
                let hFactor = 0.3;
                if (state === "speaking") hFactor = 0.3 + Math.sin(Date.now() * 0.02 + i) * 0.7;
                else if (state === "listening") hFactor = 0.2 + Math.sin(Date.now() * 0.01 + i) * 0.5;
                const calcH = Math.max(3, h * hFactor);

                return (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-cyan-400/80 transition-all duration-200"
                    style={{ height: `${calcH}px` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">VOICE INPUT •</span>
              <span className={state !== "disconnected" ? "text-cyan-300 font-bold" : "text-slate-500"}>
                {state !== "disconnected" ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">LANGUAGE</span>
              <span className="text-slate-200">English (US)</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400">PERSONALITY •</span>
              <span className="text-slate-200 text-[11px]">Calm • Helpful • Intelligent</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">MEMORY •</span>
              <span className="text-cyan-400 font-bold">Online</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: DIALOGUE CAPTIONS & MAIN MIC BUTTON */}
        <div className="flex flex-col items-center justify-between h-full py-4 text-center">
          
          <div className="h-10" />

          {/* Dialogue / Subtitle Caption line */}
          <div className="w-full max-w-xl min-h-[5rem] flex flex-col items-center justify-center px-4">
            <AnimatePresence mode="wait">
              {(() => {
                const activeText = modelCaption 
                  ? modelCaption 
                  : userCaption 
                    ? userCaption 
                    : "";

                if (!activeText) return null;

                return (
                  <motion.p
                    key={activeText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg sm:text-xl font-light tracking-wide text-slate-100 font-sans drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] max-w-lg leading-relaxed"
                  >
                    {activeText}
                  </motion.p>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Long Horizontal Audio Waveform spanning across lower center */}
          <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-lg my-4">
            {Array.from({ length: 42 }).map((_, idx) => {
              let heightFactor = 0.2;
              if (state === "speaking") {
                heightFactor = 0.2 + Math.sin(Date.now() * 0.015 + idx * 0.4) * 0.8;
              } else if (state === "listening") {
                heightFactor = 0.15 + Math.sin(Date.now() * 0.008 + idx * 0.3) * 0.55;
              }
              const calculatedHeight = Math.max(4, 32 * heightFactor);

              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    state === "speaking" ? "bg-purple-400 shadow-[0_0_8px_#c084fc]" :
                    state === "listening" ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-cyan-500/20"
                  }`}
                  style={{ height: `${calculatedHeight}px` }}
                />
              );
            })}
          </div>

          {/* Main Glowing Call Microphone Button */}
          <div className="relative flex items-center justify-center my-2">
            {/* Double Outer Rings */}
            <div className="absolute w-28 h-28 rounded-full border border-cyan-500/30 animate-ping pointer-events-none opacity-40" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-400/40 pointer-events-none" />

            <button
              onClick={handleToggleConnection}
              className={`relative z-10 w-20 h-20 rounded-full border-2 transition-all duration-300 flex items-center justify-center cursor-pointer ${
                state === "disconnected"
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95"
                  : state === "listening"
                  ? "border-cyan-300 bg-cyan-500/20 text-cyan-200 shadow-[0_0_50px_rgba(34,211,238,0.7)] animate-pulse scale-105"
                  : state === "speaking"
                  ? "border-purple-400 bg-purple-600/80 text-white shadow-[0_0_50px_rgba(168,85,247,0.7)] scale-105"
                  : "border-amber-400 bg-amber-600 text-white animate-spin"
              }`}
              title={state === "disconnected" ? "Activate Voice Assistant" : "Disconnect Voice Session"}
            >
              {state === "disconnected" ? (
                <Mic size={28} className="text-cyan-300 drop-shadow-[0_0_10px_#22d3ee]" />
              ) : state === "connecting" ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : state === "listening" ? (
                <Mic size={28} className="text-cyan-200" />
              ) : (
                <Volume2 size={28} className="text-white" />
              )}
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: SYSTEM TELEMETRY */}
        <div className="hidden lg:flex flex-col gap-4 text-left">
          
          {/* SYSTEM METRICS BOX */}
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/60 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] space-y-3 font-mono text-xs">
            <div className="text-[10px] font-mono tracking-[0.2em] text-cyan-400 uppercase font-bold">
              SYSTEM
            </div>

            {/* Progress Bars */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>CPU</span>
                  <span className="text-cyan-400 font-bold">{systemStats.cpu}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000" style={{ width: `${systemStats.cpu}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>MEMORY</span>
                  <span className="text-cyan-400 font-bold">{systemStats.memory}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000" style={{ width: `${systemStats.memory}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>NETWORK</span>
                  <span className="text-cyan-400 font-bold">{systemStats.network}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000" style={{ width: `${systemStats.network}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>BATTERY</span>
                  <span className="text-cyan-400 font-bold">{systemStats.battery}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000" style={{ width: `${systemStats.battery}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* STATUS CHIPS GRID */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center text-center">
              <Shield size={16} className="text-cyan-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-200 font-bold leading-tight">Secure</span>
              <span className="text-[8px] font-mono text-slate-400">Connection</span>
            </div>

            <div className="p-3 rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center text-center">
              <Wifi size={16} className="text-cyan-400 mb-1 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-200 font-bold leading-tight">Online</span>
              <span className="text-[8px] font-mono text-slate-400">Status</span>
            </div>

            <div className="p-3 rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center text-center">
              <Cloud size={16} className="text-cyan-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-200 font-bold leading-tight">Cloud</span>
              <span className="text-[8px] font-mono text-slate-400">Synced</span>
            </div>
          </div>

          {/* UPTIME BOX WITH SPARKLINE */}
          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/60 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] font-mono text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] tracking-[0.2em] text-cyan-400 uppercase font-bold">UPTIME</span>
            </div>

            <div className="text-base font-bold text-white">
              {formatUptime(uptimeSeconds)}
            </div>

            {/* Sparkline Graph */}
            <div className="h-8 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M0,20 Q15,5 30,22 T60,10 T90,25 T100,8"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_#22d3ee]"
                />
              </svg>
            </div>
          </div>

        </div>

      </main>

      {/* 3. BOTTOM NAVIGATION DOCK TOOLBAR (matching image) */}
      <footer className="relative z-30 w-full max-w-4xl mx-auto px-2 pb-2">
        <div className="flex items-center justify-around sm:justify-center sm:gap-6 px-4 sm:px-8 py-3 bg-slate-950/80 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] text-slate-300">
          
          {/* Left Navigation Options */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setShowMemoryDashboard(true)}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Memory Recollections"
            >
              <Brain size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Memory</span>
            </button>

            <button
              onClick={() => setActiveDockModal("notes")}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="AI Quick Notes"
            >
              <FileText size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Notes</span>
            </button>

            <button
              onClick={() => setActiveDockModal("calendar")}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="System Calendar"
            >
              <Calendar size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Calendar</span>
            </button>

            <button
              onClick={() => setActiveDockModal("tasks")}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Tasks Matrix"
            >
              <CheckSquare size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Tasks</span>
            </button>
          </div>

          {/* Center Space Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />

          {/* Right Navigation Options */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setActiveDockModal("files")}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Workspace Files"
            >
              <Folder size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Files</span>
            </button>

            <button
              onClick={() => {
                if (!activeProjectorUrl) setActiveProjectorUrl("https://google.com");
              }}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Open Web Projector Agent"
            >
              <Globe size={18} className="group-hover:scale-110 transition text-cyan-400" />
              <span className="text-[10px] font-mono tracking-wider text-cyan-300">Browser</span>
            </button>

            <button
              onClick={() => setActiveDockModal("terminal")}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Playwright Agent Terminal"
            >
              <Terminal size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Terminal</span>
            </button>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex flex-col items-center gap-1 hover:text-cyan-400 transition cursor-pointer group"
              title="Topics & Suggestions"
            >
              <LayoutGrid size={18} className="group-hover:scale-110 transition" />
              <span className="text-[10px] font-mono tracking-wider">Apps</span>
            </button>
          </div>

        </div>
      </footer>
        </>
      )}

      {/* TOPICS & COMMAND SUGGESTIONS OVERLAY */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-2xl max-w-md w-full text-left shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3 text-white">
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wide text-cyan-400">
                <Compass size={16} />
                <span>LUCI DIRECTIVES & SUGGESTIONS</span>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white transition">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                ⚡ &quot;Search Google Maps for cafes nearby&quot;
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                ⚡ &quot;Open youtube.com on my screen&quot;
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                ⚡ &quot;Remember my favorite coding language is TypeScript&quot;
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL ERROR PROTOCOL OVERLAY */}
      <AnimatePresence>
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-950/80 backdrop-blur-xl max-w-md w-full text-left"
          >
            <CircleAlert className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-300 font-mono">System Error Protocol</h4>
              <p className="text-xs text-rose-200 mt-1 leading-relaxed">{errorText}</p>
              <button
                onClick={() => setErrorText(null)}
                className="mt-2 text-[10px] font-bold text-rose-400 underline font-mono uppercase cursor-pointer"
              >
                Dismiss Error
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BROWSER AGENT PROJECTOR */}
      <AnimatePresence>
        {activeProjectorUrl && (
          <BrowserAgent
            url={activeProjectorUrl}
            onClose={() => {
              setActiveProjectorUrl(null);
              setBrowserTrigger(null);
            }}
            actionTrigger={browserTrigger}
          />
        )}
      </AnimatePresence>

      {/* HUD DOCK MODALS */}
      <HudModals
        activeModal={activeDockModal}
        onClose={() => setActiveDockModal(null)}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        onOpenBrowser={() => {
          if (!activeProjectorUrl) setActiveProjectorUrl("https://google.com");
        }}
      />

      {/* MEMORY RECOLLECTIONS DASHBOARD */}
      <MemoryDashboard
        isOpen={showMemoryDashboard}
        onClose={() => setShowMemoryDashboard(false)}
        memories={memories}
        onAddMemory={handleAddManualMemory}
        onDeleteMemory={handleDeleteMemory}
        themeColor={themeColor}
      />
    </div>
  );
}
