import { api, ADMIN_API_PREFIX, join } from './http'

export type AskBody = { community_id:number; role:'resident'|'board'|'staff'; question:string }

export async function ask(body: AskBody){
  const r = await api.post('/ask', body)
  return r.data
}

export async function listDocuments(communityId: number){
  const r = await api.get(join(ADMIN_API_PREFIX, "documents"), { params:{ community_id: communityId } })
  return r.data as Array<{
    id: string;
    filename: string;
    rel_path: string;
    pages: number;
    size_bytes: number;
    created_at: string;
    title?: string;
    doc_type?: string;
    chunks?: number;
  }>
}

export async function listLogs(limit=100){
  const r = await api.get(join(ADMIN_API_PREFIX, "logs"), { params:{ limit } })
  return r.data as Array<{created_at:string,user_role:string,question:string,confidence:number}>
}

export async function uploadDocument(fd: FormData){
  const r = await api.post(join(ADMIN_API_PREFIX, "upload"), fd, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  })
  return r.data
}

export async function login(password: string){
  const r = await api.post(join(ADMIN_API_PREFIX, "login"), { password })
  return r.data
}

export async function me(){
  const r = await api.get(join(ADMIN_API_PREFIX, "me"))
  return r.data as {authenticated: boolean}
}

export async function logout(){
  const r = await api.post(join(ADMIN_API_PREFIX, "logout"))
  return r.data
}

export async function generateTopicTitle(text: string){
  const r = await api.post(join(ADMIN_API_PREFIX, "generate-topic-title"), { text })
  return r.data as { title: string }
}

export async function getDocumentTopics(documentId: string){
  const r = await api.get(join(ADMIN_API_PREFIX, `documents/${documentId}/topics`))
  return r.data as Array<{
    topic_index: number;
    title: string;
    start_page: number;
    end_page: number;
  }>
}
