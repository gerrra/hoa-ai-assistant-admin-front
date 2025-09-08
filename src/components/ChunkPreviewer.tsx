import React, { useEffect, useRef, useState } from "react";
import { ADMIN_API_PREFIX } from "../shared/http";

type Chunk = { index:number; page?:number; start?:number; end?:number; text:string; filename?:string };

function parseSSE(onEvent: (evt:any)=>void) {
  let buf = "";
  const dec = new TextDecoder();
  return (chunk: Uint8Array) => {
    buf += dec.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const one = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = one.split("\n").find(l => l.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      try { onEvent(JSON.parse(data)); } catch {}
    }
  };
}

export default function ChunkPreviewer({ file, maxChars=1200, overlap=200 }:{
  file: File | null; maxChars?: number; overlap?: number;
}) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => { setChunks([]); setTotal(null); }, [file]);

  async function start() {
    if (!file || running) return;
    setRunning(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("max_chars", String(maxChars));
      fd.append("overlap", String(overlap));
      const resp = await fetch((import.meta.env.VITE_API_BASE || window.location.origin.replace("admin.","api.")) + ADMIN_API_PREFIX + "/chunk-preview", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const feed = parseSSE((evt) => {
        if (evt.type === "chunk" && evt.payload) {
          setChunks((prev) => [...prev, evt.payload as Chunk]);
        } else if (evt.type === "done") {
          setTotal(evt.total ?? chunks.length);
        }
      });
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) feed(value);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
          onClick={start}
          disabled={!file || running}
        >
          {running ? "Обработка..." : "Предпросмотр чанков"}
        </button>
        {total !== null && <span className="text-sm text-gray-600">Всего чанков: {total}</span>}
      </div>

      <div className="mt-3 max-h-80 overflow-auto border rounded p-3 text-sm space-y-3">
        {chunks.map((c) => (
          <div key={c.index} className="border rounded p-2">
            <div className="text-xs text-gray-600">#{c.index}{c.page ? ` · стр. ${c.page}` : ""}{(c.start!==undefined && c.end!==undefined) ? ` · ${c.start}-${c.end}` : ""}</div>
            <div className="whitespace-pre-wrap">{c.text}</div>
          </div>
        ))}
        {chunks.length === 0 && <div className="text-gray-500">Нет данных — нажмите «Предпросмотр чанков».</div>}
      </div>
    </div>
  );
}
