import { env } from 'cloudflare:workers';
import { lookupSoil, SoilError } from '../../../lib/soil-service.mjs';

// shortcut: per-worker cache and rate limit reset on restart; use shared storage for a larger public service.
const cache = new Map<string, { expires: number; data: unknown }>();
const requests = new Map<string, { expires: number; count: number }>();
export async function GET(request: Request) {
  const values = env as unknown as { SOIL_API_KEY?: string; VWORLD_API_KEY?: string };
  const params = new URL(request.url).searchParams;
  const headers = { 'Cache-Control':'no-store' };
  if (params.get('status') === '1') return Response.json({ soilReady:!!values.SOIL_API_KEY, mapReady:!!values.VWORLD_API_KEY }, { headers });
  const now = Date.now(), ip = request.headers.get('cf-connecting-ip') ?? 'local';
  if (requests.size > 2000) for (const [key, entry] of requests) if (entry.expires < now) requests.delete(key);
  const meter = requests.get(ip);
  if (meter && meter.expires > now && meter.count >= 30) return Response.json({ error:'조회가 많습니다. 1분 뒤 다시 시도해주세요.' }, { status:429, headers:{ ...headers,'Retry-After':'60' } });
  requests.set(ip, { expires:meter && meter.expires > now ? meter.expires : now+60000, count:meter && meter.expires > now ? meter.count+1 : 1 });
  const key = JSON.stringify([params.get('pnu'),params.get('lat'),params.get('lon')]);
  const saved = cache.get(key);
  if (saved && saved.expires > now) return Response.json(saved.data, { headers });
  try {
    const data = await lookupSoil(params, values);
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires:now+6*60*60*1000, data });
    return Response.json(data, { headers });
  } catch (error) {
    return Response.json({ error:error instanceof SoilError ? error.message : '조회 서비스의 응답이 지연되거나 연결되지 않습니다. 잠시 후 다시 시도해주세요.' }, { status:error instanceof SoilError ? error.status : 502, headers });
  }
}
