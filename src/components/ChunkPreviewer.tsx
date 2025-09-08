import React, { useEffect, useState } from "react";
import { ADMIN_API_PREFIX } from "../shared/http";

type SmartChunk = { text:string; pages:number[]; token_count:number };
type TopicSeg = { topic_index:number; text:string; pages:number[] };

export default function ChunkPreviewer({ file }:{ file: File | null }) {
  const [mode, setMode] = useState<"smart"|"topic">("smart");
  const [items, setItems] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState<number|null>(null);

  // Автоматически выбираем режим для больших файлов
  useEffect(() => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB
      setMode("smart");
    }
  }, [file]);

  useEffect(()=>{ setItems([]); setTotal(null); }, [file, mode]);

  async function start() {
    if (!file || running) return;
    setRunning(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (mode === "smart") {
        fd.append("mode","smart");
        fd.append("max_tokens","500");
        fd.append("overlap","2");
      } else {
        fd.append("mode","topic");
        fd.append("min_sim_drop","0.20");
        fd.append("max_topic_tokens","2000");
      }
      const base = (import.meta.env.VITE_API_BASE || window.location.origin.replace("admin.","api."));
      const resp = await fetch(base + ADMIN_API_PREFIX + "/chunk-preview", { method:"POST", body: fd, credentials:"include" });
      const reader = resp.body?.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const {done, value} = await reader!.read();
        if (done) break;
        buf += dec.decode(value, {stream:true});
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const frame = buf.slice(0, idx); buf = buf.slice(idx+2);
          const line = frame.split("\n").find(l=>l.startsWith("data:"));
          if (!line) continue;
          const evt = JSON.parse(line.slice(5).trim());
          if (evt.type === "chunk" || evt.type === "topic") setItems(prev=>[...prev, evt.payload]);
          if (evt.type === "done") setTotal(evt.total);
        }
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Auto mode notice for large files */}
      {file && file.size > 5 * 1024 * 1024 && mode === "smart" && (
        <div className="auto-mode-notice" style={{ marginBottom: '12px' }}>
          💡 Автоматически выбран режим "Smart" для файла {Math.round(file.size / 1024 / 1024)}MB
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-2">
        <select className="border rounded px-2 py-1" value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="smart">Smart (по предложениям)</option>
          <option value="topic">Topic (по темам)</option>
        </select>
        <button className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={start} disabled={!file || running}>
          {running ? "Обработка…" : "Предпросмотр"}
        </button>
        {total !== null && <span className="text-sm text-gray-600">Всего: {total}</span>}
      </div>

      <div className="mt-2 max-h-96 overflow-auto space-y-2 text-sm">
        {items.length === 0 && <div className="text-gray-500">Нет данных — запустите предпросмотр.</div>}
        {mode === "smart" && items.map((c:SmartChunk, i:number)=>(
          <div key={i} className="border rounded p-2">
            <div className="text-xs text-gray-600">стр. {c.pages?.join(", ") || "—"} · токенов ~{c.token_count}</div>
            <div className="whitespace-pre-wrap">{c.text}</div>
          </div>
        ))}
        {mode === "topic" && items.map((t:TopicSeg, i:number)=>(
          <details key={i} className="border rounded p-2">
            <summary className="cursor-pointer text-sm font-medium">Топик #{t.topic_index} · стр. {t.pages?.join(", ") || "—"}</summary>
            <div className="mt-2 whitespace-pre-wrap">{t.text}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
