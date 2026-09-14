import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { localDateKey } from "./date";
import QuickDock from "./QuickDock";
import { CalendarPanel, ScheduleEditor, ScheduleWidget } from "./Schedule";
import { readStored, writeStored } from "./storage";
import type { AppSettings, QuickLink, ScheduleItem, SearchEngine, TodayTask } from "./types";

const keys = { tasks: "stillpage.tasks", legacyLinks: "stillpage.links", links: "stillpage.quickLinks", settings: "stillpage.settings", schedules: "stillpage.schedules" } as const;
const initialTasks: TodayTask[] = [{ id: "figure-3", text: "Finish Figure 3", completed: false }, { id: "review-pr", text: "Review PR", completed: false }, { id: "workout", text: "健身 30 分钟", completed: false }];
const initialLinks: QuickLink[] = [
  { id: "github", title: "GitHub", url: "https://github.com", icon: "GH", order: 0 }, { id: "chatgpt", title: "ChatGPT", url: "https://chatgpt.com", icon: "✦", order: 1 }, { id: "gmail", title: "Gmail", url: "https://mail.google.com", icon: "M", order: 2 }, { id: "youtube", title: "YouTube", url: "https://youtube.com", icon: "▶", order: 3 }, { id: "notion", title: "Notion", url: "https://notion.so", icon: "N", order: 4 }, { id: "drive", title: "Drive", url: "https://drive.google.com", icon: "△", order: 5 }
];
const defaultSettings: AppSettings = { engine: "google", foregroundMode: "light", fontOpacity: 0.96, brightness: 0.92, showToday: true, showDock: true, showSchedule: true, schedule: { viewMode: "daily" } };
const dailyMessages = [
  { lines: ["A calmer mind", "builds a brighter day."], subtitle: "把重要的事，放在今天。" },
  { lines: ["Begin with one", "quiet intention."], subtitle: "慢一点，也是在前进。" },
  { lines: ["Make room", "for what matters."], subtitle: "给真正重要的事留一点空间。" },
  { lines: ["Small steps", "still move you forward."], subtitle: "今天的一小步，也算数。" },
  { lines: ["Let the day", "arrive gently."], subtitle: "不必急着成为更好的人。" },
  { lines: ["Clarity begins", "with a pause."], subtitle: "停一停，答案会慢慢浮现。" },
  { lines: ["One thing", "at a time."], subtitle: "专注眼前，就已经很好。" },
  { lines: ["There is time", "for a good day."], subtitle: "今天，可以从容一点。" },
  { lines: ["Keep a little", "space for wonder."], subtitle: "为意外的美好留一点余地。" },
  { lines: ["A gentle pace", "is still a pace."], subtitle: "不慌不忙，也能抵达远方。" },
  { lines: ["Your attention", "is a quiet power."], subtitle: "把注意力交给真正值得的事。" },
  { lines: ["Today is enough", "to begin again."], subtitle: "今天，就是新的开始。" }
];

function normalizeUrl(value: string) { return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
function isUrl(value: string) { return /^(https?:\/\/|localhost(?::\d+)?(?:\/|$)|(?:[\w-]+\.)+[a-z]{2,}(?:\/|$))/i.test(value); }
function formatClock(date: Date) { return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date); }
function formatDate(date: Date) { return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date); }
function formatRemaining(total: number) { return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`; }
function messageForDate(date: string) { const [year, month, day] = date.split("-").map(Number); return dailyMessages[Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) % dailyMessages.length]; }
function normalizeLinks(value: unknown): QuickLink[] {
  if (!Array.isArray(value)) return initialLinks;
  return value.map((entry: Record<string, unknown>, index) => ({ id: String(entry.id ?? crypto.randomUUID()), title: String(entry.title ?? entry.label ?? "Link"), url: String(entry.url ?? ""), icon: typeof entry.icon === "string" ? entry.icon : typeof entry.glyph === "string" ? entry.glyph : undefined, order: typeof entry.order === "number" ? entry.order : index })).sort((a, b) => a.order - b.order);
}
function normalizeSettings(value: Partial<AppSettings>): AppSettings { return { ...defaultSettings, ...value, schedule: { ...defaultSettings.schedule, ...value.schedule } }; }

function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="5.8"/><path d="m15.1 15.1 4.2 4.2"/></svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z"/><path d="M19.4 13.4a7.6 7.6 0 0 0 .1-1.4 7.6 7.6 0 0 0-.1-1.4l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.4-1.4L14.3 2h-4l-.4 3.2a7.7 7.7 0 0 0-2.4 1.4l-2.4-1-2 3.5 2 1.5A7.6 7.6 0 0 0 5 12c0 .5 0 .9.1 1.4l-2 1.5 2 3.5 2.4 1a7.7 7.7 0 0 0 2.4 1.4l.4 3.2h4l.4-3.2a7.7 7.7 0 0 0 2.4-1.4l2.4 1 2-3.5-2.1-1.5Z"/></svg>; }

function LinkDialog({ link, onSave, onClose }: { link?: QuickLink; onSave: (title: string, url: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(link?.title ?? ""); const [url, setUrl] = useState(link?.url ?? "");
  function submit(event: FormEvent) { event.preventDefault(); if (title.trim() && url.trim()) onSave(title.trim(), normalizeUrl(url.trim())); }
  return <div className="modal-backdrop" role="presentation"><form className="link-dialog" onSubmit={submit}><div className="panel-top"><div><p>{link ? "EDIT QUICK LINK" : "QUICK LINK"}</p><h2>{link ? "Edit link" : "Add link"}</h2></div><button type="button" onClick={onClose} aria-label="关闭">×</button></div><label className="field"><span>名称</span><input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="例如：Linear" /></label><label className="field"><span>网址</span><input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://linear.app" inputMode="url" /></label><button className="primary-button" type="submit">{link ? "Save changes" : "Add link"}</button></form></div>;
}

function App() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => new Date()); const [query, setQuery] = useState(""); const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState(initialTasks); const [links, setLinks] = useState(initialLinks); const [settings, setSettings] = useState(defaultSettings); const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date())); const [showSettings, setShowSettings] = useState(false); const [showCalendar, setShowCalendar] = useState(false);
  const [linkDialog, setLinkDialog] = useState<QuickLink | "new" | null>(null); const [scheduleEditor, setScheduleEditor] = useState<ScheduleItem | "new" | null>(null); const [newTask, setNewTask] = useState(""); const [focusEnd, setFocusEnd] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; action: () => void } | null>(null);
  const secondsLeft = useMemo(() => focusEnd ? Math.max(0, Math.ceil((focusEnd - now.getTime()) / 1000)) : 25 * 60, [focusEnd, now]); const isFocusing = Boolean(focusEnd && secondsLeft > 0);
  const hero = useMemo(() => messageForDate(localDateKey(now)), [now]);

  useEffect(() => { let mounted = true; void (async () => {
    const [storedTasks, storedLinks, legacyLinks, storedSettings, storedSchedules] = await Promise.all([readStored<TodayTask[]>(keys.tasks, initialTasks), readStored<QuickLink[] | null>(keys.links, null), readStored<unknown>(keys.legacyLinks, initialLinks), readStored<Partial<AppSettings>>(keys.settings, defaultSettings), readStored<ScheduleItem[]>(keys.schedules, [])]);
    if (!mounted) return; setTasks(storedTasks); setLinks(normalizeLinks(storedLinks ?? legacyLinks)); setSettings(normalizeSettings(storedSettings)); setSchedules(storedSchedules); setReady(true);
  })(); return () => { mounted = false; }; }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (ready) void writeStored(keys.tasks, tasks); }, [ready, tasks]); useEffect(() => { if (ready) void writeStored(keys.links, links); }, [ready, links]); useEffect(() => { if (ready) void writeStored(keys.settings, settings); }, [ready, settings]); useEffect(() => { if (ready) void writeStored(keys.schedules, schedules); }, [ready, schedules]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable; if (event.key === "Escape") { setShowSettings(false); setShowCalendar(false); setLinkDialog(null); setScheduleEditor(null); setConfirmDelete(null); return; } if (!editing && event.key === "/") { event.preventDefault(); searchRef.current?.focus(); } if (!editing && event.key.toLowerCase() === "f") setFocusEnd(Date.now() + 25 * 60 * 1000); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);

  function openUrl(url: string) { window.location.assign(normalizeUrl(url)); }
  function search(event: FormEvent) { event.preventDefault(); const value = query.trim(); if (!value) return; if (isUrl(value)) { openUrl(value); return; } const endpoints: Record<SearchEngine, string> = { google: "https://www.google.com/search?q=", bing: "https://www.bing.com/search?q=", duckduckgo: "https://duckduckgo.com/?q=" }; window.location.assign(`${endpoints[settings.engine]}${encodeURIComponent(value)}`); }
  function toggleTask(id: string) { setTasks(current => current.map(task => task.id === id ? { ...task, completed: !task.completed } : task)); }
  function addTask(event: FormEvent) { event.preventDefault(); const text = newTask.trim(); if (!text || tasks.filter(task => !task.completed).length >= 3) return; setTasks(current => [...current, { id: crypto.randomUUID(), text, completed: false }]); setNewTask(""); }
  function saveLink(title: string, url: string) { if (linkDialog === "new") setLinks(current => [...current, { id: crypto.randomUUID(), title, url, icon: title.slice(0, 2).toUpperCase(), order: current.length }]); else if (linkDialog) setLinks(current => current.map(link => link.id === linkDialog.id ? { ...link, title, url } : link)); setLinkDialog(null); }
  function saveSchedule(draft: Pick<ScheduleItem, "title" | "date" | "startTime" | "endTime" | "allDay" | "notes">) { const timestamp = Date.now(); if (scheduleEditor === "new") setSchedules(current => [...current, { ...draft, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp }]); else if (scheduleEditor) setSchedules(current => current.map(item => item.id === scheduleEditor.id ? { ...item, ...draft, updatedAt: timestamp } : item)); setSelectedDate(draft.date); setScheduleEditor(null); }
  function requestScheduleDelete(item: ScheduleItem) { setScheduleEditor(null); setConfirmDelete({ label: item.title, action: () => setSchedules(current => current.filter(entry => entry.id !== item.id)) }); }

  return <main className="canvas" data-foreground={settings.foregroundMode} style={{ "--background-brightness": settings.brightness, "--font-opacity": settings.fontOpacity } as CSSProperties}>
    <div className="background" aria-hidden="true" /><div className="wash" aria-hidden="true" /><div className="vignette" aria-hidden="true" />
    <header className="topbar"><div className="brand" aria-label="静页 STILLPAGE">静 页 <span>/</span> S T I L L P A G E</div><button className="icon-button" onClick={() => setShowSettings(true)} aria-label="打开设置" title="设置"><SettingsIcon /></button></header>
    <section className="main-column" aria-label="新标签页内容"><div className="time-block"><time className="time" dateTime={now.toTimeString()}>{formatClock(now)}</time><p className="date">{formatDate(now)}</p><span className="rule" /></div><div className="hero-copy"><h1>{hero.lines[0]}<br />{hero.lines[1]}</h1><p>{hero.subtitle}</p></div><form className="search-shell" onSubmit={search} onClick={() => searchRef.current?.focus()}><SearchIcon /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search or type anything..." aria-label="搜索或输入网址" /><kbd>/</kbd></form>{settings.showToday && <section className="today" aria-labelledby="today-heading"><div className="today-heading"><h2 id="today-heading">TODAY</h2><span>{tasks.filter(task => !task.completed).length}/3</span></div><ul>{tasks.map(task => <li key={task.id} className={task.completed ? "is-complete" : ""}><button onClick={() => toggleTask(task.id)} className="task-check" aria-label={`${task.completed ? "恢复" : "完成"}：${task.text}`}>{task.completed && "✓"}</button><span>{task.text}</span></li>)}</ul>{tasks.filter(task => !task.completed).length < 3 && <form className="add-task" onSubmit={addTask}><input value={newTask} onChange={event => setNewTask(event.target.value)} placeholder="添加一件重要的事" aria-label="添加今日任务" /><button>添加</button></form>}</section>}</section>
    {settings.showSchedule && <ScheduleWidget items={schedules} selectedDate={selectedDate} viewMode={settings.schedule.viewMode} onViewMode={viewMode => setSettings(current => ({ ...current, schedule: { viewMode } }))} onOpenCalendar={() => setShowCalendar(true)} onEdit={item => setScheduleEditor(item)} />}
    {settings.showDock && <QuickDock links={links} onOpen={openUrl} onAdd={() => setLinkDialog("new")} onEdit={setLinkDialog} onDelete={link => setConfirmDelete({ label: link.title, action: () => setLinks(current => current.filter(entry => entry.id !== link.id)) })} />}
    <aside className={`focus-preview ${isFocusing ? "is-running" : ""}`} aria-label="专注计时器"><span className="focus-ring" /><div><strong>{formatRemaining(secondsLeft)}</strong><small>{isFocusing ? "Focusing" : "Focus"}</small></div><button onClick={() => setFocusEnd(isFocusing ? null : Date.now() + 25 * 60 * 1000)} aria-label={isFocusing ? "暂停专注" : "开始 25 分钟专注"}>{isFocusing ? "Ⅱ" : "▶"}</button></aside>
    {showSettings && <div className="modal-backdrop" role="presentation"><aside className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="panel-top"><div><p>静页 · STILLPAGE</p><h2 id="settings-title">设置</h2></div><button onClick={() => setShowSettings(false)} aria-label="关闭设置">×</button></div><label className="field"><span>默认搜索引擎</span><select value={settings.engine} onChange={event => setSettings(current => ({ ...current, engine: event.target.value as SearchEngine }))}><option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option></select></label><div className="field"><span>文字颜色</span><div className="segmented-control"><button className={settings.foregroundMode === "light" ? "active" : ""} onClick={() => setSettings(current => ({ ...current, foregroundMode: "light" }))}>浅色</button><button className={settings.foregroundMode === "dark" ? "active" : ""} onClick={() => setSettings(current => ({ ...current, foregroundMode: "dark" }))}>深色</button></div></div><label className="field"><span>文字不透明度 <em>{Math.round(settings.fontOpacity * 100)}%</em></span><input type="range" min="0.45" max="1" step="0.01" value={settings.fontOpacity} onChange={event => setSettings(current => ({ ...current, fontOpacity: Number(event.target.value) }))} /></label><label className="field"><span>背景亮度 <em>{Math.round(settings.brightness * 100)}%</em></span><input type="range" min="0.55" max="1.15" step="0.01" value={settings.brightness} onChange={event => setSettings(current => ({ ...current, brightness: Number(event.target.value) }))} /></label><label className="switch-row"><span>显示 Today 3</span><input type="checkbox" checked={settings.showToday} onChange={event => setSettings(current => ({ ...current, showToday: event.target.checked }))} /></label><label className="switch-row"><span>显示 Schedule</span><input type="checkbox" checked={settings.showSchedule} onChange={event => setSettings(current => ({ ...current, showSchedule: event.target.checked }))} /></label><label className="switch-row"><span>显示快捷链接</span><input type="checkbox" checked={settings.showDock} onChange={event => setSettings(current => ({ ...current, showDock: event.target.checked }))} /></label><button className="subtle-button" onClick={() => { setTasks(initialTasks); setLinks(initialLinks); setSettings(defaultSettings); setSchedules([]); }}>恢复默认设置</button><p className="panel-note">所有数据仅保存在此浏览器。</p></aside></div>}
    {showCalendar && <CalendarPanel items={schedules} selectedDate={selectedDate} onSelectedDate={setSelectedDate} onClose={() => setShowCalendar(false)} onAdd={date => { setSelectedDate(date); setScheduleEditor("new"); }} onEdit={setScheduleEditor} />}
    {linkDialog && <LinkDialog link={linkDialog === "new" ? undefined : linkDialog} onSave={saveLink} onClose={() => setLinkDialog(null)} />}
    {scheduleEditor && <ScheduleEditor item={scheduleEditor === "new" ? undefined : scheduleEditor} initialDate={selectedDate} onSave={saveSchedule} onDelete={requestScheduleDelete} onClose={() => setScheduleEditor(null)} />}
    {confirmDelete && <div className="modal-backdrop confirm-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><p>REMOVE</p><h2 id="confirm-title">Remove “{confirmDelete.label}”?</h2><div><button onClick={() => setConfirmDelete(null)}>Cancel</button><button className="remove-button" onClick={() => { confirmDelete.action(); setConfirmDelete(null); }}>Remove</button></div></section></div>}
  </main>;
}

export default App;
