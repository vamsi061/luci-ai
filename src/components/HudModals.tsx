import React, { useState } from "react";
import { 
  X, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Folder, 
  Terminal, 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles,
  Server,
  Globe,
  Radio,
  Cpu,
  HardDrive,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HudModalProps {
  activeModal: "notes" | "calendar" | "tasks" | "files" | "terminal" | "settings" | null;
  onClose: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  onOpenBrowser?: () => void;
}

export const HudModals: React.FC<HudModalProps> = ({
  activeModal,
  onClose,
  themeColor,
  setThemeColor,
  onOpenBrowser
}) => {
  // Notes State
  const [notes, setNotes] = useState<string[]>([
    "LUCI Neural Core online and synced with Gemini 2.0 Flash Live.",
    "Local Playwright browser automation agent ready on port 3001.",
    "Holographic visualizer video assets verified in /public/assets."
  ]);
  const [newNote, setNewNote] = useState("");

  // Tasks State
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: "1", text: "Verify voice audio streaming low latency", done: true },
    { id: "2", text: "Test YouTube & Google Maps browser agent navigation", done: true },
    { id: "3", text: "Check real-time system telemetry parameters", done: false }
  ]);
  const [newTask, setNewTask] = useState("");

  if (!activeModal) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      setNotes([newNote.trim(), ...notes]);
      setNewNote("");
    }
  };

  const handleDeleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([{ id: Date.now().toString(), text: newTask.trim(), done: false }, ...tasks]);
      setNewTask("");
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const themes = [
    { id: "charcoal", name: "Electric Cyan", color: "bg-cyan-500" },
    { id: "violet", name: "Deep Violet", color: "bg-purple-500" },
    { id: "crimson", name: "Crimson Red", color: "bg-rose-500" },
    { id: "emerald", name: "Emerald Green", color: "bg-emerald-500" },
    { id: "celestial", name: "Celestial Blue", color: "bg-sky-500" },
    { id: "gold", name: "Amber Gold", color: "bg-amber-500" },
    { id: "rose", name: "Rose Pink", color: "bg-pink-500" }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_80px_rgba(6,182,212,0.15)] text-white backdrop-blur-2xl overflow-hidden"
        >
          {/* Ambient Glow Header Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                {activeModal === "notes" && <FileText size={18} />}
                {activeModal === "calendar" && <Calendar size={18} />}
                {activeModal === "tasks" && <CheckSquare size={18} />}
                {activeModal === "files" && <Folder size={18} />}
                {activeModal === "terminal" && <Terminal size={18} />}
                {activeModal === "settings" && <Settings size={18} />}
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">
                  {activeModal === "notes" && "AI Quick Notes"}
                  {activeModal === "calendar" && "System Calendar & Schedule"}
                  {activeModal === "tasks" && "Task Control Matrix"}
                  {activeModal === "files" && "Workspace Core Files"}
                  {activeModal === "terminal" && "Local Agent Playwright Terminal"}
                  {activeModal === "settings" && "LUCI Core Settings"}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  HUD Interactive Telemetry Module
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* MODAL CONTENT: NOTES */}
          {activeModal === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type new quick note..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition text-xs leading-relaxed"
                  >
                    <p className="text-slate-200">{note}</p>
                    <button
                      onClick={() => handleDeleteNote(idx)}
                      className="text-slate-500 hover:text-rose-400 transition cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODAL CONTENT: CALENDAR */}
          {activeModal === "calendar" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase">Today's Date</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Clock size={24} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Scheduled AI Operations</div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">System Telemetry Audit</div>
                    <div className="text-[10px] text-slate-400">09:00 AM • Automated Diagnostics</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">COMPLETED</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">Local Browser Agent Sync</div>
                    <div className="text-[10px] text-slate-400">12:30 PM • Playwright Chromium Sync</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">ACTIVE</span>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONTENT: TASKS */}
          {activeModal === "tasks" && (
            <div className="space-y-4">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Enter new task directive..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border ${
                      task.done ? "border-emerald-500/30 bg-emerald-950/10 opacity-75" : "border-white/5"
                    } transition text-xs`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => handleToggleTask(task.id)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        task.done ? "bg-emerald-500 border-emerald-400 text-slate-950" : "border-slate-600"
                      }`}>
                        {task.done && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className={task.done ? "line-through text-slate-400" : "text-slate-200"}>{task.text}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODAL CONTENT: FILES */}
          {activeModal === "files" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {[
                { name: "idle.mp4", size: "1.8 MB", type: "Character Video", path: "/assets/idle.mp4" },
                { name: "thinking.mp4", size: "1.9 MB", type: "Character Video", path: "/assets/thinking.mp4" },
                { name: "talking.mp4", size: "2.1 MB", type: "Character Video", path: "/assets/talking.mp4" },
                { name: "local-agent.js", size: "13.8 KB", type: "Playwright Automation Server", path: "/local-agent.js" },
                { name: "server.ts", size: "38.7 KB", type: "Backend Gemini & Proxy Express Server", path: "/server.ts" }
              ].map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition text-xs">
                  <div className="flex items-center gap-3">
                    <Folder size={16} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-slate-200">{file.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{file.type} • {file.size}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-500/10">VERIFIED</span>
                </div>
              ))}
            </div>
          )}

          {/* MODAL CONTENT: TERMINAL */}
          {activeModal === "terminal" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-black border border-white/10 space-y-2 text-slate-300 max-h-56 overflow-y-auto">
                <div className="text-cyan-400 font-bold">[LUCI Core Log System]</div>
                <div>&gt; Initializing Gemini Live Audio WebSocket... <span className="text-emerald-400">OK</span></div>
                <div>&gt; Connecting to local Playwright agent at http://localhost:3001... <span className="text-cyan-400">CONNECTED</span></div>
                <div>&gt; Browser Automation Commands: [browserOpen, browserSearch, browserClick, browserReadContent]</div>
                <div>&gt; System Uptime Telemetry Stream... <span className="text-cyan-400">ONLINE</span></div>
                <div className="text-slate-500 animate-pulse">&gt; Waiting for user directive...</div>
              </div>

              {onOpenBrowser && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBrowser();
                  }}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                >
                  <Globe size={14} /> Open Browser Agent Projection
                </button>
              )}
            </div>
          )}

          {/* MODAL CONTENT: SETTINGS */}
          {activeModal === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold uppercase text-slate-300 block mb-2">Aesthetic HUD Theme Color</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeColor(t.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
                        themeColor === t.id ? "border-cyan-400 bg-cyan-500/20 text-white font-bold" : "border-white/10 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.color}`} />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="font-mono text-slate-300">Voice Language</span>
                  <span className="font-mono text-cyan-400 font-bold">English (US)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="font-mono text-slate-300">AI Personality Model</span>
                  <span className="font-mono text-cyan-400 font-bold">Calm • Helpful • Intelligent</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
