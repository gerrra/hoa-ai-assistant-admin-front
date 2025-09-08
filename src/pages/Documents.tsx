import React, { useEffect, useState } from "react";
import { api, ADMIN_API_PREFIX, join } from "../shared/http";

type Doc = { id:string; filename:string; rel_path:string; pages:number; size_bytes:number; created_at:string };
type ChunkRow = { id:number; page:number|null; start:number|null; end:number|null; preview:string };

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [openId, setOpenId] = useState<string|null>(null);
  const [chunks, setChunks] = useState<ChunkRow[]|null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await api.get(join(ADMIN_API_PREFIX, "documents"));
    setDocs(r.data || []);
  }
  useEffect(() => { load(); }, []);

  async function showChunks(id: string) {
    setOpenId(id); setChunks(null);
    const r = await api.get(join(ADMIN_API_PREFIX, `documents/${id}/chunks`));
    setChunks(r.data || []);
  }

  async function remove(id: string) {
    if (!confirm("Удалить документ и связанные чанки?")) return;
    setBusy(true);
    try {
      await api.delete(join(ADMIN_API_PREFIX, `documents/${id}`));
      await load();
      if (openId === id) { setOpenId(null); setChunks(null); }
    } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Документы</h1>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Файл</th>
              <th className="text-left p-2">Страниц</th>
              <th className="text-left p-2">Размер</th>
              <th className="text-left p-2">Когда</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <React.Fragment key={d.id}>
                <tr className="border-t">
                  <td className="p-2">{d.filename}</td>
                  <td className="p-2">{d.pages}</td>
                  <td className="p-2">{(d.size_bytes/1024/1024).toFixed(2)} MB</td>
                  <td className="p-2">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="p-2 flex gap-2">
                    <button className="px-2 py-1 rounded border" onClick={()=>showChunks(d.id)}>Чанки</button>
                    <a className="px-2 py-1 rounded border" href={`/static/${d.rel_path}`} target="_blank" rel="noreferrer">Открыть PDF</a>
                    <button className="px-2 py-1 rounded border text-red-600 disabled:opacity-50" onClick={()=>remove(d.id)} disabled={busy}>Удалить</button>
                  </td>
                </tr>
                {openId === d.id && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 p-0">
                      <div className="p-3 max-h-80 overflow-auto space-y-2">
                        {chunks ? chunks.map(c => (
                          <div key={c.id} className="border rounded p-2">
                            <div className="text-xs text-gray-600">
                              #{c.id} · {c.page ? `стр. ${c.page}` : "стр. —"} · {c.start ?? "?"}-{c.end ?? "?"}
                            </div>
                            <div className="whitespace-pre-wrap">{c.preview}</div>
                          </div>
                        )) : <div className="text-gray-500">Загрузка чанков…</div>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Документов пока нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
