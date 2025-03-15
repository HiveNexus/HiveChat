export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract prepareMessage?<T>(messages: RequestMessage[]): T[];
  abstract stopChat(callback?: (answer: ResponseContent) => void): void;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}

export interface ResponseContent {
  content: string;
  reasoning_content?: string;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  chatId?: string;
  onUpdate: (update: ResponseContent) => void;
  onFinish: (message: ResponseContent) => void;
  onError?: (error?: Error) => void;
  onController?: (controller: AbortController) => void;
}

export type MessageContent = string | Array<
  {
    type: 'text';
    text: string;
  }
  | {
    type: 'image';
    mimeType: string;
    data: string;
  }
>;

export interface RequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  id: string;
  displayName: string;
  apiUrl?: string;
  maxTokens?: number;
  supportVision?: boolean;
  selected?: boolean;
  provider: LLMModelProvider;
  type?: 'default' | 'custom';
}

export interface LLMModelRealId {
  id: number;
  name: string;
  displayName: string;
  apiUrl?: string;
  maxTokens?: number;
  supportVision?: boolean;
  selected?: boolean;
  provider: LLMModelProvider;
  type?: 'default' | 'custom';
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerLogo?: string;
  status?: boolean;
  type?: 'default' | 'custom';
}

export default interface TranslaterComponent {
  startTranslate: (question: string, language: string, completeCallback: (result: string) => void) => void;
  stopTranslate: () => void;
  clear: () => void;
}