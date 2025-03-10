import { fetchEventSource, EventStreamContentType } from '@microsoft/fetch-event-source';
import { ChatOptions, LLMApi, LLMModel, LLMUsage, RequestMessage, ResponseContent } from '@/app/adapter/interface';
import { prettyObject } from '@/app/utils';
import { InvalidAPIKeyError, TimeoutError } from '@/app/adapter/errorTypes';

export type ClaudeMessageType = {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<
    {
      type: 'text';
      text: string;
    }
    |
    {
      type: 'image',
      source: {
        type: "base64",
        media_type: string,
        data: string,
      }
    }
  >;
}

export default class ClaudeApi implements LLMApi {
  private controller: AbortController | null = null;
  private answer = '';
  private reasoning_content = '';
  private finished = false;
  prepareMessage<ClaudeMessageType>(messages: RequestMessage[]): ClaudeMessageType[] {
    return messages.map(msg => {
      // 处理文本消息
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        } as ClaudeMessageType;
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
              type: 'image',
              source: {
                type: "base64",
                media_type: item.mimeType || 'image/jpeg',
                data: item.data.substring(item.data.indexOf(",") + 1)
              }
            };
          }
        }).filter(Boolean);

        return {
          role: msg.role,
          content: formattedContent
        } as ClaudeMessageType;
      }

      // 默认返回文本消息
      return {
        role: msg.role,
        content: ''
      } as ClaudeMessageType;
    });
  }
  async chat(options: ChatOptions) {
    this.answer = '';
    const clear = () => {
      if (!this.finished) {
        this.finished = true;
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
        this.answer = '';
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
          'X-Provider': 'claude',
          'X-Chat-Id': options.chatId!,
        },
        body: JSON.stringify({
          "stream": true,
          'max_tokens': 2048,
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
          const text = event.data;
          if (text) {
            try {
              const json = JSON.parse(text);
              if (json?.type === "message_stop") {
                options.onFinish({ content: this.answer });
                clear();
                return;
              }
              if (json?.type === 'content_block_delta') {
                const deltaContent = json?.delta?.text;
                if (deltaContent) {
                  this.answer += deltaContent;
                }
                options.onUpdate({ content: this.answer });
              }
            } catch (e) {
              console.error("[Request] parse error", `--------${text}------`, `===--${event}---`);
            }
          }
        },
        onclose: () => {
          this.controller = null;
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
  }

  async check(modelId: string, apikey: string, apiUrl: string): Promise<{ status: 'success' | 'error', message?: string }> {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': `${apikey}`,
      'X-Provider': 'claude',
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
          "stream": false,
          'max_tokens': 2048,
          "model": modelId,
          "messages": [{
            "role": "user",
            "content": "ping"
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