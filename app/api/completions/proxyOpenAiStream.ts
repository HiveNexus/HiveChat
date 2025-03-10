import { addMessageInServer } from '@/app/chat/actions/message';

export default async function proxyOpenAiStream(response: Response,
  messageInfo: {
    chatId?: string,
    model: string,
    providerId: string
  }): Promise<Response> {
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      controller.enqueue(chunk);
    }
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.pipeThrough(transformStream).getReader();
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      let bufferedData = '';
      let completeResponse = '';
      let completeReasonin = '';
      let promptTokens = null;
      let completionTokens = null;
      let totalTokens = null;
      let isThinking = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferedData += new TextDecoder().decode(value, { stream: true });
        // Parse SSE format from bufferedData

        const lines = bufferedData.split('\n');
        bufferedData = lines.pop() || ''; // 保留最后一行可能是不完整JSON

        for (const line of lines) {
          const cleanedLine = line.replace(/^data: /, "").trim();
          if (cleanedLine === "" || cleanedLine === "[DONE]") {
            continue;
          }

          try {
            const parsedData = JSON.parse(cleanedLine);
            const { delta, finish_reason } = parsedData.choices[0];
            const usage = parsedData.usage || parsedData.choices[0].usage; // 兼容 Moonshot
            const { content, reasoning_content } = delta;
            if (!isThinking) {
              if (content.startsWith("<think>")) {
                isThinking = true;
                const thinkContent = content.slice(7).trim();
                if (thinkContent) {
                  completeReasonin += thinkContent;
                }
              } else {
                completeResponse += content;
              }
            } else {
              if (content.endsWith("</think>")) {
                isThinking = false;
                const thinkContent = content.slice(0, -8).trim();
                if (thinkContent) {
                  completeReasonin += thinkContent;
                }
              } else {
                if (content.trim()) {
                  completeReasonin += content;
                }
              }
            }
            if (reasoning_content) {
              completeReasonin += reasoning_content;
            }
            if (finish_reason && usage) {
              promptTokens = usage.prompt_tokens;
              completionTokens = usage.completion_tokens;
              totalTokens = usage.total_tokens;
            }

          } catch (error) {
            console.error("JSON parse error:", error, "in line:", cleanedLine);
          }
        }
        controller.enqueue(value);
      }
      // 有 ChatId 的存储到 messages 表
      if (messageInfo.chatId) {
        const toAddMessage = {
          chatId: messageInfo.chatId,
          content: completeResponse,
          reasoninContent: completeReasonin,
          role: 'assistant',
          type: 'text' as const,
          inputTokens: promptTokens,
          outputTokens: completionTokens,
          totalTokens: totalTokens,
          model: messageInfo.model,
          providerId: messageInfo.providerId,
        }
        addMessageInServer(toAddMessage);
      }
      controller.close();
    }
  });

  // 设置响应 headers
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  return new Response(stream, {
    headers: responseHeaders,
  });
}