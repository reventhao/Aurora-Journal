import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantSpeechRequest,
} from "@aurora/shared";

import { http } from "./http";

export const assistantApi = {
  chat: (payload: AssistantChatRequest) =>
    http
      .post<AssistantChatResponse>("/assistant/public-chat", payload)
      .then((res) => res.data),
  speech: (payload: AssistantSpeechRequest) =>
    http
      .post<Blob>("/assistant/public-speech", payload, {
        responseType: "blob",
      })
      .then((res) => res.data),
};
