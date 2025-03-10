import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { getLlmConfigByProvider, completeEndpoint } from '@/app/utils/llms';
import proxyOpenAiStream from './proxyOpenAiStream';
import proxyClaudeStream from './proxyClaudeStream';
import proxyGeminiStream from './proxyGeminiStream';
// Vercel Hobby 默认 10s，最大 60
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    // 获取原始请求的 headers
    const userRequestHeaders = req.headers;
    const xProvider = userRequestHeaders.get('X-Provider'); //必填
    const xChatId = userRequestHeaders.get('x-chat-id');    //对话时必填，测试时不需要
    const xEndpoint = userRequestHeaders.get('X-Endpoint'); //选填，测试 URL 时需要
    const xModel = userRequestHeaders.get('X-Model');       //选填，gemini 这种特殊的才有

    const { endpoint, apikey } = await getLlmConfigByProvider(xProvider || 'openai');
    // 测试连接下，会传 X-apikey，优先使用
    const realApikey = userRequestHeaders.get('X-Apikey') || apikey;
    let realEndpoint = '';
    if (xProvider === 'gemini') {
      if (endpoint && endpoint.trim() !== '') {
        realEndpoint = `${endpoint}/v1beta/models/${xModel}:streamGenerateContent?alt=sse&key=${realApikey}`;
      } else {
        realEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${xModel}:streamGenerateContent?alt=sse&key=${realApikey}`;
      }
    } else if (xEndpoint) {
      // 如有有自定义，优先用传过来的自定义，用户测试
      realEndpoint = await completeEndpoint(xProvider as string, xEndpoint);
    } else {
      realEndpoint = await completeEndpoint(xProvider as string, endpoint);
    }
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    });
    // Gemini 特殊，Header 加了会报错
    if (xProvider !== 'gemini') {
      headers.set('Authorization', `Bearer ${realApikey}`);
    }
    // Claude 特殊，用 x-apikey
    if (xProvider === 'claude') {
      headers.set('x-api-key', realApikey || '');
      headers.set('anthropic-version', '2023-06-01'); // 添加必须的版本号
    }
    // 获取请求体
    const body = await req.text();
    const response = await fetch(realEndpoint, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    // 检查响应是否成功
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const parsedBody = JSON.parse(body);
    switch (xProvider) {
      case 'claude':
        return proxyClaudeStream(response, {
          chatId: xChatId || undefined,
          model: parsedBody?.model || xModel,
          providerId: xProvider
        });
      case 'gemini':
        return proxyGeminiStream(response, {
          chatId: xChatId || undefined,
          model: parsedBody?.model || xModel,
          providerId: xProvider
        });
      default:
        return proxyOpenAiStream(response, {
          chatId: xChatId || undefined,
          model: parsedBody?.model || xModel,
          providerId: xProvider!
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

