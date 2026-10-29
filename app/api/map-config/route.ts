import { env } from 'cloudflare:workers';

export function GET() {
  const { VWORLD_API_KEY } = env as unknown as { VWORLD_API_KEY?: string };
  if (!VWORLD_API_KEY) return Response.json({ error:'브이월드 인증키 연결을 기다리고 있습니다.' }, { status:503 });
  // This domain-bound browser key is intentionally public, with the owner's consent.
  return Response.json({ key:VWORLD_API_KEY, domain:'https://hyperframes-slide-lab.letscoding.chatgpt.site' }, { headers:{ 'Cache-Control':'no-store' } });
}
