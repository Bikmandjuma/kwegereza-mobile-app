import { api } from "./client";

export function getPublishedExams() {
  return api.get("/exams/published");
}

export function getExamForTaking(id: string) {
  return api.get(`/exams/${id}/take`);
}

export function startAttempt(examId: string) {
  return api.post(`/exams/${examId}/attempts`, {});
}

export type SubmittedAnswer = { questionId: string; selectedOptionId?: string; textAnswer?: string };

export function submitAttempt(attemptId: string, answers: SubmittedAnswer[]) {
  return api.post(`/exams/attempts/${attemptId}/submit`, { answers });
}

export function getAttemptResult(attemptId: string) {
  return api.get(`/exams/attempts/${attemptId}/result`);
}
