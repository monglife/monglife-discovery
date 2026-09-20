# monglife-discovery-app-admin-web

MongLife 디스커버리 **관리자 웹**. Vite + React 18 + TypeScript + React Router + TanStack Query + Tailwind v4.

> Gradle 서브프로젝트가 **아니다.** `settings.gradle` 에 include 하지 않는다. include 하면 `apps/build.gradle` 의
> `subprojects` 가 스프링 부트 플러그인을 강제 적용하고 `copyPrivate` 가 `src/main/resources` 를 지우려 든다.
> 폴더만 `apps/` 아래에 두고 Node 로 독립 빌드한다. CI 워크플로도 아직 이 모듈을 모른다.

## 실행

```bash
nvm use            # .nvmrc → Node 24
npm install
npm run dev        # http://localhost:5173  (PROFILE=dev → 127.0.0.1:8010 실서버)
```

| 스크립트 | |
|---|---|
| `npm run dev` | 개발 서버 (dev 프로파일) |
| `npm run build` | `tsc -b` + Vite 빌드 → `dist/` |
| `npm run typecheck` / `npm run lint` / `npm run format` | |

로그인은 **이메일 인증(6자리 코드)** 이다. 실서버는 `monglife_account.role = 'ADMIN'` 인 계정 이메일로 코드를 보낸다
(local/dev 프로파일의 common-api 는 `env.mail.enabled=false` 라 코드를 서버 로그 `[mail disabled]` 에 찍는다).
목(`VITE_ENABLE_MSW=true`)에서는 `admin@monglife.cloud` 만 통과하고 코드는 브라우저 콘솔에 `[mock] email code …`, `000000` 은 항상 통과.

### 프로파일 (dev / stg / prd)

접속 주소는 퍼블릭 저장소에 두지 않는다. 프로파일 파일은 **configs 서브모듈**의
`properties/apps/monglife-discovery-app-admin-web/<PROFILE>.env` 에 있고, `vite.config.ts` 가
`PROFILE` 환경변수로 골라 읽는다(규칙·키 설명은 그쪽 `README.md`).

화면을 띄우는 건 언제나 로컬 개발 서버(`localhost:5173`)이고, **프로파일은 백엔드를 어디로 보낼지만 고른다.**

| 명령 | PROFILE | 백엔드 |
|---|---|---|
| `npm run dev` | dev (기본) | 내 PC `127.0.0.1` (:8010 common-api, :8000 게이트웨이) |
| `npm run dev:stg` | stg | stage `100.0.0.10` |
| `npm run dev:prd` | prd | **운영** `100.0.0.20` |

빌드는 `npm run build:stg` / `npm run build:prd`. 실제로 배포되는 건 prd 뿐이다
(`configs/deploy/stage` 에 edge 가 없다).

- **세 프로파일 모두 상대 경로 `/api` 다.** 브라우저는 같은 출처만 부르고, Vite 프록시가
  `/api/character`·`/api/user` 는 게이트웨이로, 나머지는 common-api 로 넘긴다.
  절대 주소로 두면 `localhost:5173` 이 `env.admin.allowed-origins` 에 없어 막힌다.
- ⚠ **프록시를 쓴다고 CORS 가 사라지지 않는다.** 브라우저 프리플라이트는 없어지지만 백엔드의
  `CorsFilter` 는 그대로 돈다. 브라우저가 같은 출처라도 POST/PUT/DELETE 에는 `Origin` 을 붙이고,
  `changeOrigin` 은 `Host` 만 바꾸기 때문이다. 그대로 두면 stg/prd 가 평문 403 `Invalid CORS request`
  를 주고 화면은 "서버가 JSON 이 아닌 응답을 보냈습니다" 로 뜬다. GET 은 `Origin` 이 안 붙어
  화면 로딩만 멀쩡하니 **로그인 같은 POST 에서만 터진다.**
  → `vite.config.ts` 가 세 프록시 규칙 모두에서 `Origin` 헤더를 떼어 해결한다. 백엔드는 안 건드린다.
- `build:prd` 산출물도 같은 `/api` 로 동작한다. `admin.monglife.cloud` 의 인그레스가 같은 호스트
  `/api/` 를 common-api 로 넘기기 때문이다(`configs/deploy/product/edge`). 이쪽은 진짜 같은 출처라
  `Origin` 문제가 없다.
- `100.0.0.x` 는 사설 IP 라 **VPN 안에서만 닿는다.**
- ⚠ `dev:prd` 는 로컬 화면에서 실제 운영 데이터를 보고 고친다. 조회 외 동작은 신중히.
- `--mode` 를 쓰지 않는다. `<프로파일>.env` 라 Vite 가 자동으로 읽지 않는다.
- 서브모듈이 비어 있으면 기본값(`/api`, MSW 켜짐)으로 뜬다. 목 모드로 돌리려면 프로파일의
  `VITE_ENABLE_MSW=true`.

## 구조

```
src/
  main.tsx                MSW 부트(VITE_ENABLE_MSW) → <App/>
  App.tsx                 Providers + RouterProvider
  styles/
    tokens.css            ★ 디자인 토큰(CSS 변수). 클로드 디자인 싱크 시 이 값만 교체
    index.css             @import tailwindcss + @theme inline 으로 토큰을 유틸리티에 매핑
  app/
    router.tsx            라우트 트리
    nav.ts                사이드바 메뉴 (기능 정의 0~4 순서)
    providers.tsx         QueryClient, AuthProvider
    layout/               AdminLayout / Sidebar / Header
  shared/
    api/client.ts         fetch 래퍼 — Authorization 헤더, ResponseDto 언래핑, 401 → /login
    api/types.ts          ResponseDto / PageResponseDto (백엔드 monglife-core 와 1:1)
    auth/                 AuthProvider · useAuth · tokenStorage · ProtectedRoute
    ui/                   ★ 최소 프리미티브 — 디자인 싱크 시 교체 대상
    components/           DataTable · StatCard · ConfirmDialog · SearchInput
  features/<기능>/
    types.ts              도메인 타입 (엔티티 기준)
    api.ts                엔드포인트 경로 — 실 API 가 생기면 여기만 수정
    queries.ts            TanStack Query 훅
    pages/                화면
  mocks/
    data/db.ts            인메모리 fixture (결정적 난수, 새로고침 전까지 변경 유지)
    handlers/*.ts         MSW 핸들러 — 위 api.ts 계약을 그대로 구현
```

| 경로 | 기능 |
|---|---|
| `/` | 0. 통계 — 사용자 현황, 로그인 추이, 일일 가입자 |
| `/accounts`, `/accounts/:id` | 1.1 계정 관리 (상세: 기기·로그인 이력·토큰 탭), 1.3 기기 연결/해제 |
| `/devices` | 1.2 기기 관리 (상세 모달, 삭제) |
| `/sessions` | 2.1 로그인 사용자 현황, 2.2 토큰 상세·만료(로그아웃) |
| `/app-versions` | 3. 앱 버전 등록·강제 업데이트 ON/OFF |
| `/notifications` | 4. 알림 가능 기기 조회·푸시 전송 |
| `/error-reports`, `/error-reports/:id` | 사용자 오류 신고 목록·상세·답변(이메일) |

## API 계약

common-api 가 구현한 경로이자 MSW 핸들러의 계약이다 (`apps/monglife-discovery-app-common-api` 의 `admin/`, `adminauth/`, `feedback/`).
응답은 전부 `ResponseDto { code, message, result }`, 목록은 `PageResponseDto { page, size, totalPage, isLastPage }` + `X-Total-Count` 헤더.
목록은 `sort=field,asc|desc`(Spring Pageable 스타일) 와 아래 필터 파라미터를 받는다.

```
GET    /admin/accounts?page&size&query&platform&role&status(ACTIVE|DELETED)&sort(accountId|createdAt)
GET    /admin/accounts/:id            /devices   /login-histories
PATCH  /admin/accounts/:id            { name?, role?, isDeleted? }
GET    /admin/devices?page&size&query&unmappedOnly&fcm(REGISTERED|NONE)&deviceName&sort(createdAt)   (accountEmail/accountName 조인)
PUT    /admin/devices/:deviceId/account   { accountId }      DELETE 동일 경로 → 해제
DELETE /admin/devices/:deviceId           기기 삭제 (토큰도 함께)
GET    /admin/sessions?page&size&deviceName&appPackageName&buildVersion&sort(createdAt)   (토큰 + 계정 요약)
GET    /admin/sessions/tokens?page&size&accountId
DELETE /admin/sessions/:refreshToken      DELETE /admin/sessions/accounts/:accountId
GET    /admin/app-versions
POST   /admin/app-versions                { appPackageName, buildVersion, mustUpdate }
PATCH  /admin/app-versions/:id            { mustUpdate }
DELETE /admin/app-versions/:id
GET    /admin/notification/devices?page&size&query&accountId&deviceName
POST   /admin/notification/mongs          { accountId, title, body }   ← 실존
GET    /admin/error-reports?page&size&query&status&deviceName&appPackageName&buildVersion&sort(reportId|createdAt)
GET    /admin/error-reports/:id
GET    /admin/meta/filters                { deviceNames[], appPackageNames[], buildVersions[] }  필터 셀렉트 옵션
POST   /admin/error-reports/:id/replies   { content }  → 신고자 이메일로 발송, 응답 { content, sentTo, createdAt } (답변 1회, 재답변은 덮어씀)
POST   /feedback                          { deviceName, title, content }  앱이 부른다 (패키지·버전은 토큰에서)
GET    /admin/stats/users                 { todayJoined, weekJoined, totalAccounts, inactiveAccounts(30일 미로그인), activeSessions }
GET    /admin/stats/logins?days           GET /admin/stats/signups?days
POST   /public/admin/auth/email/code      { email } → { expiresIn, resendAfter }   403 NOT_ADMIN_ACCOUNT · 429 재발송 제한
POST   /public/admin/auth/email/verify    { email, code } → { accountId, accessToken, refreshToken }   400 INVALID_CODE · 410 EXPIRED_CODE
POST   /public/auth/logout
```

### mongs(게임) 관리 API — 게이트웨이 경유

`monglife-mongs` 저장소의 `/admin/**` 이다. common-api 가 아니라 **게이트웨이**(`VITE_GATEWAY_BASE_URL`)로
부른다 — 토큰 검증·패스포트 발급이 거기에 있고, mongs 는 패스포트의 `role` 로 `/admin/**` 을 막는다.
`src/shared/api/client.ts` 의 `mongsApi` 가 그 베이스를 쓴다. 응답 봉투·페이지 규약은 위와 같다.

```
# MONGS-USER
GET    /user/admin/notices?page&size&query&sort(noticeId|createdAt)     숨김 포함
GET    /user/admin/notices/:id
POST   /user/admin/notices                { title, content }            작성자는 패스포트에서
PUT    /user/admin/notices/:id            { title, content }
PATCH  /user/admin/notices/:id/hide       { isHided }
DELETE /user/admin/notices/:id
GET    /user/admin/members?page&size&accountId&sort(accountId|starPoint|slotCount|createdAt)
GET    /user/admin/members/:accountId
PATCH  /user/admin/members/:accountId/star-point    { delta, reason? }  음수면 차감. MQTT 로 앱에 즉시 반영
PATCH  /user/admin/members/:accountId/slot-count    { slotCount }
GET    /user/admin/members/:accountId/collections/maps   /mongs
POST   /user/admin/members/:accountId/collections/maps   /mongs   { code }   수동 지급
GET    /user/admin/orders?page&size&accountId&productId&sort(orderId|createdAt|price)
GET    /user/admin/orders/:orderId        { order, starPoint, inAppOrder }   구글 조회 실패 시 inAppOrder=null
POST   /user/admin/orders/:orderId/reconsume    미소비 주문 재처리
GET    /user/admin/steps/:accountId       DELETE 동일 경로 → 일일 환전 상한 초기화
GET    /user/admin/stats                  { totalMembers, todayJoined, totalStarPoint, totalOrders, todayOrders, todayOrderAmount }
GET    /user/admin/master/map-types       /exchange-star-point-products

# MONGS-CHARACTER
GET    /character/admin/mongs?page&size&accountId&stateCode&statusCode&query&sort(mongId|createdAt|exp|payPoint|accountId)
GET    /character/admin/mongs/:mongId
PATCH  /character/admin/mongs/:mongId/status   { weight?, strength?, satiety?, healthy?, fatigue?, exp?, payPoint?, poopCount?, randomDrawTicketCount?, reason? }
PATCH  /character/admin/mongs/:mongId/state    { stateCode, reason? }   DEAD 복구 포함. 스케줄을 다시 건다
DELETE /character/admin/mongs/:mongId          스케줄까지 정리
GET    /character/admin/mongs/:mongId/tasks    POST /character/admin/mongs/tasks/:taskId/pause | /resume
GET    /character/admin/mongs/:mongId/inventories?page&size
POST   /character/admin/mongs/:mongId/inventories   { inventoryCode, inventoryTypeCode(FOOD|SNACK) }
GET    /character/admin/accounts/:accountId/evolution-histories
GET    /character/admin/stats             { totalMongs, todayCreated, countByState, countByStatus, scheduledTasks }
GET    /character/admin/master/mong-types | /foods | /snacks | /training-types | /random-draws
GET    /character/admin/battle/queue       DELETE /character/admin/battle/queue/:mongId   배팅 환불 포함
GET    /character/admin/battle/matches?page&size&stateCode&accountId&sort(matchId|createdAt)
GET    /character/admin/battle/matches/:matchId
POST   /character/admin/battle/matches/:matchId/terminate   보상 없이 END 로 마감
GET    /character/admin/battle/stats
GET    /character/admin/ping · /user/admin/ping    게이트웨이→패스포트→ADMIN 권한 경로 확인용
```

마스터 데이터는 **읽기 전용**이다. 값 수정은 Caffeine 캐시(5분)·`SqlInitConfig` 시드와 엇갈려서 SQL 배포로 둔다.

**MSW 목은 mongs 쪽에 없다.** 네 프로파일 모두 `VITE_ENABLE_MSW=false` 라 지금은 쓰이지 않는다 —
필요해지면 `src/mocks/handlers/` 에 추가한다.

## 다음 단계 (이 모듈 밖)

- ~~토큰 재발급~~ → `src/shared/api/client.ts` 가 401 을 받으면 `/public/auth/reissue` 로 한 번 재발급하고 재시도한다.
- ~~CORS 또는 동일 출처~~ → 배포는 인그레스로 동일 출처, 개발 서버는 Vite 프록시 + `Origin` 제거로 정리.
  common-api `SecurityConfig` 의 `env.admin.allowed-origins` 는 배포 출처만 담으면 된다.
- ~~정적 호스팅~~ → `configs/deploy/product/edge` 의 `monglife-admin` 컨테이너 + 인그레스 `admin.monglife.cloud` 블록.
  `build:prd` 산출물(`dist/`)을 서버 `~/edge/build/monglife-admin/dist` 로 보내고 `./service.sh up`.
- **Node CI/CD.** `.github/actions/ci/build-test` 는 Gradle 전용이라 별도 워크플로(`cd-admin`)가 필요하다. 아직 없다 — 위 배포는 수동.
