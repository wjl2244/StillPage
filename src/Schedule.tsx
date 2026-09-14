import { type FormEvent, useMemo, useState } from "react";
import { addDays, compactDate, dateFromKey, localDateKey, mondayOf, monthLabel, sameDay } from "./date";
import type { ScheduleItem, ScheduleViewMode } from "./types";

type ScheduleDraft = Pick<ScheduleItem, "title" | "date" | "startTime" | "endTime" | "allDay" | "notes">;
const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function ordered(items: ScheduleItem[]) {
  return [...items].sort((a, b) => Number(b.allDay) - Number(a.allDay) || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"));
}

function EventLine({ item, onEdit }: { item: ScheduleItem; onEdit: (item: ScheduleItem) => void }) {
  return <button className="schedule-line" onClick={() => onEdit(item)} aria-label={`编辑日程：${item.title}`}>
    <time>{item.allDay ? "ALL DAY" : item.startTime ?? "—"}</time><span>{item.title}</span>{item.endTime && <small>{item.endTime}</small>}
  </button>;
}

interface ScheduleWidgetProps {
  items: ScheduleItem[];
  selectedDate: string;
  viewMode: ScheduleViewMode;
  onViewMode: (mode: ScheduleViewMode) => void;
  onOpenCalendar: () => void;
  onEdit: (item: ScheduleItem) => void;
}

export function ScheduleWidget({ items, selectedDate, viewMode, onViewMode, onOpenCalendar, onEdit }: ScheduleWidgetProps) {
  const selected = dateFromKey(selectedDate);
  const dayItems = ordered(items.filter(item => item.date === selectedDate));
  const week = Array.from({ length: 7 }, (_, index) => addDays(mondayOf(selected), index));
  return <aside className="schedule-widget" aria-labelledby="schedule-title">
    <div className="schedule-header"><div><p id="schedule-title">SCHEDULE</p><button className="schedule-mode" onClick={() => onViewMode(viewMode === "daily" ? "weekly" : "daily")}>{viewMode === "daily" ? "Daily" : "Weekly"} <span>▾</span></button></div><button className="calendar-button" onClick={onOpenCalendar} aria-label="打开日历" title="打开日历">▦</button></div>
    {viewMode === "daily" ? <div className="daily-agenda"><p className="agenda-date">{compactDate(selected)}</p>{dayItems.length ? dayItems.map(item => <EventLine item={item} onEdit={onEdit} key={item.id} />) : <p className="empty-agenda">No plans</p>}</div> : <div className="weekly-agenda">{week.map(day => { const key = localDateKey(day); const dayEvents = ordered(items.filter(item => item.date === key)); return <div className="week-day" key={key}><p>{new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric" }).format(day)}</p>{dayEvents.length ? dayEvents.map(item => <EventLine item={item} onEdit={onEdit} key={item.id} />) : <span>—</span>}</div>; })}</div>}
    <button className="open-calendar" onClick={onOpenCalendar}>Open Calendar <span>→</span></button>
  </aside>;
}

interface CalendarPanelProps {
  items: ScheduleItem[];
  selectedDate: string;
  onSelectedDate: (date: string) => void;
  onClose: () => void;
  onAdd: (date: string) => void;
  onEdit: (item: ScheduleItem) => void;
}

export function CalendarPanel({ items, selectedDate, onSelectedDate, onClose, onAdd, onEdit }: CalendarPanelProps) {
  const [cursor, setCursor] = useState(() => dateFromKey(selectedDate));
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstOffset = (monthStart.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index - firstOffset));
  const selectedItems = ordered(items.filter(item => item.date === selectedDate));
  const today = new Date();
  return <aside className="calendar-panel" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
    <div className="panel-top"><div><p>SCHEDULE</p><h2 id="calendar-title">Calendar</h2></div><button onClick={onClose} aria-label="关闭日历">×</button></div>
    <div className="calendar-month"><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="上个月">‹</button><h3>{monthLabel(cursor)}</h3><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="下个月">›</button></div>
    <div className="calendar-grid" aria-label="月历">{weekdays.map(day => <span className="calendar-weekday" key={day}>{day}</span>)}{cells.map(date => { const key = localDateKey(date); const hasItems = items.some(item => item.date === key); return <button key={key} onClick={() => onSelectedDate(key)} className={`${date.getMonth() !== cursor.getMonth() ? "outside" : ""} ${key === selectedDate ? "selected" : ""} ${sameDay(date, today) ? "is-today" : ""}`}><span>{date.getDate()}</span>{hasItems && <i />}</button>; })}</div>
    <div className="calendar-day-detail"><p>Selected: {compactDate(dateFromKey(selectedDate))}</p>{selectedItems.length ? selectedItems.map(item => <div className="calendar-event" key={item.id}><EventLine item={item} onEdit={onEdit} /></div>) : <span className="empty-agenda">No plans</span>}<button className="add-schedule" onClick={() => onAdd(selectedDate)}>+ Add schedule</button></div>
  </aside>;
}

interface ScheduleEditorProps { item?: ScheduleItem; initialDate: string; onSave: (draft: ScheduleDraft) => void; onDelete?: (item: ScheduleItem) => void; onClose: () => void; }

export function ScheduleEditor({ item, initialDate, onSave, onDelete, onClose }: ScheduleEditorProps) {
  const [draft, setDraft] = useState<ScheduleDraft>({ title: item?.title ?? "", date: item?.date ?? initialDate, startTime: item?.startTime ?? "", endTime: item?.endTime ?? "", allDay: item?.allDay ?? false, notes: item?.notes ?? "" });
  function submit(event: FormEvent) { event.preventDefault(); if (draft.title.trim()) onSave({ ...draft, title: draft.title.trim(), notes: draft.notes?.trim() }); }
  return <div className="modal-backdrop editor-backdrop" role="presentation"><form className="schedule-editor" onSubmit={submit}><div className="panel-top"><div><p>{item ? "EDIT SCHEDULE" : "NEW SCHEDULE"}</p><h2>{item ? "Edit schedule" : "Add schedule"}</h2></div><button type="button" onClick={onClose} aria-label="关闭">×</button></div><label className="field"><span>Title</span><input autoFocus value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Team meeting" /></label><div className="editor-two-columns"><label className="field"><span>Date</span><input type="date" value={draft.date} onChange={event => setDraft(current => ({ ...current, date: event.target.value }))} /></label><label className="switch-row compact"><span>All day</span><input type="checkbox" checked={draft.allDay} onChange={event => setDraft(current => ({ ...current, allDay: event.target.checked }))} /></label></div>{!draft.allDay && <div className="editor-two-columns"><label className="field"><span>Start time</span><input type="time" value={draft.startTime} onChange={event => setDraft(current => ({ ...current, startTime: event.target.value }))} /></label><label className="field"><span>End time <em>optional</em></span><input type="time" value={draft.endTime} onChange={event => setDraft(current => ({ ...current, endTime: event.target.value }))} /></label></div>}<label className="field"><span>Notes <em>optional</em></span><textarea value={draft.notes} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} placeholder="A few details…" /></label><div className="editor-actions">{item && onDelete ? <button type="button" className="text-danger" onClick={() => onDelete(item)}>Delete</button> : <span />}<button type="submit" className="primary-button">Save schedule</button></div></form></div>;
}
