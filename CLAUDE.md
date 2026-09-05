# monglife-discovery

MongLife 의 디스커버리 백엔드. Java 17 / Spring Boot 3.1.1 / Gradle 8.5 멀티모듈.

```
apps/
  monglife-discovery-app-eureka        서비스 레지스트리        :8761 (관리 :7761)
  monglife-discovery-app-gateway       API 게이트웨이           :8000 (관리 :7000, local·dev :7001)
  monglife-discovery-app-common-api    인증/알림/기기 API       :8010, context-path /api
domains/
  monglife-discovery-domain-account    계정·토큰·로그인이력 (MySQL + Redis)
  monglife-discovery-domain-device     기기·앱버전 (MySQL)
clients/
  monglife-discovery-client-fcm        Firebase Admin SDK 래퍼
configs/                               ← 설정 서브모듈 (MongLife/monglife-discovery-sub)
```

`apps` 만 실행 가능한 부트 jar 를 만든다(`bootJar`). `domains` / `clients` 는 라이브러리 jar 다.
공통 라이브러리(`monglife-core`, `monglife-module-common-*`)는 jitpack 에서 받고, 버전은 루트
`build.gradle` 의 `buildscript.ext` 에 모여 있다.

게이트웨이는 `/api/character/**` → `MONGS-CHARACTER`, `/api/user/**` → `MONGS-USER` 로 라우팅하고,
토큰 검증·패스포트 발급은 WebClient 로 `MONGLIFE-COMMON`(common-api) 을 호출한다.
**common-api 자체는 게이트웨이 라우트 대상이 아니다.**

---

## 설정은 `configs` 서브모듈에서만 관리한다

**이 저장소에는 어떤 설정 파일(`*.yml`)도 두지 않는다.** 새로 만들지도, 수정하지도 않는다.

> ⚠️ **이 저장소는 퍼블릭이다.** 비밀번호·키·토큰·접속 정보를 코드에도 문서에도 적지 않는다.
> 값이 필요하면 `configs`(프라이빗) 안의 위치를 가리키기만 한다. 한 번 커밋하면 파일에서
> 지워도 히스토리에 남으므로, 노출된 값은 **교체**하는 수밖에 없다.

`*/src/main/resources/*.yml`, `*.json`, `*.xml`, `*.sql` 은 **빌드 산출물**이다. 루트 `build.gradle` 의
`copyPrivate` 태스크가 만들어내고 `.gitignore` 가 걸려 있다. 직접 편집해도 다음 빌드에 사라진다.

```
configs/properties/<parentModule>/<currentModule>/*.{yml,json,xml,sql}
        │   copyPrivate: src/main/resources 의 기존 파일을 지우고 → 복사
        ▼
<currentModule>/src/main/resources/
```

`<parentModule>`/`<currentModule>` 은 Gradle 프로젝트 경로에서 온다.
`:domains:monglife-discovery-domain-account` → `configs/properties/domains/monglife-discovery-domain-account/`

### 개발 중 설정 변경이 필요할 때

설정은 서브모듈에 있고, 서브모듈은 **별도 저장소**(`MongLife/monglife-discovery-sub`, 프라이빗)다.
`configs/` 안에서 고친 것은 이 저장소의 커밋에 담기지 않는다. 순서가 있다.

```bash
# 1) 서브모듈에서 수정하고 커밋·푸시한다
cd configs
#    (편집: properties/... 아래 yml)
git add -A && git commit -m "..." && git push origin main
cd ..

# 2) 이 저장소에서 서브모듈 포인터를 커밋한다  ← 빼먹기 쉽다
git add configs && git commit -m "chore: configs 서브모듈 갱신"
```

**2번을 빼먹으면 배포에 반영되지 않는다.** 워크플로가 `submodules: true` 로 체크아웃하는데 포인터가
옛 커밋을 가리키면 옛 설정으로 빌드된다. 새로 추가한 키가 없으면 **기동 실패**로 이어진다.
`git status` 에 ` M configs` 가 남아 있다면 아직 포인터를 커밋하지 않은 것이다.

설정 파일의 이름 규칙·프로파일 규칙·시크릿 취급은 `configs/CLAUDE.md` 에 있다. 요약하면:

- 프로파일은 `local` / `dev` / `stg` / `prd` 네 개다. **키를 추가하면 네 개 전부에 넣는다.**
  코드가 `@Value` 에 기본값을 두지 않는 관례라 하나라도 빠지면 그 환경은 기동에 실패한다.
- `@Value` 는 YAML 리스트를 `List<String>` 으로 받지 못한다. 여러 값은 콤마 구분 문자열로 쓴다.
- `domain-account.yml` 같은 이름은 스프링 기본 규칙으로 로드되지 않는다. `main()` 의
  `spring.config.name`(`application,client,domain`) 과 `application.yml` 의 `profiles.include` 조합으로
  결정된다. **새 설정 파일은 파일만 만들어서는 로드되지 않는다.**
- **`*.sql` 은 스프링이 이름으로 찾아 주지 않는다.** 복사만 될 뿐이라 읽는 쪽을 코드에 만들어야 한다.
  지금은 `app_version.sql` 하나이고 device 모듈의 `SqlInitConfig` 가 `classpath:` 로 읽어
  **매 기동마다** 돌린다. 스크립트가 `INSERT IGNORE` 라 이미 있는 행은 건너뛰고 새로 추가된
  것만 들어가므로 프로파일로 가르지 않는다. `INSERT IGNORE` 때문에 local 의 H2 URL 에서
  `MODE=MySQL` 을 빼면 안 된다.
  (`spring.sql.init.*` 은 자동 구성된 단일 데이터소스에만, `hbm2ddl.import_files` 는 스키마
  **생성** 시에만 — `update`/`none` 에선 안 돈다 — 걸려서 둘 다 못 쓴다)

---

## 빌드 / 테스트 / 실행

```bash
./gradlew copyPrivate                                       # 설정을 서브모듈에서 리소스로 복사
./gradlew :apps:monglife-discovery-app-common-api:build      # 빌드 + 테스트
./gradlew :apps:monglife-discovery-app-common-api:test
```

`copyPrivate` 는 CI/CD 워크플로가 빌드 전에 실행한다. 로컬에서 처음 빌드하거나 서브모듈을 갱신한 뒤에는
직접 한 번 돌려야 한다.

자바 버전은 `apps` / `domains` / `clients` 각 `build.gradle` 의 `subprojects` 에 선언한 **toolchain
(17)** 이 결정한다. 실행 JDK 가 21 이어도 17 바이트코드가 나온다. 배포 이미지가 `eclipse-temurin:17-jre`
라 21 로 컴파일되면 `UnsupportedClassVersionError` 로 기동에 실패한다.

> 루트 `build.gradle` 의 `subprojects` 안에서는 `java { }` 를 쓸 수 없다. 그 시점엔 자바 플러그인이
> 서브프로젝트에 아직 적용되지 않아 Groovy 가 **owner(루트 프로젝트)** 로 폴백하고, 에러 없이 조용히
> 루트만 설정된다. 실제로 이 함정 때문에 `sourceCompatibility = 17` 이 오래 무시되고 있었다.

테스트는 현재 `apps/monglife-discovery-app-common-api/src/test` 에만 있다. 다른 모듈에 테스트를
추가한다면 **그 모듈 `build.gradle` 에 `useJUnitPlatform()` 을 넣어야 한다.** spring-boot 플러그인이
자동으로 넣어주지 않아, 없으면 **테스트가 0개 실행되고도 `BUILD SUCCESSFUL`** 이 난다.

### 로컬 실행

`local` 프로파일은 외부 인프라 없이 뜨도록 되어 있다. DB 는 H2 인메모리이고 스키마는 엔티티에서
생성된다(`hbm2ddl: create-drop`). Kafka 는 원격을 쓴다.

**Redis 만 대체 불가하다.** `TokenEntity` 가 `@RedisHash` 이고 `RedisConfig` 가
`enableKeyspaceEvents = ON_STARTUP` 이라 기동 시점에 실제 연결이 필요하다.

비밀번호는 `configs/properties/domains/monglife-discovery-domain-account/domain-account.yml` 의
`local` 프로파일 `spring.data.account.redis.password` 와 같은 값을 쓴다.

```bash
docker run -d --name monglife-local-redis -p 6379:6379 \
  redis:7-alpine redis-server --requirepass '<domain-account.yml 의 local redis password>'

./gradlew :apps:monglife-discovery-app-common-api:bootRun --args='--spring.profiles.active=local'
```

H2 드라이버는 두 도메인 모듈에 `runtimeOnly` 로 선언돼 있다(`mysql-connector-j` 옆). `runtimeClasspath`
에 있어야 IntelliJ 실행 구성이나 `java -cp` 로 띄울 때도 동작하므로 `developmentOnly` 를 쓰지 않는다.

게이트웨이를 로컬에서 띄운다면 관리 포트가 **7001** 이다. macOS 의 ControlCenter(AirPlay Receiver) 가
7000 을 점유한다.

---

## 브랜치와 배포

| 브랜치 | 워크플로 | 동작 |
|---|---|---|
| `develop` | `ci` | 세 모듈 빌드·테스트 (matrix) |
| `stage` | `cd-stg` | 빌드·테스트 → STAGE 서버 배포 |
| `release` | `cd-prd` | 빌드·테스트 → 운영 배포 |

### 워크플로 파일은 트리거만, 처리 과정은 composite action 에 있다

```
.github/
  actions/
    ci/build-test/action.yml   빌드·테스트·JUnit 리포트·버전 추출·jar 업로드
    cd/deploy/action.yml       .version 생성 → 산출물 구성 → scp → service.sh up
  workflows/                트리거와 job 배선만
    ci.yml         모듈 셋을 matrix 로 가른다
    cd-stg.yml     cd-prd.yml
```

> ⚠ **`.github/workflows/` 하위 폴더는 GitHub 이 읽지 않는다.** `workflows/ci/`, `workflows/cd/`
> 로 옮기면 에러 없이 **조용히 전부 실행되지 않는다.** composite action 은 경로 제약이 없어서
> `ci` / `cd` 분리를 `.github/actions/` 쪽에 두었다.
>
> 액션 폴더 이름이 `build-test` 인 것은 `.gitignore` 의 `build/` 때문이다. `ci/build/` 로 두면
> **`git add` 가 조용히 건너뛴다.** 새 액션 폴더를 만들 때 `git status` 에 뜨는지 확인할 것.
>
> 같은 이유로 **artifact 로 올릴 디렉터리는 점으로 시작하면 안 된다.** `upload-artifact` 는
> v4.4.0 부터 숨김 파일을 기본 제외해서(`include-hidden-files: false`), `.ci-jars/` 로 두면
> glob 결과가 0건이 되고 `No files were found with the provided path` 로 끊긴다.

세 워크플로가 액션 둘을 공유한다. **본문을 고칠 일이 있으면 액션을 고친다.** 워크플로 파일에는
트리거·`environment`·입력값만 있어서, 예전처럼 "한쪽만 고치고 다른 쪽을 빠뜨리는" 사고가 나지 않는다.

**파이프라인은 모듈별로 쪼개지 않는다.** 쪼개는 것은 모듈을 따로 릴리스할 수 있을 때 의미가 있는데,
세 서비스는 `docker-compose.yml` 하나로 같이 뜨고 `service.sh up` 이 통째로 재기동한다. 배포 단위가
하나다. 그래서 `ci.yml` 도 파일 하나이고, 어느 모듈이 깨졌는지는 matrix 로 갈라 보여 준다.
(CD 의 `ci` job 은 jar 셋을 artifact 하나로 묶어야 해서 matrix 로 가르지 않고 한 job 이다)

로컬 액션(`uses: ./.github/actions/...`)은 워크스페이스에서 읽히므로 **`actions/checkout` 이 먼저
와야 한다.** 그래서 체크아웃 스텝만 워크플로 파일에 남아 있다. composite action 안에서는 `secrets`
컨텍스트를 쓸 수 없어 접속 정보를 input 으로 넘기고, `environment` 도 설정할 수 없어 job 에 남긴다.

### STAGE / PRODUCT (`cd-stg` / `cd-prd`)

두 job 이다. **`ci` 가 빌드·테스트하고 `deploy` 가 `needs: ci` 로 그 뒤에 붙는다.** 테스트가 깨지면
`deploy` 는 시작조차 하지 않아 서버에 SSH 로 붙기 전에 멈춘다. 빌드는 한 번만 하고, jar 세 개는
`discovery-jars` artifact 로 두 job 사이를 건넌다.

`ci` job 에는 `environment` 를 걸지 않는다. 배포 시크릿(`HOST` / `SSH_KEY`)이 `deploy` job 에만
노출되게 하려는 것이다. `ACTION_TOKEN` 은 `ci.yml` 이 그러듯 저장소 레벨 시크릿이라 전제한다 —
`ci` job 의 서브모듈 체크아웃이 실패한다면 그 토큰이 Environment 에만 있다는 뜻이니, 그때는 `ci`
job 에도 `environment` 를 붙인다.

빌드 → `~/service/discovery` 로 전송 → 서버의 **`./service.sh up`** 호출이다.
워크플로가 compose 를 직접 부르지 않는다. 사전 검사(필수 키·로그 디렉터리·네트워크·jar 존재)와
기동 확인이 전부 `service.sh` 안에 있어서, 서버에서 손으로 돌릴 때도 같은 검사를 받는다.

**배포는 discovery 스택만 교체한다.** 같은 서버의 나머지 스택은 손대지 않는다.

```
/home/monglife/                  ← configs/deploy/<환경>/ 트리가 그대로 펼쳐진다
  global/
    .env                         모든 스택이 공유. 서버에서만 관리
    batch/ssl.sh                 인증서 발급·갱신 (product 에만)
    batch/status_all.sh          모든 스택의 컨테이너 상태를 표 하나로 (-f 로 실시간)
    batch/net_reset.sh           네트워크 선언·실제 대역 대조, 재생성·잔재 정리
    install/exporter/            node·mysqld·redis exporter 를 호스트 systemd 서비스로
    logs/<컨테이너명>/            모든 스택의 로그가 여기로 모인다
  storage/                       MySQL / Redis / MQTT / Zookeeper / Kafka
  elk/                           Elasticsearch / Logstash / Kibana. **stage 에만 있다**
  monitor/                       Prometheus / Grafana. **stage 에만 있다**
  edge/                          리버스 프록시(nginx). 단일 인그레스. **product 에만 있다**
  service/
    discovery/                   ← 배포 대상
      .env                       서버에서만 관리. 워크플로가 전송하지 않는다
      .compose                 ┐
      service.sh               │
      docker-compose.yml       ├ 워크플로가 매 배포마다 덮어쓴다
      spring-boot-docker-file  │
      .dockerignore            │
      .version                 ┘ 빌드한 모듈 버전. 워크플로가 만든다
      build/monglife-discovery-app-{eureka,gateway,common-api}.jar
  tool/                          Portainer / mailserver. **stage 에만 있다**
```

- **두 환경의 구조가 완전히 같지는 않다.** discovery / storage 는 같고, `nginx` 는 product 에만,
  `elk` · `monitor` · `tool` 은 stage 에만 있다. **`service/` 아래에는 CD 가 배포하는 것만 둔다**
  — 지금은 `discovery` 하나뿐이고, 나머지 스택은 전부 환경 루트에 바로 놓인다.
- **인그레스는 product nginx 하나다.** stage 에는 nginx 가 없다. `stg.*` 도메인은 product 가
  TLS 를 종단한 뒤 사설망으로 stage 호스트에 넘기고, `mail` 은 nginx 의 `stream` 블록이
  L4 로 패스스루한다. 그래서 **stage discovery 가 호스트에 퍼블리시하는 포트가 실제 진입점**이며,
  방화벽에서 product 에서만 닿도록 막아야 한다.
- 시크릿은 GitHub Environment(`stage` / `product`)에 둔다. 이름은 양쪽 같다:
  `HOST` `PORT` `USERNAME` `SSH_KEY` `ACTION_TOKEN`. 두 워크플로는 `name` · 트리거 브랜치 ·
  `env.deploy_env` · `jobs.deploy.environment` 넷만 다르고 나머지는 액션이 처리하므로,
  **넷 중 하나를 고칠 때만** 양쪽을 같이 본다.
- 네트워크는 전부 external 이고 **서브넷을 `.compose` 에 고정**한다(`storage-net:20.0.0.0/24`
  처럼). 안 박으면 도커가 그때 비어 있는 /16 을 집어, 다시 만들 때 대역이 바뀌고 MySQL 의
  `'exporter'@'20.0.0.%'` 같은 접속 출처 제한이 조용히 깨진다.
  `service-net`(프록시 공유)은 없으면 만들고,
  **`storage-net`(MySQL/Redis/Kafka)은 만들지 않고 없으면 중단한다.** 빈 네트워크가 생기면
  컨테이너 이름 DNS 가 조용히 실패하기 때문이다.
- **`.env` 에 키가 없으면 compose 는 빈 문자열로 치환하고 경고만 낸다.** 포트라면 `":8761"` 이 되어
  기동이 깨진다. `service.sh` 가 `.compose` 의 `STACK_REQUIRED_KEYS` 로 기동 전에 끊으니,
  compose 변수를 늘리면 그 목록도 함께 늘린다.
- `.env` 의 `*_HOST` 는 `storage-net` 위 **컨테이너 이름**, `*_PORT` 는 **컨테이너 포트**다.
- **컨테이너에 넣는 환경변수 이름은 `UPPER_SNAKE` 로 쓴다.** `Dockerfile` 의 ENTRYPOINT 가
  `sh -c` 라 `JAVA_OPTS` 를 단어 분리해 넘기는데, 그 셸(`dash`)이 **점이 들어간 이름
  (`db.host`)을 유효한 식별자가 아니라며 버린다.** 그러면 yml 의 `${db.host}` 가 치환되지 않아
  `Failed to parse the host:port pair '${db.host}:${db.port}'` 로 기동에 실패한다.
  `DB_HOST` 로 주면 스프링의 relaxed binding 이 `${db.host}` 를 찾아준다.
- **`.env` 는 서버에서 손으로 만든다.** 워크플로도, 어떤 스크립트도 만들어 주지 않는다.
  `~/global/.env` 도 마찬가지다. 저장소의 `deploy/*/**/.env` 는 **참고용 사본**이라 서버와
  갈라질 수 있다 — 값을 바꿨으면 서버에도 손으로 반영한다.
- **`docker compose up -d` 는 컨테이너를 만들기만 하면 0 을 돌려준다.** 앱이 부팅 도중 죽어도
  `restart` 정책이 되살려서, 확인이 없으면 기동 실패가 CD 초록불로 끝난다. `service.sh` 가
  `.compose` 의 `STACK_HEALTH` 로 실제 기동을 확인하고, 실패하면 컨테이너 로그를 찍고 비정상 종료한다.

서버 트리의 상세와 조작법(`service.sh` / `.compose` 의 `STACK_*` 규칙 포함)은 `configs/CLAUDE.md` 에 있다.

배포 순서는 **configs 푸시 → 서브모듈 포인터 커밋 → 코드 푸시** 다. 롤백할 때는 반대로 **코드부터**
되돌린다. 코드를 되돌리면 configs 에 남은 키는 잉여값일 뿐이지만, configs 만 되돌리고 코드를 남기면
기동에 실패한다.

> ⚠️ 운영 이관 시 확인할 것
> - 컨테이너 이름이 `monglife-discovery-common` → **`monglife-discovery-common-api`** 로 바뀐다.
>   옛 이름의 컨테이너가 남아 포트를 물고 있으면 먼저 지운다.
> - 배포마다 **eureka 까지 재기동**한다. 레지스트리가 잠시 비므로 운영에서 무중단이 필요하면
>   eureka 를 배포 대상에서 빼는 것을 검토한다.
> - 옛 `~/batch/service.sh` 와 `~/docker` 경로는 더 이상 쓰지 않는다. `configs` 쪽 잔재
>   (`docker/prd/service/`, `docker/prd/init.sh`)도 제거했다.

---

## 알아둘 함정

**요청 DTO 는 클라이언트가 보내는 필드와 1:1 로 맞춘다.**
`monglife-module-common-logging` 이 `@Bean("LoggingObjectMapper")` 를 `@ConditionalOnMissingBean` 없이
등록해 스프링 부트 기본 ObjectMapper 설정이 백오프된다. 그 결과 `FAIL_ON_UNKNOWN_PROPERTIES` 가 켜진 채
동작하고, **서버 DTO 에 없는 필드가 오면 400 이 아니라 500 이 난다.** 새 DTO 에는
`@JsonIgnoreProperties(ignoreUnknown = true)` 를 붙인다.

**`@EntryLoggingPoint` 를 붙이면 인자가 통째로 Logstash 로 나간다.**
`TargetLoggingAspect` 가 `..controller.*Controller.*`, `..service.*Service.*`, `..repository..*Repository*.*`
를 잡아 인자와 반환값을 로깅한다. `ArgsUtil` 은 **`com.monglife` 패키지 객체만 직렬화**하고
`String`·`Long` 등은 `""` 로 마스킹한다. 즉 **DTO 를 받는 컨트롤러 메서드는 DTO 전체가 로그에 남는다.**
민감값을 담은 DTO 를 새로 만들 때 주의할 것. (현재 로그인 응답의 accessToken/refreshToken,
credential 로그인 요청의 idToken 이 여기 해당한다 — 미조치)

**예외 → HTTP 상태 매핑이 위치에 따라 다르다.**
`AuthExceptionHandler` 는 `@RestControllerAdvice(basePackageClasses = AuthController.class)` 로
`auth.controller` 패키지에만 적용된다. 여기서 `NotExistsAccountException` → **404**,
`AlreadyExistsAccountException` / `NeedUpdateAppException` → **406** 이다.
그 밖의 모든 `ErrorException` 은 `CommonExceptionHandler` 가 **400** 으로 내린다.
→ **인증 관련 컨트롤러 메서드는 반드시 기존 `AuthController` 안에 추가한다.** 다른 패키지에 새 컨트롤러를
만들면 `NotExistsAccountException` 이 404 대신 400 으로 나가 **클라이언트의 회원가입 분기가 깨진다.**
또 새 예외를 **401 로 내리면 안 된다.** 앱의 전역 401 인터셉터(세션 만료 → 강제 로그아웃)와 충돌한다.

**레거시 경로 재작성.** `RegercyAuthFilter` 가 `/auth/**`, `/userDevice/**` 요청을 `/public/**` 으로
재작성한다. `SecurityConfig` 는 `/public/**` 을 permitAll 로 열어 둔다.

**두 도메인이 같은 DB 를 본다.** account 와 device 는 데이터소스가 따로지만 운영에서 같은 MySQL 스키마를
가리킨다. local 의 H2 도 같은 인메모리 DB 이름을 공유한다.

**`email` / `social_account_id` 에 UNIQUE 인덱스가 없다.** QueryDSL 조회가 `.fetchOne()` 이라 중복이
생기면 `NonUniqueResultException` 이 난다.
