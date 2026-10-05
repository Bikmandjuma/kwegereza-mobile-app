import { api } from "./client";

export function startConversation(withUserId: string) {
  return api.post("/chat/start", { withUserId });
}

export function listConversations() {
  return api.get("/chat/conversations");
}

export function listMessages(conversationId: string) {
  return api.get(`/chat/conversations/${conversationId}/messages`);
}

export function markConversationRead(conversationId: string) {
  return api.post(`/chat/conversations/${conversationId}/read`);
}

export function getMyGenderRoom() {
  return api.get("/chat/gender-room");
}
