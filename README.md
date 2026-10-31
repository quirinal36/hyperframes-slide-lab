# Hyperframes 슬라이드 만들기 실습

큰 글자와 어두운 키노트 스타일로 구성한 17장 HTML 슬라이드입니다. 각 장의 발표자 메모에는 실제 요청 문구와 시연 순서가 들어 있습니다.

배포 주소: https://hyperframes-slide-lab.letscoding.chatgpt.site/

## 실습 내용

- 텍스트 애니메이션과 반복 재생
- KOSIS CSV를 사용한 인구 피라미드와 연령 구간 계산
- 이미지 Before/After 비교
- Three.js F1 레이스카
- Matter.js 갈톤 보드
- 화면 전환효과와 두 페이지 사이의 모핑
- 지도에서 필지를 선택하는 토양특성 API 실습
- 이두근·삼두근과 뼈 움직임을 관찰하는 3D 모형

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저로 엽니다. 원본 HTML을 파일로 직접 열면 서버 API와 일부 모듈 기능은 동작하지 않습니다.

API 실습까지 실행하려면 `.env.example`을 `.dev.vars`로 복사하고 본인의 키를 입력합니다.

```sh
cp .env.example .dev.vars
```

| 설정 | 용도 |
| --- | --- |
| `SOIL_API_KEY` | 공공데이터포털 토양 API. 서버에서만 사용하며 브라우저에 전달하지 않습니다. |
| `VWORLD_API_KEY` | 브이월드 필지 조회. 소유자가 동의한 도메인 등록형 브라우저 키로, `/api/map-config`를 통해 브라우저에 전달됩니다. |

실제 키 값은 이 저장소에 포함하지 않습니다. `.dev.vars`와 로컬 환경 파일은 Git에서 제외합니다. 브이월드 키의 등록 도메인에 따라 로컬 지도 조회가 제한될 수 있습니다. 키 없이도 나머지 애니메이션·3D·물리 실습은 사용할 수 있습니다.

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `presentation/index.html` | 슬라이드 전체, 페이지 이동, 발표자 메모 |
| `public/assets/` | 이미지, JavaScript 실습 페이지, 로컬 라이브러리 |
| `public/*.csv` | 인구 피라미드 원본 데이터 |
| `app/api/soil/route.ts` | 토양 API 서버 조회, 임시 캐시와 호출 제한 |
| `app/api/map-config/route.ts` | 브이월드 브라우저 키 설정 |
| `lib/soil-codebook.json` | 공식 명세에서 정리한 토양특성 코드표 |
| `reference/soil-api-v3.hwp` | 토양 API 공식 기술명세서 |
| `.openai/hosting.json` | 기존 Sites 프로젝트 연결 정보 |

## 확인과 빌드

```sh
node scripts/check-soil.mjs
node scripts/check-arm.mjs
npm run build
```

API 실습은 인터넷과 유효한 키가 필요합니다. 토양 데이터가 없는 필지는 정보 없음으로 표시합니다. 근육 모형은 설명을 위한 단순화 모형으로, 길이 표시는 실제 인체 측정값이나 근력이 아닙니다.

## GitHub와 Sites

이 저장소는 슬라이드 원본과 변경 기록을 보관합니다. **GitHub에 push하는 것만으로 Sites가 자동 배포되도록 설정하지는 않았습니다.**

- 이 작업 폴더에서는 `github`라는 Git 원격 저장소로 연결합니다: `git push github main`
- GitHub에서 새로 clone한 폴더에서는 일반적으로 `origin`을 사용합니다: `git push origin main`
- 웹페이지 반영은 기존 Sites 프로젝트에 별도로 배포합니다. Codex에서 변경과 Sites 배포를 함께 요청할 수 있습니다.
- Sites의 실제 API 키는 Sites 환경변수에 별도로 보관합니다.

이미지·공공데이터·라이브러리의 출처와 개별 이용 조건은 각 슬라이드 메모와 `public/assets/vendor/`의 라이선스 파일을 참고하세요.
