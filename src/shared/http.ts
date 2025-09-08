import axios from "axios";

const envBase = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const fallbackBase = window.location.origin.replace(/^https?:\/\/admin\./, (m) => m.replace("admin.", "api."));
export const ADMIN_API_PREFIX = "/admin/api";

export const api = axios.create({
  baseURL: envBase || fallbackBase,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 600000, // 10 минут для больших файлов
});

export function join(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .join("/")
    .replace(/^([^:]+:\/\/)\/+/, "$1");
}