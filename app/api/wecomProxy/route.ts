import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const bodyParams = new URLSearchParams(body);
  const parsedBody = Object.fromEntries(bodyParams.entries());
  const { code } = parsedBody;
  try {
    // 获取 URL 参数
    const searchParams = req.nextUrl.searchParams;
    const corpid = searchParams.get('corpid');
    const corpsecret = searchParams.get('corpsecret');
    // 从 POST 请求体中获取 code 参数
    // 验证必要参数
    if (!corpid || !corpsecret) {
      return new Response(JSON.stringify({
        errcode: 40001,
        errmsg: '缺少必要参数 corpid 或 corpsecret'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
    );

    const data = await response.json();
    const userinfoResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${data.access_token}&code=${code}`
    );
    const userinfoData = await userinfoResponse.json();
    // 添加 token_type 字段，不然不符合 Auth.js 规范要求
    const enhancedData = {
      ...data,
      token_type: 'Bearer',
      scope: "auth:user.id:read",
      userId: userinfoData.userid,
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