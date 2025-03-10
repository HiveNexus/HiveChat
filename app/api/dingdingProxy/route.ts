import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const bodyParams = new URLSearchParams(body);
  const parsedBody = Object.fromEntries(bodyParams.entries());
  const { code } = parsedBody;
  try {
    // 获取 URL 参数
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const clientSecret = searchParams.get('clientSecret');
    // 从 POST 请求体中获取 code 参数
    // 验证必要参数
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        errcode: 40001,
        errmsg: '缺少必要参数 corpid 或 corpsecret'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const response = await fetch(
      `https://api.dingtalk.com/v1.0/oauth2/userAccessToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          code,
          grantType: "authorization_code",
        })
      }
    );

    const data = await response.json();
    // 调整为默认的 Auth.js 规范要求
    const enhancedData = {
      access_token: data.accessToken,
      expires_in: data.expireIn,
      refresh_token: data.refreshToken,
      token_type: 'Bearer',
    };
    return new Response(JSON.stringify(enhancedData), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('代理请求失败:', error);
    return new Response(JSON.stringify({
      errcode: 50000,
      errmsg: '服务器内部错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}