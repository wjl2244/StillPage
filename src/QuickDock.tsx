import { useState } from "react";
import type { QuickLink } from "./types";

interface QuickDockProps {
  links: QuickLink[];
  onOpen: (url: string) => void;
  onAdd: () => void;
  onEdit: (link: QuickLink) => void;
  onDelete: (link: QuickLink) => void;
}

function toneFor(title: string) {
  const known: Record<string, string> = { GitHub: "github", ChatGPT: "chatgpt", Gmail: "gmail", YouTube: "youtube", Notion: "notion", Drive: "drive" };
  return known[title] ?? "custom";
}

function iconFor(link: QuickLink) { return link.icon || link.title.trim().slice(0, 2).toUpperCase(); }

export default function QuickDock({ links, onOpen, onAdd, onEdit, onDelete }: QuickDockProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  return <nav className="dock" aria-label="快捷链接">
    {links.map(link => <div className="quick-link-wrap" key={link.id}>
      <button className="dock-link" onClick={() => onOpen(link.url)} aria-label={`打开 ${link.title}`} title={`打开 ${link.title}`}>
        <span className={`dock-glyph ${toneFor(link.title)}`}>{iconFor(link)}</span><span>{link.title}</span>
      </button>
      <button className="quick-actions" onClick={event => { event.stopPropagation(); setActiveMenu(activeMenu === link.id ? null : link.id); }} aria-label={`管理 ${link.title}`} aria-expanded={activeMenu === link.id}>···</button>
      {activeMenu === link.id && <div className="quick-menu" role="menu">
        <button role="menuitem" onClick={() => { setActiveMenu(null); onEdit(link); }}>Edit</button>
        <button role="menuitem" className="danger" onClick={() => { setActiveMenu(null); onDelete(link); }}>Delete</button>
      </div>}
    </div>)}
    {links.length < 8 && <button className="dock-link" onClick={onAdd} aria-label="添加快捷链接"><span className="dock-glyph add">+</span><span>Add</span></button>}
  </nav>;
}
