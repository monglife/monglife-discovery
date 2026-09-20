import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

// 프로파일(dev / stg / prd)은 configs 서브모듈(프라이빗)의 <PROFILE>.env 에 있다.
// 접속 주소를 퍼블릭 저장소에 두지 않기 위해서다. 규칙은 그쪽 README.md.
//
// Vite 의 --mode 를 쓰지 않는다. PROFILE 환경변수로 파일을 고르고 여기서 직접 읽어
// process.env 에 올린다. VITE_ 접두사 키는 Vite 가 process.env 에서도 집어 import.meta.env 로
// 노출하므로, 클라이언트 코드는 여느 .env 와 똑같이 본다.
// 파일 이름이 .env.<모드> 가 아니라 <프로파일>.env 라 Vite 가 자동으로 읽지 않는다 —
// 프로파일 값이 섞일 일이 없다.
const PROFILE_DIR = path.resolve(__dirname, '../../configs/properties/apps/monglife-discovery-app-admin-web');

function loadProfile(profile: string) {
  const file = path.join(PROFILE_DIR, `${profile}.env`);
  if (!fs.existsSync(file)) {
    // 서브모듈이 비어 있거나 이름이 틀린 경우. 기본값(/api, MSW 켜짐)으로 뜬다.
    console.warn(`[profile] ${file} 이 없습니다. 기본값으로 실행합니다.`);
    return;
  }
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    // 셸에 이미 있는 값이 우선한다. 일시적으로 다른 백엔드를 붙일 때 덮어쓸 수 있게.
    process.env[key] ??= value;
  }
  console.log(`[profile] ${profile} (${file})`);
}

// https://vite.dev/config/
export default defineConfig(() => {
  loadProfile(process.env.PROFILE ?? 'dev');
  const apiTarget = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8010';
  const gatewayTarget = process.env.GATEWAY_PROXY_TARGET ?? 'http://127.0.0.1:8000';

  // ⚠ Origin 헤더를 떼고 넘긴다. 이게 없으면 stg/prd 백엔드가 403 "Invalid CORS request" 를 준다.
  //
  // 브라우저는 같은 출처(localhost:5173)라 프리플라이트를 보내지 않지만, POST/PUT/DELETE 에는
  // Origin: http://localhost:5173 을 붙인다. changeOrigin 은 Host 만 바꾸고 Origin 은 그대로
  // 전달하므로, 백엔드의 Spring CorsFilter 가 이를 교차 출처 요청으로 보고 env.admin.allowed-origins
  // (stg=http://100.0.0.10, prd=https://admin.monglife.cloud)에 없다며 평문 403 으로 막는다.
  // GET 은 Origin 이 안 붙어서 화면 로딩만 멀쩡해 원인을 찾기 어렵다.
  //
  // Origin 을 떼면 CorsUtils.isCorsRequest() 가 false 라 CorsFilter 를 그냥 통과한다.
  // 서버 대 서버 호출과 같아지는 것이고, 백엔드 허용 목록을 바꿀 필요가 없다.
  const stripOrigin: NonNullable<ProxyOptions['configure']> = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('origin');
    });
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      port: 5173,
      // 세 프로파일 모두 브라우저는 같은 출처 /api 로만 부르고 여기서 백엔드로 넘긴다 → CORS 없음.
      // 프로파일 차이는 아래 target 이 어디를 보느냐뿐이다(dev 127.0.0.1 / stg 100.0.0.10 / prd 100.0.0.20).
      // 게이트웨이 라우트(/api/character, /api/user)와 common-api(context-path /api)가 같은 접두사라
      // 구체적인 키를 먼저 둔다. Vite 는 선언 순서대로 첫 매치를 쓴다.
      proxy: {
        '/api/character': { target: gatewayTarget, changeOrigin: true, configure: stripOrigin },
        '/api/user': { target: gatewayTarget, changeOrigin: true, configure: stripOrigin },
        '/api': { target: apiTarget, changeOrigin: true, configure: stripOrigin },
      },
    },
  };
});
