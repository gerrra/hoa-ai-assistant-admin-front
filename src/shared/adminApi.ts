import { http, upload, api } from './http'

export type AskBody = { community_id:number; role:'resident'|'board'|'staff'; question:string }

export async function ask(body: AskBody){
  const r = await api.post('/ask', body)
  return r.data
}

export async function listDocuments(communityId: number){
  const r = await http.get("documents", { params:{ community_id: communityId } })
  return r.data as Array<{id:number,title:string,doc_type:string,created_at:string,chunks:number}>
}

export async function listLogs(limit=100){
  const r = await http.get("logs", { params:{ limit } })
  return r.data as Array<{created_at:string,user_role:string,question:string,confidence:number}>
}

export async function uploadDocument(fd: FormData){
  const r = await upload("upload", fd)
  return r.data
}

export async function login(password: string){
  const r = await http.post("login", { password })
  return r.data
}

export async function me(){
  const r = await http.get("me")
  return r.data as {authenticated: boolean}
}

export async function logout(){
  const r = await http.post("logout")
  return r.data
}
