'use client'
import { fetchEventSource, EventStreamContentType } from '@microsoft/fetch-event-source';
import { ChatOptions, LLMApi, LLMModel, LLMUsage, RequestMessage, ResponseContent } from '@/app/adapter/interface';
import { prettyObject } from '@/app/utils';
import { InvalidAPIKeyError, TimeoutError } from '@/app/adapter/errorTypes';

export type OpenaiMessageType = {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<
    {
      type: 'text';
      text: string;
    }
    |
    {
      type: 'image_url',
      image_url: {
        url: string,
      }
    }
  >;
}

export default class ChatGPTApi implements LLMApi {
  private providerId: string;
  constructor(providerId: string = 'openai') {
    this.providerId = providerId;
  }
  private controller: AbortController | null = null;
  private answer = '';
  private reasoning_content = '';
  private finished = false;
  private isThinking = false;
  prepareMessage<OpenaiMessageType>(messages: RequestMessage[]): OpenaiMessageType[] {
    return messages.map(msg => {
      // 处理文本消息
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        } as OpenaiMessageType;
      }

      // 处理包含图像的消息
      if (Array.isArray(msg.content)) {
        const formattedContent = msg.content.map(item => {
          if (item.type === 'text') {
            return {
              type: 'text',
              text: item.text
            };
          }
          if (item.type === 'image') {
            return {
              type: 'image_url',
              image_url: {
                url: item.data,
              }
            };
          }
        }).filter(Boolean);

        return {
          role: msg.role,
          content: formattedContent
        } as OpenaiMessageType;
      }

      // 默认返回文本消息
      return {
        role: msg.role,
        content: ''
      } as OpenaiMessageType;
    });
  }
  async chat(options: ChatOptions) {
    this.answer = '';
    this.reasoning_content = '';
    const clear = () => {
      if (!this.finished) {
        this.finished = true;
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
        this.answer = '';
        this.reasoning_content = '';
      }
    };
    this.controller = new AbortController();

    const timeoutId = setTimeout(() => {
      this.controller?.abort('timeout');
      options.onError?.(new TimeoutError('Timeout'));
    }, 30000);

    const messages = this.prepareMessage(options.messages)
    try {
      await fetchEventSource('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Provider': this.providerId,
          'X-Chat-Id': options.chatId!,
        },
        body: JSON.stringify({
          "stream": true,
          "model": `${options.config.model}`,
          "messages": messages,
        }),
        signal: this.controller.signal,
        onopen: async (res) => {
          clearTimeout(timeoutId);
          this.finished = false;
          if (
            !res.ok ||
            !res.headers.get("content-type")?.startsWith(EventStreamContentType) ||
            res.status !== 200
          ) {

            let resTextRaw = '';
            try {
              const resTextJson = await res.clone().json();
              resTextRaw = prettyObject(resTextJson);
            } catch {
              resTextRaw = await res.clone().text();
            }
            const responseTexts = [resTextRaw];
            if (res.status === 401) {
              options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
            } else {
              this.answer = responseTexts.join("\n\n");
              options.onError?.(new Error(this.answer));
            }
            clear();
          }
        },
        onmessage: (event) => {
          if (event.data === "[DONE]") {
            options.onFinish({
              content: this.answer,
              reasoning_content: this.reasoning_content,
            });
            clear();
            return;
          }
          const text = event.data;
          try {
            const json = JSON.parse(text);
            const deltaContent = json?.choices[0]?.delta?.content;
            const deltaReasoningContent = json?.choices[0]?.delta?.reasoning_content;
            if (deltaReasoningContent) {
              this.reasoning_content += deltaReasoningContent;
            }
            if (!this.isThinking) {
              if (deltaContent.startsWith("<think>")) {
                this.isThinking = true;
                const thinkContent = deltaContent.slice(7).trim();
                if (thinkContent) {
                  this.reasoning_content += thinkContent;
                }
              } else {
                this.answer += deltaContent;
              }
            } else {
              if (deltaContent.endsWith("</think>")) {
                this.isThinking = false;
                const thinkContent = deltaContent.slice(0, -8).trim();
                if (thinkContent) {
                  this.reasoning_content += thinkContent;
                }
              } else {
                if(deltaContent.trim()){
                  this.reasoning_content += deltaContent;
                }
              }
            }
            options.onUpdate({
              content: this.answer,
              reasoning_content: this.reasoning_content,
            });
          } catch (e) {
            console.error("[Request] parse error", text, event);
          }
        },
        onclose: () => {
          clear();
        },
        onerror: (err) => {
          this.controller = null;
          this.finished = true;
          this.answer = '';
          // 需要 throw，不然框架会自动重试
          throw err;
        },
        openWhenHidden: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
      } else {
        options.onError?.(new Error('An unknown error occurred'));
      }
      clear();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  stopChat = (callback: (responseContent: ResponseContent) => void) => {
    this.finished = true;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    callback({
      content: this.answer,
      reasoning_content: this.reasoning_content
    });
    this.answer = '';
    this.reasoning_content = '';
  }

  async check(modelId: string, apikey: string, apiUrl: string): Promise<{ status: 'success' | 'error', message?: string }> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Apikey': `${apikey}`,
      'X-Provider': this.providerId,
      'X-Endpoint': apiUrl
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/completions', {
        signal: controller.signal,
        method: 'POST',
        headers,
        body: JSON.stringify({
          "stream": true,
          "model": modelId,
          "messages": [{
            "role": "user",
            "content": "hello"
          }],
        }),
      });
      if (!res.ok) {
        let resTextRaw = '';
        try {
          const resTextJson = await res.clone().json();
          resTextRaw = prettyObject(resTextJson);
        } catch {
          resTextRaw = await res.clone().text();
        }
        return {
          status: 'error',
          message: resTextRaw,
        }
      } else {
        clearTimeout(timeoutId);
        return {
          status: 'success'
        }
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return {
          status: 'error',
          message: '网络连接超时',
        }
      }
      return {
        status: 'error',
        message: (error as Error)?.message || 'Unknown error occurred',
      }
    }
  }
  usage(): Promise<LLMUsage> {
    throw new Error('Method not implemented.');
  }

  models(): Promise<LLMModel[]> {
    throw new Error('Method not implemented.');
  }

}
