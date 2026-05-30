'use client'
import { useState, useEffect, useMemo, useRef } from "react";

// ==================== DESIGN TOKENS ====================
const C = {
  bg: "#0e0e10",
  panel: "#141416",
  card: "#1a1a1e",
  hover: "#202026",
  active: "#26262e",
  border: "#2a2a32",
  borderHi: "#323240",
  text: "#e8e8f0",
  muted: "#7a7a96",
  dim: "#4a4a60",
  accent: "#6c6cff",
  accentDim: "rgba(108,108,255,0.14)",
  green: "#2dba6e",
  greenDim: "rgba(45,186,110,0.14)",
  orange: "#f07840",
  orangeDim: "rgba(240,120,64,0.14)",
  red: "#e84040",
  redDim: "rgba(232,64,64,0.14)",
  yellow: "#e8c040",
  yellowDim: "rgba(232,192,64,0.14)",
};

const PRIORITY = {
  urgent: { color: C.red, bg: C.redDim, label: "Urgent", dot: C.red },
  high: { color: C.orange, bg: C.orangeDim, label: "High", dot: C.orange },
  medium: { color: C.yellow, bg: C.yellowDim, label: "Medium", dot: C.yellow },
  low: { color: C.accent, bg: C.accentDim, label: "Low", dot: C.accent },
};
const STATUS = {
  backlog: { label: "Backlog", color: C.dim },
  planned: { label: "Planned", color: C.muted },
  "in-progress": { label: "In Progress", color: C.accent },
  focus: { label: "Focus", color: C.orange },
  completed: { label: "Done", color: C.green },
};

// ==================== UTILS ====================
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function fmt(min) {
  if (!min || min <= 0) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return h + "h " + m + "m";
  if (h > 0) return h + "h";
  return m + "m";
}

function fmtMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? h + ":" + mm + ":" + ss : mm + ":" + ss;
}

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      num: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: d.toDateString() === today.toDateString(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });
}

const TODAY = new Date().toISOString().split("T")[0];

// ==================== INITIAL DATA ====================
const INIT_TASKS = [
  {
    id: "1", title: "Design new dashboard",
    description: "Create wireframes and high-fidelity mockups for the analytics dashboard",
    priority: "high", status: "in-progress", estimatedMinutes: 120, actualMinutes: 45,
    dueDate: TODAY, updatedAt: Date.now(),
    subtasks: [
      { id: "s1", title: "Research competitors", completed: true, estimatedMinutes: 30, actualMinutes: 25 },
      { id: "s2", title: "Create wireframes", completed: false, estimatedMinutes: 45, actualMinutes: 0 },
      { id: "s3", title: "Review with team", completed: false, estimatedMinutes: 20, actualMinutes: 0 },
    ],
  },
  {
    id: "2", title: "Fix authentication bug",
    description: "SSO login flow breaks on Safari — users cannot sign in",
    priority: "urgent", status: "planned", estimatedMinutes: 60, actualMinutes: 0,
    dueDate: TODAY, updatedAt: Date.now(), subtasks: [],
  },
  {
    id: "3", title: "Write API documentation",
    description: "Document all REST endpoints with examples and error codes",
    priority: "medium", status: "focus", estimatedMinutes: 180, actualMinutes: 90,
    dueDate: TODAY, updatedAt: Date.now(),
    subtasks: [
      { id: "s4", title: "Auth endpoints", completed: true, estimatedMinutes: 60, actualMinutes: 45 },
      { id: "s5", title: "User endpoints", completed: false, estimatedMinutes: 60, actualMinutes: 0 },
    ],
  },
  {
    id: "4", title: "Performance audit",
    description: "Profile main bundle and reduce load time below 2s",
    priority: "low", status: "backlog", estimatedMinutes: 90, actualMinutes: 0,
    dueDate: TODAY, updatedAt: Date.now(), subtasks: [],
  },
];

// ==================== STATE ====================
function loadTasks() {
  try {
    const s = localStorage.getItem("prodos_v4");
    if (s) return JSON.parse(s);
  } catch (_) { }
  return INIT_TASKS;
}

let _state = {
  tasks: loadTasks(),
  view: "weekly",
  selectedTask: null,
  selectedDate: TODAY,
  boardView: false,
  inspectorOpen: false,
  createOpen: false,
  cmdOpen: false,
  // timer
  timerRunning: false,
  timerTaskId: null,
  timerRemaining: 0,   // ms remaining (snapshot when paused)
  timerTotal: 0,     // ms total for current session
  timerStartedAt: null, // Date.now() when last resumed
  timerMinimized: false,
  deepFocus: false,
};

const _listeners = new Set();

function getState() { return _state; }

function setState(patch) {
  const next = typeof patch === "function" ? patch(_state) : patch;
  _state = { ..._state, ...next };
  try { localStorage.setItem("prodos_v4", JSON.stringify(_state.tasks)); } catch (_) { }
  _listeners.forEach(fn => fn(_state));
}

function useStore(sel) {
  const [v, setV] = useState(() => sel(getState()));
  const selRef = useRef(sel);
  selRef.current = sel;
  useEffect(() => {
    const fn = s => {
      const next = selRef.current(s);
      setV(prev => {
        // shallow equality to avoid unnecessary re-renders
        if (prev === next) return prev;
        return next;
      });
    };
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);
  return v;
}

// ==================== ACTIONS ====================
const A = {
  addTask(t) {
    setState(s => ({
      tasks: [...s.tasks, {
        id: uid(), actualMinutes: 0, subtasks: [], updatedAt: Date.now(), ...t,
      }],
    }));
  },
  updateTask(id, u) {
    setState(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...u, updatedAt: Date.now() } : t),
    }));
  },
  deleteTask(id) {
    setState(s => ({
      tasks: s.tasks.filter(t => t.id !== id),
      selectedTask: s.selectedTask === id ? null : s.selectedTask,
      inspectorOpen: s.selectedTask === id ? false : s.inspectorOpen,
      timerRunning: s.timerTaskId === id ? false : s.timerRunning,
      timerTaskId: s.timerTaskId === id ? null : s.timerTaskId,
    }));
  },
  addSubtask(tid, st) {
    setState(s => ({
      tasks: s.tasks.map(t =>
        t.id === tid ? { ...t, subtasks: [...(t.subtasks || []), { id: uid(), ...st }] } : t
      ),
    }));
  },
  toggleSubtask(tid, sid) {
    setState(s => ({
      tasks: s.tasks.map(t =>
        t.id !== tid ? t : {
          ...t,
          subtasks: t.subtasks.map(s2 =>
            s2.id === sid ? { ...s2, completed: !s2.completed } : s2
          ),
        }
      ),
    }));
  },
  deleteSubtask(tid, sid) {
    setState(s => ({
      tasks: s.tasks.map(t =>
        t.id !== tid ? t : { ...t, subtasks: t.subtasks.filter(s2 => s2.id !== sid) }
      ),
    }));
  },
  selectTask(id) { setState({ selectedTask: id, inspectorOpen: !!id }); },
  closeInspector() { setState({ selectedTask: null, inspectorOpen: false }); },
  setView(v) { setState({ view: v }); },
  setDate(d) { setState({ selectedDate: d }); },
  setBoardView(b) { setState({ boardView: b }); },
  openCreate() { setState({ createOpen: true }); },
  closeCreate() { setState({ createOpen: false }); },
  toggleCmd() { setState(s => ({ cmdOpen: !s.cmdOpen })); },
  closeCmd() { setState({ cmdOpen: false }); },

  // --- TIMER ---
  startTimer(taskId) {
    // commit any running elapsed first
    A._commitElapsed();
    const task = getState().tasks.find(t => t.id === taskId);
    const mins = task?.estimatedMinutes || 25;
    const ms = mins * 60000;
    setState({
      timerRunning: true,
      timerTaskId: taskId,
      timerRemaining: ms,
      timerTotal: ms,
      timerStartedAt: Date.now(),
      timerMinimized: false,
    });
  },
  pauseTimer() {
    const s = getState();
    if (!s.timerRunning || !s.timerStartedAt) return;
    const elapsed = Date.now() - s.timerStartedAt;
    const remaining = Math.max(0, s.timerRemaining - elapsed);
    setState({ timerRunning: false, timerRemaining: remaining, timerStartedAt: null });
  },
  resumeTimer() {
    const s = getState();
    if (s.timerRunning || !s.timerTaskId) return;
    setState({ timerRunning: true, timerStartedAt: Date.now() });
  },
  stopTimer() {
    A._commitElapsed();
    setState({
      timerRunning: false,
      timerTaskId: null,
      timerRemaining: 0,
      timerTotal: 0,
      timerStartedAt: null,
      timerMinimized: false,
      deepFocus: false,
    });
  },
  addTimerTime(mins) {
    setState(s => ({
      timerRemaining: s.timerRemaining + mins * 60000,
      timerTotal: s.timerTotal + mins * 60000,
    }));
  },
  toggleMinimized() { setState(s => ({ timerMinimized: !s.timerMinimized })); },
  toggleDeepFocus() { setState(s => ({ deepFocus: !s.deepFocus })); },
  _commitElapsed() {
    const s = getState();
    if (!s.timerTaskId) return;
    const elapsed = s.timerRunning && s.timerStartedAt
      ? Date.now() - s.timerStartedAt
      : s.timerTotal - s.timerRemaining;
    const mins = Math.floor(elapsed / 60000);
    if (mins <= 0) return;
    const task = s.tasks.find(t => t.id === s.timerTaskId);
    if (task) A.updateTask(s.timerTaskId, { actualMinutes: (task.actualMinutes || 0) + mins });
  },
};

// ==================== ICONS ====================
const Icon = ({ d, size = 14, color = "currentColor", fill = "none", sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  cal: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
  timer: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"],
  chart: ["M18 20V10M12 20V4M6 20v-6"],
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  circle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  checkC: ["M22 11.08V12a10 10 0 11-5.93-9.14", "M22 4L12 14.01l-3-3"],
  trash: ["M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"],
  play: "M5 3l14 9-14 9V3z",
  pause: ["M6 4h4v16H6zM14 4h4v16h-4z"],
  stop: "M3 3h18v18H3z",
  chL: "M15 18l-6-6 6-6",
  chR: "M9 18l6-6-6-6",
  search: ["M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"],
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  grip: ["M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"],
  cols: ["M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M9 3v18M15 3v18"],
  moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  min: "M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3",
  max: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3",
};

// ==================== BASE UI ====================
function Btn({ children, variant = "primary", size = "md", onClick, style: extra = {}, disabled }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.12s", opacity: disabled ? 0.45 : 1, outline: "none", userSelect: "none",
    whiteSpace: "nowrap",
  };
  const sizeMap = {
    sm: { padding: "3px 10px", fontSize: 12, borderRadius: 6 },
    md: { padding: "6px 14px", fontSize: 13, borderRadius: 8 },
    lg: { padding: "9px 22px", fontSize: 14, borderRadius: 10 },
    icon: { padding: "6px", fontSize: 13, borderRadius: 7, aspectRatio: "1" },
  };
  const varMap = {
    primary: { background: hov ? C.accentHover || "#7e7eff" : C.accent, color: "#fff" },
    ghost: { background: hov ? C.hover : "transparent", color: hov ? C.text : C.muted },
    outline: { background: hov ? C.hover : "transparent", color: C.text, border: `1px solid ${C.border}` },
    danger: { background: hov ? "rgba(232,64,64,0.22)" : C.redDim, color: C.red, border: `1px solid rgba(232,64,64,0.3)` },
    success: { background: hov ? "rgba(45,186,110,0.22)" : C.greenDim, color: C.green, border: `1px solid rgba(45,186,110,0.3)` },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...sizeMap[size], ...varMap[variant], ...extra }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, style: extra = {}, type = "text", onKeyDown, autoFocus }) {
  const [foc, setFoc] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      onKeyDown={onKeyDown} autoFocus={autoFocus}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        background: C.card, border: `1px solid ${foc ? C.accent : C.border}`,
        color: C.text, borderRadius: 8, padding: "7px 12px", fontSize: 13,
        fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
        transition: "border-color 0.15s", ...extra
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, style: extra = {} }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        background: C.card, border: `1px solid ${foc ? C.accent : C.border}`,
        color: C.text, borderRadius: 8, padding: "7px 12px", fontSize: 13,
        fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
        resize: "vertical", transition: "border-color 0.15s", ...extra
      }}
    />
  );
}

function Select({ value, onChange, options, style: extra = {} }) {
  const [foc, setFoc] = useState(false);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        background: C.card, border: `1px solid ${foc ? C.accent : C.border}`,
        color: C.text, borderRadius: 8, padding: "7px 12px", fontSize: 13,
        fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
        cursor: "pointer", transition: "border-color 0.15s", ...extra
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      background: bg || C.active, color: color || C.muted, borderRadius: 5,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = C.accent, height = 3 }) {
  return (
    <div style={{ background: C.active, borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`, height: "100%",
        background: color, borderRadius: 99, transition: "width 0.4s"
      }} />
    </div>
  );
}

function Lbl({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em",
    textTransform: "uppercase", marginBottom: 6
  }}>{children}</div>;
}

// ==================== LIVE TIMER HOOK ====================
// Returns live remaining ms, always accurate
function useLiveRemaining() {
  const timerRunning = useStore(s => s.timerRunning);
  const timerRemaining = useStore(s => s.timerRemaining);
  const timerStartedAt = useStore(s => s.timerStartedAt);
  const [live, setLive] = useState(timerRemaining);

  useEffect(() => {
    if (!timerRunning || !timerStartedAt) {
      setLive(timerRemaining);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - timerStartedAt;
      const rem = Math.max(0, timerRemaining - elapsed);
      setLive(rem);
      if (rem <= 0) A.stopTimer();
    };
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [timerRunning, timerRemaining, timerStartedAt]);

  return live;
}

// ==================== SIDEBAR ====================
function Sidebar() {
  const view = useStore(s => s.view);
  const [col, setCol] = useState(false);
  const nav = [
    { id: "dashboard", icon: I.home, label: "Dashboard" },
    { id: "weekly", icon: I.cal, label: "Planner" },
    { id: "focus", icon: I.timer, label: "Focus" },
    { id: "analytics", icon: I.chart, label: "Analytics" },
  ];
  return (
    <div style={{
      width: col ? 52 : 200, background: C.panel, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      transition: "width 0.18s cubic-bezier(.4,0,.2,1)", overflow: "hidden"
    }}>
      {/* header */}
      <div style={{
        minHeight: 52, padding: col ? "14px 0" : "14px 12px", display: "flex",
        alignItems: "center", justifyContent: col ? "center" : "space-between",
        borderBottom: `1px solid ${C.border}`
      }}>
        {!col && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, background: C.accent, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon d={I.zap} size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>ProdOS</span>
          </div>
        )}
        <SideBtn onClick={() => setCol(x => !x)} title={col ? "Expand" : "Collapse"}>
          <Icon d={col ? I.chR : I.chL} size={14} color={C.dim} />
        </SideBtn>
      </div>
      {/* nav */}
      <div style={{ flex: 1, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => {
          const active = view === item.id;
          return (
            <NavBtn key={item.id} active={active} collapsed={col}
              onClick={() => A.setView(item.id)} title={col ? item.label : ""}>
              <Icon d={item.icon} size={15} color="currentColor" />
              {!col && item.label}
            </NavBtn>
          );
        })}
      </div>
      {/* user */}
      <div style={{ padding: "8px 6px", borderTop: `1px solid ${C.border}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: col ? "9px" : "9px 10px", borderRadius: 8, justifyContent: col ? "center" : "flex-start"
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "linear-gradient(135deg,#6c6cff,#a040ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0
          }}>U</div>
          {!col && <span style={{ fontSize: 12, color: C.muted }}>User</span>}
        </div>
      </div>
    </div>
  );
}

function SideBtn({ children, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.hover : "none", border: "none", cursor: "pointer",
        color: hov ? C.text : C.dim, padding: 6, borderRadius: 6, display: "flex",
        alignItems: "center", transition: "all 0.12s"
      }}>
      {children}
    </button>
  );
}

function NavBtn({ children, active, collapsed, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "9px" : "9px 10px",
        borderRadius: 8, border: "none", cursor: "pointer",
        background: active ? C.accentDim : hov ? C.hover : "transparent",
        color: active ? C.accent : hov ? C.text : C.muted,
        fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 400,
        transition: "all 0.1s", justifyContent: collapsed ? "center" : "flex-start",
        width: "100%"
      }}>
      {children}
    </button>
  );
}

// ==================== TOPBAR ====================
function TopBar({ title, right }) {
  const timerTaskId = useStore(s => s.timerTaskId);
  const timerRunning = useStore(s => s.timerRunning);
  const tasks = useStore(s => s.tasks);
  const live = useLiveRemaining();
  const timerTask = timerTaskId ? tasks.find(t => t.id === timerTaskId) : null;

  return (
    <div style={{
      height: 48, background: C.panel, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{title}</span>

      {timerTaskId && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer"
        }}
          onClick={() => setState({ timerMinimized: false })}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: timerRunning ? C.green : C.dim,
            animation: timerRunning ? "pulse 1.5s infinite" : "none"
          }} />
          <span style={{
            fontSize: 12, fontFamily: "monospace", fontWeight: 700,
            color: live < 60000 ? C.red : timerRunning ? C.text : C.muted
          }}>
            {fmtMs(live)}
          </span>
          <span style={{
            fontSize: 11, color: C.muted, maxWidth: 130,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {timerTask?.title}
          </span>
          <Btn variant="ghost" size="icon" onClick={e => { e.stopPropagation(); timerRunning ? A.pauseTimer() : A.resumeTimer(); }}
            style={{ padding: 3 }}>
            <Icon d={timerRunning ? I.pause : I.play} size={11} color={C.muted} />
          </Btn>
          <Btn variant="ghost" size="icon" onClick={e => { e.stopPropagation(); A.stopTimer(); }}
            style={{ padding: 3 }}>
            <Icon d={I.x} size={11} color={C.dim} />
          </Btn>
        </div>
      )}

      <button onClick={A.toggleCmd}
        style={{
          display: "flex", alignItems: "center", gap: 8, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px",
          cursor: "pointer", color: C.muted, fontFamily: "inherit", fontSize: 12
        }}>
        <Icon d={I.search} size={13} color={C.muted} />
        <span>Search</span>
        <span style={{
          background: C.active, padding: "1px 6px", borderRadius: 4,
          fontSize: 10, color: C.dim
        }}>⌘K</span>
      </button>

      {right}
    </div>
  );
}

// ==================== TASK CARD ====================
function TaskCard({ task, compact = false, draggable: drag = false }) {
  const [hov, setHov] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const s = STATUS[task.status] || STATUS.backlog;
  const subs = task.subtasks || [];
  const done = subs.filter(x => x.completed).length;
  const prog = subs.length > 0 ? (done / subs.length) * 100 : 0;

  return (
    <div
      draggable={drag}
      onDragStart={drag ? e => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.style.opacity = "0.4";
      } : undefined}
      onDragEnd={drag ? e => { e.currentTarget.style.opacity = "1"; } : undefined}
      onClick={() => A.selectTask(task.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.hover : C.card,
        border: `1px solid ${hov ? C.borderHi : C.border}`,
        borderRadius: 10, padding: compact ? "10px 12px" : "12px 14px",
        cursor: "pointer", transition: "all 0.12s",
        opacity: task.status === "completed" ? 0.55 : 1
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {drag && (
          <div style={{ color: C.dim, paddingTop: 2 }}>
            <Icon d={I.grip} size={14} color={C.dim} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: task.status === "completed" ? C.dim : C.text,
              textDecoration: task.status === "completed" ? "line-through" : "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1
            }}>
              {task.title}
            </span>
          </div>
          {!compact && task.description && (
            <p style={{
              fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>
              {task.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Badge label={s.label} color={s.color} bg={s.color + "1a"} />
            {task.estimatedMinutes > 0 && (
              <Badge label={fmt(task.estimatedMinutes)} color={C.muted} />
            )}
            {task.actualMinutes > 0 && (
              <Badge label={fmt(task.actualMinutes) + " logged"} color={C.green} bg={C.greenDim} />
            )}
            {subs.length > 0 && (
              <Badge label={done + "/" + subs.length} color={C.muted} />
            )}
          </div>
          {subs.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={prog} color={prog === 100 ? C.green : C.accent} />
            </div>
          )}
        </div>
        {hov && (
          <button onClick={e => { e.stopPropagation(); A.startTimer(task.id); }}
            style={{
              background: C.accentDim, border: "none", borderRadius: 6,
              padding: "4px 9px", cursor: "pointer", color: C.accent,
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap"
            }}>
            <Icon d={I.play} size={10} color={C.accent} fill={C.accent} />Focus
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== FLOATING FOCUS TIMER ====================
function FloatingTimer() {
  const timerTaskId = useStore(s => s.timerTaskId);
  const timerRunning = useStore(s => s.timerRunning);
  const timerTotal = useStore(s => s.timerTotal);
  const timerMinimized = useStore(s => s.timerMinimized);
  const deepFocus = useStore(s => s.deepFocus);
  const tasks = useStore(s => s.tasks);
  const live = useLiveRemaining();

  if (!timerTaskId) return null;

  const task = tasks.find(t => t.id === timerTaskId);
  const progress = timerTotal > 0 ? ((timerTotal - live) / timerTotal) * 100 : 0;
  const isUp = live <= 0;
  const isUrgent = live < 60000 && live > 0;
  const isWarn = live < 300000 && live >= 60000;
  const timerColor = isUp ? C.green : isUrgent ? C.red : isWarn ? C.yellow : C.text;
  const borderColor = isUp ? C.green : isUrgent ? C.red : isWarn ? C.yellow : C.accent;

  return (
    <>
      {/* Deep focus blur backdrop */}
      {deepFocus && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(14,14,16,0.85)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 98
        }}
          onClick={A.toggleDeepFocus}
        />
      )}

      {/* Floating timer card */}
      <div style={{
        position: "fixed",
        left: "50%", top: "50%",          // always vertically + horizontally centered
        bottom: "auto",
        transform: "translate(-50%, -50%)",
        zIndex: 99,
        width: timerMinimized ? "min(360px, calc(100vw - 32px))" : "min(460px, calc(100vw - 32px))",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)"
      }}>
        <div style={{
          background: C.panel, border: `2px solid ${borderColor}40`,
          borderRadius: 16, boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${borderColor}20`,
          overflow: "hidden"
        }}>

          {/* Header row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderBottom: `1px solid ${C.border}`
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: timerRunning ? C.green : C.dim,
              boxShadow: timerRunning ? `0 0 8px ${C.green}` : "none",
              animation: timerRunning ? "pulse 1.5s infinite" : "none", flexShrink: 0
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: C.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {task?.title || "Focus Session"}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {fmt(Math.ceil(timerTotal / 60000))} session
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Btn variant="ghost" size="icon" onClick={A.toggleDeepFocus}
                title={deepFocus ? "Exit deep focus" : "Deep focus"} style={{ padding: 5 }}>
                <Icon d={I.moon} size={13} color={deepFocus ? C.accent : C.dim} />
              </Btn>
              <Btn variant="ghost" size="icon" onClick={A.toggleMinimized}
                title={timerMinimized ? "Expand" : "Minimize"} style={{ padding: 5 }}>
                <Icon d={timerMinimized ? I.max : I.min} size={13} color={C.dim} />
              </Btn>
              <Btn variant="ghost" size="icon" onClick={A.stopTimer}
                title="Stop session" style={{ padding: 5 }}>
                <Icon d={I.x} size={13} color={C.dim} />
              </Btn>
            </div>
          </div>

          {timerMinimized ? (
            /* ---- MINIMIZED STRIP ---- */
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <span style={{
                fontSize: 28, fontFamily: "monospace", fontWeight: 700,
                letterSpacing: "-0.03em", color: timerColor, lineHeight: 1
              }}>
                {fmtMs(live)}
              </span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={progress} color={borderColor} height={4} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="primary" size="icon"
                  onClick={timerRunning ? A.pauseTimer : A.resumeTimer} style={{ padding: "6px 10px" }}>
                  <Icon d={timerRunning ? I.pause : I.play} size={13} color="#fff" />
                </Btn>
                <Btn variant="outline" size="icon"
                  onClick={A.stopTimer} style={{ padding: "6px 10px" }}>
                  <Icon d={I.stop} size={13} color={C.text} />
                </Btn>
              </div>
            </div>
          ) : (
            /* ---- EXPANDED CARD ---- */
            <div style={{ padding: "32px 40px 28px", textAlign: "center" }}>
              {/* Big timer */}
              <div style={{
                fontSize: 80, fontFamily: "monospace", fontWeight: 700,
                letterSpacing: "-0.04em", color: timerColor, lineHeight: 1,
                marginBottom: 24,
                textShadow: isUrgent ? `0 0 40px ${C.red}60` : isUp ? `0 0 40px ${C.green}60` : "none",
                transition: "color 0.4s, text-shadow 0.4s"
              }}>
                {fmtMs(live)}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 28 }}>
                <ProgressBar value={progress} color={borderColor} height={5} />
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  marginTop: 6, fontSize: 11, color: C.dim
                }}>
                  <span>{fmt(Math.ceil((timerTotal - live) / 60000))} elapsed</span>
                  <span>{fmt(Math.ceil(live / 60000))} left</span>
                </div>
              </div>

              {/* Done banner */}
              {isUp && (
                <div style={{
                  background: C.greenDim, border: `1px solid ${C.green}40`,
                  borderRadius: 10, padding: "12px 20px", marginBottom: 20,
                  color: C.green, fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                  <Icon d={I.checkC} size={16} color={C.green} />
                  Session complete!
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                <Btn variant="primary" size="lg"
                  onClick={timerRunning ? A.pauseTimer : A.resumeTimer}>
                  <Icon d={timerRunning ? I.pause : I.play} size={16} color="#fff"
                    fill={timerRunning ? "none" : "#fff"} />
                  {timerRunning ? "Pause" : "Resume"}
                </Btn>
                <Btn variant="outline" size="lg" onClick={A.stopTimer}>
                  <Icon d={I.stop} size={16} color={C.text} />
                  Complete
                </Btn>
              </div>

              {/* Add time */}
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Add more time</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  {[5, 10, 15, 25].map(m => (
                    <button key={m} onClick={() => A.addTimerTime(m)}
                      style={{
                        background: C.active, border: `1px solid ${C.border}`,
                        color: C.muted, borderRadius: 7, padding: "5px 12px",
                        cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                        transition: "all 0.12s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = C.muted; }}>
                      +{m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== WEEKLY VIEW ====================
function WeeklyView() {
  const tasks = useStore(s => s.tasks);
  const selectedDate = useStore(s => s.selectedDate);
  const boardView = useStore(s => s.boardView);
  const weekDays = useMemo(() => getWeekDays(), []);
  const dayTasks = useMemo(() =>
    tasks.filter(t => t.dueDate === selectedDate), [tasks, selectedDate]);
  const selDay = weekDays.find(d => d.date === selectedDate);

  if (boardView) return <BoardView />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TopBar title="Planner" right={
        <>
          <div style={{
            display: "flex", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 8, overflow: "hidden"
          }}>
            {[{ label: "List", b: false }, { label: "Board", b: true }].map(({ label, b }) => (
              <button key={label} onClick={() => A.setBoardView(b)}
                style={{
                  padding: "5px 14px", border: "none", cursor: "pointer",
                  background: boardView === b ? C.accent : "transparent",
                  color: boardView === b ? "#fff" : C.muted,
                  fontSize: 12, fontFamily: "inherit", fontWeight: 500
                }}>
                {label}
              </button>
            ))}
          </div>
          <Btn onClick={A.openCreate}>
            <Icon d={I.plus} size={13} color="#fff" />New Task
          </Btn>
        </>
      } />

      <div style={{
        flex: 1, overflow: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 16
      }}>
        {/* Week strip */}
        <div style={{ display: "flex", gap: 6 }}>
          {weekDays.map(day => {
            const cnt = tasks.filter(t => t.dueDate === day.date).length;
            const done = tasks.filter(t => t.dueDate === day.date && t.status === "completed").length;
            const sel = selectedDate === day.date;
            return (
              <div key={day.date} onClick={() => A.setDate(day.date)}
                style={{
                  flex: 1, background: sel ? C.accent : C.card,
                  border: `1px solid ${sel ? C.accent : day.isToday ? C.borderHi : C.border}`,
                  borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                  textAlign: "center", transition: "all 0.15s",
                  opacity: day.isWeekend && !sel ? 0.55 : 1
                }}>
                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: sel ? "rgba(255,255,255,0.65)" : C.dim,
                  letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2
                }}>
                  {day.short}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                  color: sel ? "#fff" : day.isToday ? C.accent : C.text
                }}>
                  {day.num}
                </div>
                {cnt > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 6 }}>
                    {Array.from({ length: Math.min(cnt, 5) }).map((_, i) => (
                      <div key={i} style={{
                        width: 4, height: 4, borderRadius: "50%",
                        background: i < done
                          ? (sel ? "rgba(255,255,255,0.6)" : C.green)
                          : (sel ? "rgba(255,255,255,0.3)" : C.dim)
                      }} />
                    ))}
                  </div>
                )}
                {day.isToday && !sel && (
                  <div style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: C.accent, margin: "4px auto 0"
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Day header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            {selDay ? selDay.short + ", " + selDay.month + " " + selDay.num : ""}
            <span style={{ fontSize: 11, color: C.dim, marginLeft: 8 }}>
              {dayTasks.length} tasks
            </span>
          </div>
          {dayTasks.length > 0 && (
            <span style={{ fontSize: 11, color: C.muted }}>
              {dayTasks.filter(t => t.status === "completed").length} done
            </span>
          )}
        </div>

        {/* Task list */}
        {dayTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ marginBottom: 12, opacity: 0.25 }}>
              <Icon d={I.cal} size={40} color={C.muted} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 6 }}>
              No tasks for this day
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>
              Plan your day by adding tasks
            </div>
            <Btn variant="outline" onClick={A.openCreate}>
              <Icon d={I.plus} size={13} />Add Task
            </Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </div>
      <CreateDialog />
    </div>
  );
}

// ==================== BOARD VIEW ====================
function BoardView() {
  const tasks = useStore(s => s.tasks);
  const [dropTarget, setDropTarget] = useState(null);
  const cols = [
    { id: "backlog", label: "Backlog" },
    { id: "planned", label: "Planned" },
    { id: "in-progress", label: "In Progress" },
    { id: "focus", label: "Focus" },
    { id: "completed", label: "Done" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TopBar title="Board" right={
        <>
          <div style={{
            display: "flex", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 8, overflow: "hidden"
          }}>
            {[{ label: "List", b: false }, { label: "Board", b: true }].map(({ label, b }) => (
              <button key={label} onClick={() => A.setBoardView(b)}
                style={{
                  padding: "5px 14px", border: "none", cursor: "pointer",
                  background: b ? C.accent : "transparent",
                  color: b ? "#fff" : C.muted,
                  fontSize: 12, fontFamily: "inherit", fontWeight: 500
                }}>
                {label}
              </button>
            ))}
          </div>
          <Btn onClick={A.openCreate}>
            <Icon d={I.plus} size={13} color="#fff" />New Task
          </Btn>
        </>
      } />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", gap: 12 }}>
        {cols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const s = STATUS[col.id];
          const over = dropTarget === col.id;
          return (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); setDropTarget(col.id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={e => {
                const id = e.dataTransfer.getData("taskId");
                if (id) A.updateTask(id, { status: col.id });
                setDropTarget(null);
              }}
              style={{
                flexShrink: 0, width: 260,
                background: over ? C.hover : C.panel,
                border: `1px solid ${over ? C.borderHi : C.border}`,
                borderRadius: 12, display: "flex", flexDirection: "column",
                transition: "all 0.15s", maxHeight: "calc(100vh - 120px)"
              }}>
              <div style={{
                padding: "12px 14px 10px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{col.label}</span>
                </div>
                <span style={{
                  fontSize: 11, color: C.dim, background: C.active,
                  padding: "2px 8px", borderRadius: 99
                }}>{colTasks.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {colTasks.map(t => <TaskCard key={t.id} task={t} compact draggable />)}
                  {colTasks.length === 0 && (
                    <div style={{
                      textAlign: "center", padding: "28px 0",
                      color: C.dim, fontSize: 12, border: `1px dashed ${C.border}`,
                      borderRadius: 8, marginTop: 2
                    }}>
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <CreateDialog />
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardView() {
  const tasks = useStore(s => s.tasks);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "completed").length;
  const active = tasks.filter(t => t.status === "in-progress" || t.status === "focus").length;
  const mins = tasks.reduce((a, t) => a + (t.actualMinutes || 0), 0);
  const stats = [
    { label: "Total", val: total, color: C.accent },
    { label: "Completed", val: done, color: C.green },
    { label: "Active", val: active, color: C.orange },
    { label: "Time Logged", val: fmt(mins) || "—", color: C.yellow },
  ];
  const recent = [...tasks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TopBar title="Dashboard" right={
        <Btn onClick={A.openCreate}>
          <Icon d={I.plus} size={13} color="#fff" />New Task
        </Btn>
      } />
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {stats.map(st => (
            <div key={st.label} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "16px 18px"
            }}>
              <div style={{
                fontSize: 11, color: C.muted, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8
              }}>
                {st.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: st.color, lineHeight: 1 }}>
                {st.val}
              </div>
            </div>
          ))}
        </div>
        {total > 0 && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "16px 18px", marginBottom: 20
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 10
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Overall Progress</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>
                {Math.round((done / total) * 100)}%
              </span>
            </div>
            <ProgressBar value={(done / total) * 100} height={6} />
          </div>
        )}
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 12
        }}>Recent Tasks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
      <CreateDialog />
    </div>
  );
}

// ==================== FOCUS VIEW ====================
function FocusView() {
  const tasks = useStore(s => s.tasks);
  const timerTaskId = useStore(s => s.timerTaskId);
  const timerRunning = useStore(s => s.timerRunning);
  const timerTotal = useStore(s => s.timerTotal);
  const live = useLiveRemaining();
  const active = tasks.filter(t =>
    t.status === "in-progress" || t.status === "focus" || t.status === "planned");
  const progress = timerTotal > 0 ? ((timerTotal - live) / timerTotal) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TopBar title="Focus" />
      <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", gap: 20 }}>
        {/* Timer panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "40px", textAlign: "center"
          }}>
            {timerTaskId ? (
              <>
                <div style={{
                  fontSize: 11, color: C.muted, letterSpacing: "0.07em",
                  textTransform: "uppercase", marginBottom: 8
                }}>Now focusing</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 28 }}>
                  {tasks.find(t => t.id === timerTaskId)?.title}
                </div>
                <div style={{
                  fontSize: 72, fontFamily: "monospace", fontWeight: 700,
                  letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 24,
                  color: live < 60000 ? C.red : live <= 0 ? C.green : C.text
                }}>
                  {fmtMs(live)}
                </div>
                <div style={{ marginBottom: 28, padding: "0 30px" }}>
                  <ProgressBar value={progress} height={5} />
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    marginTop: 6, fontSize: 11, color: C.dim
                  }}>
                    <span>0:00</span>
                    <span>{fmt(Math.ceil(timerTotal / 60000))}</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                  <Btn variant="primary" size="lg"
                    onClick={timerRunning ? A.pauseTimer : A.resumeTimer}>
                    <Icon d={timerRunning ? I.pause : I.play} size={15} color="#fff" />
                    {timerRunning ? "Pause" : "Resume"}
                  </Btn>
                  <Btn variant="outline" size="lg" onClick={A.stopTimer}>
                    <Icon d={I.stop} size={15} />Complete
                  </Btn>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  {[5, 10, 15, 25].map(m => (
                    <button key={m} onClick={() => A.addTimerTime(m)}
                      style={{
                        background: C.active, border: `1px solid ${C.border}`,
                        color: C.muted, borderRadius: 7, padding: "5px 12px",
                        cursor: "pointer", fontSize: 12, fontFamily: "inherit"
                      }}>
                      +{m}m
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16, opacity: 0.2 }}>
                  <Icon d={I.timer} size={52} color={C.muted} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                  No active session
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  Pick a task on the right to start
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task picker */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em",
            textTransform: "uppercase", marginBottom: 12
          }}>Pick a Task</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {active.map(t => (
              <div key={t.id} onClick={() => A.startTimer(t.id)}
                style={{
                  background: timerTaskId === t.id ? C.accentDim : C.card,
                  border: `1px solid ${timerTaskId === t.id ? C.accent : C.border}`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                  transition: "all 0.12s"
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: PRIORITY[t.priority]?.dot || C.muted
                  }} />
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 500, color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: 11, color: C.dim }}>{fmt(t.estimatedMinutes)}</span>
                </div>
              </div>
            ))}
            {active.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.dim, fontSize: 12 }}>
                No active tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ANALYTICS VIEW ====================
function AnalyticsView() {
  const tasks = useStore(s => s.tasks);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TopBar title="Analytics" />
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <BarBlock title="By Priority" items={
            Object.entries(PRIORITY).map(([k, v]) => ({
              label: v.label,
              count: tasks.filter(t => t.priority === k).length,
              color: v.dot,
            }))
          } total={tasks.length} />
          <BarBlock title="By Status" items={
            Object.entries(STATUS).map(([k, v]) => ({
              label: v.label,
              count: tasks.filter(t => t.status === k).length,
              color: v.color,
            }))
          } total={tasks.length} />
        </div>
      </div>
    </div>
  );
}

function BarBlock({ title, items, total }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "18px"
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em",
        textTransform: "uppercase", marginBottom: 16
      }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text }}>{item.label}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{item.count}</span>
            </div>
            <ProgressBar value={total ? (item.count / total) * 100 : 0} color={item.color} height={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== TASK INSPECTOR ====================
function TaskInspector() {
  const inspectorOpen = useStore(s => s.inspectorOpen);
  const selectedTask = useStore(s => s.selectedTask);
  const tasks = useStore(s => s.tasks);
  const [newSub, setNewSub] = useState("");

  if (!inspectorOpen) return null;
  const task = tasks.find(t => t.id === selectedTask);
  if (!task) return null;

  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const subs = task.subtasks || [];
  const done = subs.filter(s => s.completed).length;

  const addSub = () => {
    if (!newSub.trim()) return;
    A.addSubtask(task.id, { title: newSub.trim(), completed: false, estimatedMinutes: 15, actualMinutes: 0 });
    setNewSub("");
  };

  return (
    <div style={{
      width: 340, background: C.panel, borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "flex-start", gap: 10
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: p.dot, flexShrink: 0
            }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
              {task.title}
            </span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <Badge label={STATUS[task.status]?.label || task.status}
              color={STATUS[task.status]?.color} bg={STATUS[task.status]?.color + "1a"} />
            <Badge label={p.label} color={p.color} bg={p.bg} />
          </div>
        </div>
        <Btn variant="ghost" size="icon" onClick={A.closeInspector} style={{ padding: 5, flexShrink: 0 }}>
          <Icon d={I.x} size={14} color={C.dim} />
        </Btn>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <Lbl>Description</Lbl>
          <Textarea value={task.description || ""}
            onChange={e => A.updateTask(task.id, { description: e.target.value })}
            placeholder="Add a description…" rows={3} />
        </div>

        {/* Meta selects */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <Lbl>Status</Lbl>
            <Select value={task.status} onChange={v => A.updateTask(task.id, { status: v })}
              options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
          <div>
            <Lbl>Priority</Lbl>
            <Select value={task.priority} onChange={v => A.updateTask(task.id, { priority: v })}
              options={Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
        </div>

        {/* Time info */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          display: "flex", gap: 20
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>ESTIMATED</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmt(task.estimatedMinutes) || "—"}</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>LOGGED</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{fmt(task.actualMinutes) || "—"}</div>
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Lbl>Subtasks {subs.length > 0 && "(" + done + "/" + subs.length + ")"}</Lbl>
          </div>
          {subs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <ProgressBar value={subs.length ? (done / subs.length) * 100 : 0} height={3} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {subs.map(s => (
              <SubtaskRow key={s.id} s={s} taskId={task.id} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Input value={newSub} onChange={e => setNewSub(e.target.value)}
              placeholder="Add subtask…"
              onKeyDown={e => e.key === "Enter" && addSub()} />
            <Btn onClick={addSub} size="icon">
              <Icon d={I.plus} size={13} color="#fff" />
            </Btn>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8
      }}>
        <Btn onClick={() => A.startTimer(task.id)} style={{ flex: 1 }}>
          <Icon d={I.play} size={13} color="#fff" fill="#fff" />Start Focus
        </Btn>
        <Btn variant="danger" size="icon"
          onClick={() => { if (window.confirm('Delete "' + task.title + '"?')) A.deleteTask(task.id); }}>
          <Icon d={I.trash} size={13} color={C.red} />
        </Btn>
      </div>
    </div>
  );
}

function SubtaskRow({ s, taskId }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
        borderRadius: 7, background: hov ? C.hover : C.card, transition: "background 0.1s"
      }}>
      <button onClick={() => A.toggleSubtask(taskId, s.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: s.completed ? C.green : C.dim, padding: 0, display: "flex", flexShrink: 0
        }}>
        <Icon d={s.completed ? I.checkC : I.circle} size={15}
          color={s.completed ? C.green : C.dim} />
      </button>
      <span style={{
        flex: 1, fontSize: 12,
        color: s.completed ? C.dim : C.text,
        textDecoration: s.completed ? "line-through" : "none"
      }}>
        {s.title}
      </span>
      {s.estimatedMinutes > 0 && (
        <span style={{ fontSize: 11, color: C.dim }}>{fmt(s.estimatedMinutes)}</span>
      )}
      {hov && (
        <button onClick={() => A.deleteSubtask(taskId, s.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.dim, padding: 2, display: "flex"
          }}>
          <Icon d={I.x} size={11} color={C.dim} />
        </button>
      )}
    </div>
  );
}

// ==================== CREATE DIALOG ====================
function CreateDialog() {
  const open = useStore(s => s.createOpen);
  const selDate = useStore(s => s.selectedDate);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [pri, setPri] = useState("medium");
  const [stat, setStat] = useState("planned");
  const [est, setEst] = useState("25");
  const [date, setDate] = useState(selDate);

  useEffect(() => { if (open) setDate(selDate); }, [open, selDate]);
  useEffect(() => {
    if (!open) return;
    const fn = e => { if (e.key === "Escape") A.closeCreate(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  if (!open) return null;

  const create = () => {
    if (!title.trim()) return;
    A.addTask({
      title: title.trim(), description: desc, priority: pri,
      status: stat, estimatedMinutes: parseInt(est) || 25, dueDate: date
    });
    setTitle(""); setDesc(""); setPri("medium"); setStat("planned"); setEst("25");
    A.closeCreate();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 90, backdropFilter: "blur(6px)"
    }}
      onClick={e => { if (e.target === e.currentTarget) A.closeCreate(); }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.borderHi}`,
        borderRadius: 16, padding: "24px", width: 460,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>New Task</span>
          <Btn variant="ghost" size="icon" onClick={A.closeCreate} style={{ padding: 5 }}>
            <Icon d={I.x} size={15} color={C.dim} />
          </Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Lbl>Title</Lbl>
            <Input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?" autoFocus
              onKeyDown={e => e.key === "Enter" && create()} />
          </div>
          <div>
            <Lbl>Description</Lbl>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Add details…" rows={2} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Lbl>Priority</Lbl>
              <Select value={pri} onChange={setPri} options={[
                { value: "urgent", label: "🔴 Urgent" },
                { value: "high", label: "🟠 High" },
                { value: "medium", label: "🟡 Medium" },
                { value: "low", label: "🔵 Low" },
              ]} />
            </div>
            <div>
              <Lbl>Status</Lbl>
              <Select value={stat} onChange={setStat} options={[
                { value: "backlog", label: "Backlog" },
                { value: "planned", label: "Planned" },
                { value: "in-progress", label: "In Progress" },
              ]} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Lbl>Due Date</Lbl>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Lbl>Estimate (min)</Lbl>
              <Input type="number" value={est} onChange={e => setEst(e.target.value)}
                placeholder="25" style={{ textAlign: "right" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={A.closeCreate}>Cancel</Btn>
          <Btn onClick={create} disabled={!title.trim()}>Create Task</Btn>
        </div>
      </div>
    </div>
  );
}

// ==================== COMMAND PALETTE ====================
function CommandPalette() {
  const open = useStore(s => s.cmdOpen);
  const tasks = useStore(s => s.tasks);
  const [q, setQ] = useState("");

  useEffect(() => { if (!open) setQ(""); }, [open]);
  useEffect(() => {
    const fn = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); A.toggleCmd(); }
      if (e.key === "Escape") A.closeCmd();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  if (!open) return null;

  const hits = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    : tasks.slice(0, 6);

  const navItems = [
    { label: "Dashboard", id: "dashboard" },
    { label: "Planner", id: "weekly" },
    { label: "Focus", id: "focus" },
    { label: "Analytics", id: "analytics" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: "14vh", zIndex: 200, backdropFilter: "blur(6px)"
    }}
      onClick={e => { if (e.target === e.currentTarget) A.closeCmd(); }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.borderHi}`,
        borderRadius: 14, width: 520, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderBottom: `1px solid ${C.border}`
        }}>
          <Icon d={I.search} size={16} color={C.muted} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search tasks or navigate…" autoFocus
            style={{
              flex: 1, background: "none", border: "none", color: C.text,
              fontSize: 14, fontFamily: "inherit", outline: "none"
            }} />
          <span style={{
            background: C.active, padding: "2px 7px", borderRadius: 4,
            fontSize: 11, color: C.dim
          }}>ESC</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {!q && (
            <Section label="Navigate">
              {navItems.map(item => (
                <CmdRow key={item.id}
                  onClick={() => { A.setView(item.id); A.closeCmd(); }}>
                  {item.label}
                </CmdRow>
              ))}
            </Section>
          )}
          {hits.length > 0 && (
            <Section label="Tasks">
              {hits.map(t => (
                <CmdRow key={t.id}
                  onClick={() => { A.selectTask(t.id); A.closeCmd(); }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: PRIORITY[t.priority]?.dot || C.muted, flexShrink: 0
                  }} />
                  <span style={{
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>{t.title}</span>
                  <Badge label={STATUS[t.status]?.label || t.status}
                    color={STATUS[t.status]?.color} />
                </CmdRow>
              ))}
            </Section>
          )}
          {q && hits.length === 0 && (
            <div style={{
              padding: "28px", textAlign: "center",
              color: C.dim, fontSize: 13
            }}>
              No results for "{q}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ padding: "8px 8px 4px" }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: C.dim,
        letterSpacing: "0.08em", padding: "4px 8px", marginBottom: 2
      }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function CmdRow({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 10px", borderRadius: 8, border: "none",
        background: hov ? C.hover : "none", cursor: "pointer",
        color: hov ? C.text : C.muted, fontSize: 13,
        fontFamily: "inherit", textAlign: "left", transition: "all 0.1s"
      }}>
      {children}
    </button>
  );
}

// ==================== ROOT APP ====================
export default function App() {
  const view = useStore(s => s.view);
  const inspectorOpen = useStore(s => s.inspectorOpen);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView />;
      case "weekly": return <WeeklyView />;
      case "focus": return <FocusView />;
      case "analytics": return <AnalyticsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div style={{
      display: "flex", height: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", overflow: "hidden"
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderHi}; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5) brightness(0.8); }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        ::placeholder { color: ${C.dim}; }
        option { background: ${C.card}; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {renderView()}
          </div>
          {inspectorOpen && <TaskInspector />}
        </div>
      </div>

      {/* Global overlays */}
      <FloatingTimer />
      <CommandPalette />
    </div>
  );
}