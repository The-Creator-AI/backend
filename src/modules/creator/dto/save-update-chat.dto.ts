import { ChatMessageType } from '@The-Creator-AI/fe-be-common/dist/types';

export interface SaveUpdateChatDto {
  id?: number;
  title: string;
  description: string;
  chat_history: ChatMessageType[];
}
