import codebook from './soil-codebook.json' with { type: 'json' };

export class SoilError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function xmlValue(xml, tag) {
  return xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1].trim() ?? '';
}
export function decodeSoil(xml, pnu) {
  const result = xmlValue(xml, 'Result_Code');
  if (result === '301') throw new SoilError(404, '해당 필지에 등록된 토양특성 정보가 없습니다. 주변 농경지를 선택해보세요.');
  if (result !== '200') throw new SoilError(502, '토양 API가 조회를 완료하지 못했습니다. 인증 상태나 일일 호출 한도를 확인해주세요.');
  const records = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => {
    if (xmlValue(match[1], 'PNU_Cd') !== pnu) throw new SoilError(502, '응답의 필지번호가 요청한 필지와 일치하지 않습니다.');
    return codebook.map(({ field, label, codes }) => {
      const code = xmlValue(match[1], field);
      return { field, label, code: /^\d{2}$/.test(code) ? code : null, value: code ? (codes[code] ?? '정의되지 않은 코드') : '미제공' };
    });
  });
  if (!records.length) throw new SoilError(404, '해당 필지의 토양특성 정보가 없습니다.');
  return records;
}
export async function lookupSoil(params, env, fetcher = fetch) {
  let pnu = params.get('pnu'), address = '필지번호로 직접 조회', coordinates = null;
  if (!env.SOIL_API_KEY) throw new SoilError(503, '토양 API 연결을 준비하고 있습니다.');
  if (pnu !== null) {
    if (!/^\d{19}$/.test(pnu)) throw new SoilError(400, '필지번호는 19자리 숫자로 입력해주세요.');
  } else {
    const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
    if (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < 33 || lat > 39.5 || lon < 124 || lon > 132)
      throw new SoilError(400, '대한민국 육지의 위치를 선택해주세요.');
    if (!env.VWORLD_API_KEY) throw new SoilError(503, '지도 위치를 필지번호로 바꾸는 브이월드 키 연결을 기다리고 있습니다. 아래 필지번호 직접 조회는 사용할 수 있습니다.');
    coordinates = { lat, lon };
    const parcelUrl = new URL('https://api.vworld.kr/req/data');
    parcelUrl.search = new URLSearchParams({ service:'data', request:'GetFeature', version:'2.0', data:'LP_PA_CBND_BUBUN', geomFilter:`POINT(${lon} ${lat})`, crs:'EPSG:4326', geometry:'false', attribute:'true', size:'1', format:'json', domain:'https://hyperframes-slide-lab.letscoding.chatgpt.site', key:env.VWORLD_API_KEY });
    const parcelResponse = await fetcher(parcelUrl, { signal:AbortSignal.timeout(15000) });
    if (!parcelResponse.ok) throw new SoilError(502, '필지 조회 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    const parcel = await parcelResponse.json();
    const response = parcel.response;
    if (response?.status === 'NOT_FOUND') throw new SoilError(404, '이 위치의 필지를 찾지 못했습니다. 육지의 농경지를 확대해서 선택해주세요.');
    if (response?.status !== 'OK') throw new SoilError(502, '브이월드 필지 조회가 실패했습니다. 인증키의 도메인과 데이터 API 권한을 확인해주세요.');
    const properties = response.result?.featureCollection?.features?.[0]?.properties;
    pnu = properties?.pnu;
    if (typeof pnu !== 'string' || !/^\d{19}$/.test(pnu)) throw new SoilError(404, '이 위치의 필지번호를 확인할 수 없습니다.');
    address = String(properties.addr ?? properties.fulladdr ?? '선택한 필지').slice(0, 180);
  }
  const soilUrl = new URL('https://apis.data.go.kr/1390802/SoilEnviron/SoilCharac/V3/getSoilCharacter');
  soilUrl.search = new URLSearchParams({ serviceKey:decodeURIComponent(env.SOIL_API_KEY), PNU_CD:pnu });
  const response = await fetcher(soilUrl, { signal:AbortSignal.timeout(20000) });
  if (!response.ok) throw new SoilError(502, '토양 API에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
  const xml = await response.text();
  if (xml.length > 200000) throw new SoilError(502, '토양 API의 응답 형식을 확인할 수 없습니다.');
  return { pnu, address, coordinates, records:decodeSoil(xml, pnu), source:'농촌진흥청 국립농업과학원 · 토양도 기반 토양특성 상세정보 V3', queriedAt:new Date().toISOString() };
}
