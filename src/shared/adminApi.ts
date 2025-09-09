import { api, ADMIN_API_PREFIX, join } from './http'

export type AskBody = { community_id:number; role:'resident'|'board'|'staff'; question:string }

export async function ask(body: AskBody){
  const r = await api.post('/ask', body)
  return r.data
}

export async function listDocuments(communityId?: number){
  const params = communityId ? { community_id: communityId } : {}
  const r = await api.get(join(ADMIN_API_PREFIX, "documents"), { params })
  return r.data as Array<{
    id: string;
    filename: string;
    title?: string;
    doc_type?: string;
    visibility?: string;
    rel_path: string;
    pages: number;
    size_bytes: number;
    created_at: string;
    community_id?: number;
    chunks?: number;
    topics?: number;
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
    id: number;
    topic_index: number;
    title: string;
    description?: string;
    start_page: number;
    end_page: number;
    page_numbers: number[];
    created_at: string;
    document_title?: string;
  }>
}

export async function getStatistics(communityId: number){
  const r = await api.get(join(ADMIN_API_PREFIX, "statistics"), { params:{ community_id: communityId } })
  return r.data as {
    total_documents: number;
    total_chunks: number;
    total_topics: number;
    documents_with_topics: number;
    topics_by_document: Array<{document_id: string; document_name: string; topics_count: number}>;
    popular_topics: Array<{title: string; count: number}>;
  }
}

// Communities API
export async function listCommunities(){
  const r = await api.get(join(ADMIN_API_PREFIX, "communities"))
  return r.data as Array<{
    id: number;
    name: string;
    description: string;
    created_at: string;
  }>
}

export async function createCommunity(data: { name: string; description?: string }){
  const r = await api.post(join(ADMIN_API_PREFIX, "communities"), data)
  return r.data as {
    id: number;
    name: string;
    description: string;
    message: string;
  }
}

export async function updateCommunity(communityId: number, data: { name: string; description?: string }){
  const r = await api.put(join(ADMIN_API_PREFIX, `communities/${communityId}`), data)
  return r.data
}

export async function deleteCommunity(communityId: number){
  const r = await api.delete(join(ADMIN_API_PREFIX, `communities/${communityId}`))
  return r.data as { message: string }
}
