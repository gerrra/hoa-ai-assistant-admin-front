import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
// В prod это обязано быть задано .env.production:
if (import.meta.env.PROD && !API_BASE) {
  console.error('VITE_API_BASE_URL is missing in production build');
}

export const http = axios.create({ 
  baseURL: API_BASE, 
  withCredentials: true 
})

export type AskBody = { community_id:number; role:'resident'|'board'|'staff'; question:string }

export async function ask(body: AskBody){
  const r = await http.post('/ask', body)
  return r.data
}

export async function listDocuments(communityId: number){
  const r = await http.get('/admin/api/documents', { params:{ community_id: communityId } })
  return r.data as Array<{id:number,title:string,doc_type:string,created_at:string,chunks:number}>
}

export async function listLogs(limit=100){
  const r = await http.get('/admin/api/logs', { params:{ limit } })
  return r.data as Array<{created_at:string,user_role:string,question:string,confidence:number}>
}

export async function uploadDocument(fd: FormData){
  const r = await http.post('/admin/api/upload', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
  return r.data
}

export async function login(password: string){
  const r = await http.post('/admin/api/login', { password })
  return r.data
}

export async function me(){
  const r = await http.get('/admin/api/me')
  return r.data as {authenticated: boolean}
}

export async function logout(){
  const r = await http.post('/admin/api/logout')
  return r.data
}
