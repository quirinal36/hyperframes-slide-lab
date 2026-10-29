// VWorld's domain-bound browser API uses JSONP, as in its official examples.
let soilMapConfig;
async function soilParcel(point, signal) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || point.lat<33 || point.lat>39.5 || point.lng<124 || point.lng>132) throw new Error('대한민국 육지의 위치를 선택해주세요.');
  soilMapConfig ??= fetch('/api/map-config').then(async response=>{const config=await response.json();if(!response.ok)throw new Error(config.error);return config}).catch(error=>{soilMapConfig=null;throw error});
  const config=await soilMapConfig;
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const parcel=await new Promise((resolve,reject)=>{
    const callback='soilParcel_'+crypto.randomUUID().replaceAll('-',''),script=document.createElement('script');let finished=false;
    const cleanup=(late=false)=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);script.remove();if(late){window[callback]=()=>{};setTimeout(()=>delete window[callback],60000)}else delete window[callback]};
    const fail=error=>{if(finished)return;finished=true;cleanup(true);reject(error)};
    const abort=()=>fail(new DOMException('Aborted','AbortError'));
    const timeout=setTimeout(()=>fail(new Error('필지 조회 응답이 지연됩니다. 잠시 후 다시 선택해주세요.')),20000);
    window[callback]=data=>{if(finished)return;finished=true;cleanup();resolve(data)};
    script.onerror=()=>fail(new Error('브이월드 필지 서비스에 연결할 수 없습니다.'));
    const url=new URL('https://api.vworld.kr/req/data');
    url.search=new URLSearchParams({service:'data',request:'GetFeature',version:'2.0',data:'LP_PA_CBND_BUBUN',geomFilter:`POINT(${point.lng} ${point.lat})`,crs:'EPSG:4326',geometry:'false',attribute:'true',size:'1',format:'json',domain:config.domain,key:config.key,callback});
    signal.addEventListener('abort',abort,{once:true});script.src=url.href;document.head.append(script);
  });
  if(parcel.response?.status==='NOT_FOUND')throw new Error('이 위치의 필지를 찾지 못했습니다. 농경지를 확대해서 선택해주세요.');
  if(parcel.response?.status!=='OK')throw new Error('필지 조회가 완료되지 않았습니다. 잠시 후 다시 선택해주세요.');
  const properties=parcel.response.result?.featureCollection?.features?.[0]?.properties;
  if(typeof properties?.pnu!=='string'||!/^\d{19}$/.test(properties.pnu))throw new Error('이 위치의 필지번호를 확인할 수 없습니다.');
  return {pnu:properties.pnu,address:String(properties.addr??'선택한 필지').slice(0,180)};
}
