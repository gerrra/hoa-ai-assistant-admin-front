import axios from "axios";

// base from env or derive api.<domain> from current origin
const envBase = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const fallbackBase = window.location.origin.replace(/^https?:\/\/admin\./, (m) => m.replace("admin.","api."));
const baseURL = envBase || fallbackBase;

// Safe join: trims duplicate slashes and avoids trailing-slash redirects
export function joinPath(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/,"") : p.replace(/^\/+|\/+$/g,"")))
    .join("/")
    .replace(/^([^:]+:\/\/)\/+/, "$1"); // keep protocol //
}

export const ADMIN_PREFIX = "/admin/api"; // no trailing slash

export const api = axios.create({
  baseURL,
  withCredentials: true,              // admin uses cookies
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// helpers with safe path-join
export const http = {
  get:    (p: string, cfg?: any) => api.get(   joinPath(ADMIN_PREFIX, p), cfg),
  post:   (p: string, d?: any, cfg?: any) => api.post(  joinPath(ADMIN_PREFIX, p), d, cfg),
  put:    (p: string, d?: any, cfg?: any) => api.put(   joinPath(ADMIN_PREFIX, p), d, cfg),
  patch:  (p: string, d?: any, cfg?: any) => api.patch( joinPath(ADMIN_PREFIX, p), d, cfg),
  delete: (p: string, cfg?: any) => api.delete(joinPath(ADMIN_PREFIX, p), cfg),
};

// upload helper: do not set Content-Type explicitly (let browser set boundary)
export function upload(p: string, form: FormData, cfg?: any) {
  // Create a separate axios instance for file uploads without default Content-Type
  const uploadApi = axios.create({
    baseURL: api.defaults.baseURL,
    withCredentials: true,
    timeout: 20000,
    // Don't set Content-Type - let browser set multipart/form-data with boundary
  });
  
  return uploadApi.post(joinPath(ADMIN_PREFIX, p), form, cfg);
}
