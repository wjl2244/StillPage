export type SearchEngine = "google" | "bing" | "duckduckgo";
export type ScheduleViewMode = "daily" | "weekly";

export interface TodayTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  engine: SearchEngine;
  foregroundMode: "light" | "dark";
  fontOpacity: number;
  brightness: number;
  showToday: boolean;
  showDock: boolean;
  showSchedule: boolean;
  schedule: { viewMode: ScheduleViewMode };
}
