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

`*/src/main/resources/*.yml`, `*.json`, `*.xml` 은 **빌드 산출물**이다. 루트 `build.gradle` 의
`copyPrivate` 태스크가 만들어내고 `.gitignore` 가 걸려 있다. 직접 편집해도 다음 빌드에 사라진다.

```
configs/properties/<parentModule>/<currentModule>/*.{yml,json,xml}
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

```bash
docker run -d --name monglife-local-redis -p 6379:6379 \
  redis:7-alpine redis-server --requirepass 'mongscorp.!'

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
| `develop` | `ci-common` / `ci-gateway` / `ci-eureka` | 빌드·테스트 |
| `stage` | `cd-stg` | STAGE 서버 배포 |
| `release` | `cd-prd` | 운영 배포 |

### STAGE (`cd-stg`)

빌드 → `~/service/discovery` 로 전송 → `docker compose up -d --build <서비스>` 다.
스크립트(`run.sh`/`service.sh`)를 서버에 두지 않고 워크플로가 compose 를 직접 호출한다.

서버는 **discovery 와 nginx 두 스택**으로 나뉘고, 배포는 discovery 만 교체한다.

```
/home/monglife/service/          ← configs/docker/stg 트리를 그대로 넣고 setup.sh 한 번
  setup.sh
  discovery/                     ← 배포 대상
    .env                         서버에서만 관리. 워크플로가 전송하지 않는다
    docker-compose.yml       ┐
    spring-boot-docker-file  ├ 워크플로가 매 배포마다 덮어쓴다
    .dockerignore            ┘
    monglife-discovery-app-{eureka,gateway,common-api}.jar
  nginx/                         ← 독립 스택. 배포가 건드리지 않는다
  logs/
```

- 시크릿은 GitHub `stage` Environment 에 둔다: `HOST` `PORT` `USERNAME` `PASSWORD` `ACTION_TOKEN`.
- 두 스택은 external 네트워크 `service-net` 으로만 이어진다. `setup.sh` 가 만들고, 워크플로도
  기동 전에 없으면 만든다.
- **`.env` 에 키가 없으면 compose 는 빈 문자열로 치환하고 경고만 낸다.** 포트라면 `":8761"` 이 되어
  기동이 깨진다. 워크플로가 기동 전에 필수 키를 검사하니, compose 변수를 늘리면 그 목록도 함께 늘린다.
- MySQL / Redis / Kafka 는 컨테이너가 아니라 외부 호스트다(`.env` 의 `*_HOST`).

서버 트리의 상세와 조작법은 `configs/docker/stg/README.md` 에 있다.

배포 순서는 **configs 푸시 → 서브모듈 포인터 커밋 → 코드 푸시** 다. 롤백할 때는 반대로 **코드부터**
되돌린다. 코드를 되돌리면 configs 에 남은 키는 잉여값일 뿐이지만, configs 만 되돌리고 코드를 남기면
기동에 실패한다.

> ⚠️ `cd-prd.yml` 의 `:74` 와 `:96` 이 **둘 다** `restart ${{ env.gateway }}` 다. 운영 배포가 jar 만
> 복사하고 common-api 프로세스를 교체하지 않는다. 게다가 `env.common` 값이
> `monglife-discovery-common` 인데 실제 운영 컨테이너명은 `monglife-discovery-common-api` 다.
> 운영 배포 후에는 common-api 가 실제로 재시작됐는지 직접 확인할 것. (미수정)

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
