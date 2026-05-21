# 수프리마 플랫폼 기술 보고서 (Technical & Deployment Report)

본 문서는 수프리마 교과·세특 코칭 앱(운영용 컨설턴트 앱)의 아키텍처, 데이터베이스 설정, Git 저장소 주소, 배포 환경, **사용자 권한 체계** 및 인수인계에 필요한 제반 지식을 정리한 문서입니다. 관리자나 후임 개발자가 시스템을 유지보수할 때 참고할 수 있도록 기록되었습니다.

---

## 1. 시스템 아키텍처 개요

본 서비스는 클라우드 서버 기반의 **Front-End / Back-End 분리형 아키텍처**로 구성되어 있습니다.

* **Frontend**: React + Vite + TS (Vercel 클라우드 호스팅)
* **Backend**: PocketBase (Fly.io 클라우드 가상서버 호스팅)
* **Database**: SQLite (PocketBase 내장 DB)
* **AI Engine**: Google Gemini API (`gemini-2.5-flash` 모델 활용)
* **도서 검색**: 알라딘 API (TTBKey 인증)

---

## 2. Git 저장소 정보 (Repository Configuration)

로컬 폴더와 연결된 원격 깃허브 저장소 주소 정보입니다.

* **로컬 소스 코드 경로**: `C:\Users\chris\Desktop\새 폴더\suprima_교과세특\consultant_app_independent`
* **깃허브 원격 저장소 URL**: `https://github.com/ipsicreator/consultant-app.git` (HTTPS 주소)
* **기본 배포 브랜치**: `master`
* **Git 로컬 커밋 작성자 정보**:
  * **User Name**: `ipsicreator`
  * **User Email**: `chrisklee69@gmail.com`

> [!IMPORTANT]
> **Git 폴더 위치 주의사항 (히스토리 이슈 해결 이력)**:
> 이전 작업 시 상위 경로인 `C:\Users\chris\Desktop\새 폴더`에 `.git`이 중복 생성되어 원격 저장소와의 경로 매칭 오류(Repository not found 및 폴더 누락)가 발생했습니다.
> 현재는 하위 프로젝트 폴더(`consultant_app_independent`) 내부에서 직접 `git init`을 수행하고 원격 `origin/master` 이력을 정상 동기화(Reset)하여 꼬임 현상을 완전히 수정했습니다. **이후 Git 명령어는 반드시 `consultant_app_independent` 폴더 내부에서 실행**해야 합니다.

---

## 3. 백엔드 데이터베이스 (Cloud PocketBase)

데이터베이스 분리 및 멀티 아카데미 지원을 위해 클라우드 PocketBase 환경을 구축하여 사용합니다.

* **PocketBase 관리자 콘솔 주소**: `https://suprima-platform-pb.fly.dev/_/`
* **API EndPoint URL**: `https://suprima-platform-pb.fly.dev`
* **컬렉션 네이밍 규칙**: 수프리마 플랫폼 전용 데이터임을 표시하고 타 서비스와의 혼선을 막기 위해 모든 컬렉션 이름에 **`suprima_`** 접두사를 사용합니다.

### 6대 핵심 컬렉션 목록

| 컬렉션 | 용도 | 주요 필드 |
|--------|------|-----------|
| `users` | PocketBase 내장 인증 계정 | `email`, `password`, `verified` |
| `suprima_licenses` | 플랫폼 접근 권한 (라이선스) | `email`, `academy_id`, `active`, `expires_at` |
| `suprima_profiles` | 사용자 프로필 및 역할 관리 | `name`, `email`, `role`, `academy_id`, `user` |
| `suprima_students` | 학생 CRM 데이터 | 이름, 학교, 학년, 학부모 연락처 등 |
| `suprima_pdf_analyses` | 학생부 PDF AI 분석 결과 | 학생ID, 분석 요약, 성적, 활동 |
| `suprima_exploration_library` | 합격자 데이터뱅크 및 탐구 아카이브 | 도서명, 탐구주제, 카테고리, 태그 |

---

## 4. 사용자 권한 체계 (Role & Permission System)

### 4-1. 역할(Role) 구분

| 역할 (role) | 대상 | 설명 | 라이선스 체크 |
|------------|------|------|:------------:|
| `master` | 이기욱 (플랫폼 총괄 관리자) | 라이선스 체크 없이 **무조건 통과**. 모든 기능 사용 가능. 학원/실무자 등록 권한 보유 | ❌ 불필요 |
| `consultant` | 실무자 (컨설턴트/코치) | 학생 등록·관리, 학생부 분석, 탐구 브레인 등 실무 기능 사용. 해당 학원의 **활성 라이선스 필요** | ✅ 필요 |
| `staff` | 학원 스태프 | consultant와 동일한 실무 기능 사용 가능. 해당 학원의 **활성 라이선스 필요** | ✅ 필요 |

### 4-2. 권한 판별 흐름 (LicenseGuard)

앱 진입 시 `src/components/LicenseGuard.tsx`가 아래 흐름으로 접근 권한을 판별합니다:

```
사용자 로그인
  └─ PocketBase 인증 (users 컬렉션)
       └─ 프로필 조회/생성 (suprima_profiles 컬렉션)
            ├─ role === 'master'  →  ✅ 무조건 통과 (라이선스 체크 생략)
            ├─ profile.academy_id 존재  →  해당 학원의 활성 라이선스 확인
            │     ├─ active=true  →  ✅ 통과
            │     └─ active=false 또는 없음  →  ❌ 차단 (만료 안내)
            └─ profile.academy_id 없음  →  fallback: 아무 활성 라이선스 검색
                  ├─ 있음  →  ✅ 통과
                  └─ 없음  →  ❌ 차단
```

### 4-3. 프로필 자동 생성 (profileLink.ts)

최초 로그인 시 `suprima_profiles`에 해당 사용자의 프로필이 없으면 `src/lib/profileLink.ts`의 `resolveOrCreateProfile()` 함수가 자동으로 프로필을 생성합니다.
- **기본 역할**: `consultant` (자동 생성 시)
- **학원 연결**: 활성 라이선스에서 `academy_id`를 자동 추출하여 연결

### 4-4. 역할별 운영 절차

#### 마스터 (이기욱) — 최초 1회 설정

마스터 계정은 `scratch/auto_master.cjs` 스크립트로 자동 보장됩니다.
DB를 삭제하거나 매번 수동 설정할 필요가 없습니다.

```powershell
cd "C:\Users\chris\Desktop\새 폴더\suprima_교과세특\consultant_app_independent"
node scratch/auto_master.cjs
```

이 스크립트는 **Idempotent** (재실행 안전)하며, 아래 3가지를 자동으로 보장합니다:
1. `users` 컬렉션에 마스터 계정 존재 여부 확인 → 없으면 생성
2. `suprima_profiles` 컬렉션에 `role: master` 프로필 존재 여부 확인 → 없으면 생성, 역할이 다르면 `master`로 업데이트
3. `suprima_licenses` 컬렉션에 활성 라이선스 존재 여부 확인 → 없으면 5년 유효 라이선스 생성

#### 실무자 (컨설턴트/스태프) 등록

마스터가 아래 스크립트를 실행하여 실무자 계정을 생성합니다:

```powershell
node scratch/create_staff.cjs <이메일> <이름>
# 예: node scratch/create_staff.cjs leesk@example.com "이수진"
```

생성 시 자동으로:
- `users` 컬렉션에 사용자 계정 생성 (초기 비밀번호: `staffdefault@@`)
- `suprima_profiles` 컬렉션에 `role: staff` 프로필 생성
- `suprima_licenses` 컬렉션에 2년 유효 활성 라이선스 부여

#### 학생 등록

실무자(또는 마스터)가 앱 UI에서 직접 등록합니다:
1. 앱 로그인 → 대시보드 진입
2. `+ 학생 등록` 버튼 클릭 → 모달 창에서 학생 정보 입력
3. 저장 → `suprima_students` 컬렉션에 레코드 생성

---

## 5. 로그인 정보 (Credential Reference)

> [!CAUTION]
> 아래 비밀번호 정보는 보안에 민감합니다. 본 문서는 반드시 내부 공유용으로만 사용하시고 외부 유출에 주의하세요.

| 용도 | 이메일 | 비밀번호 | 비고 |
|------|--------|----------|------|
| **앱 로그인** (프론트엔드) | `chrisklee69@gmail.com` | `suprima2026!` | 마스터(이기욱) 전용 |
| **PocketBase 관리자 콘솔** | `chrisklee69@gmail.com` | `aussie1996@@` (@ 2개) | DB 직접 관리 시 사용 |

> [!WARNING]
> 앱 로그인 비밀번호는 `suprima2026!`, PocketBase 관리자 콘솔은 `aussie1996@@`입니다. 혼동에 주의하세요.

---

## 6. 프론트엔드 배포 환경 (Vercel)

* **Vercel 프로젝트 대시보드 URL**: [https://vercel.com/ipsicreators-projects/consultant_app](https://vercel.com/ipsicreators-projects/consultant_app)
* **프로젝트 ID**: `prj_wNpD3doktg7em9QTOpAmQN2oFliL`
* **조직/팀 ID**: `team_5GAX2hfIOgckFHibZoaido1k` (Vercel Team: `ipsicreators-projects`)
* **배포 방식**: 깃허브 `ipsicreator/consultant-app` 저장소의 **`master`** 브랜치로 코드가 Push되면 Vercel이 이를 자동으로 감지하여 빌드 및 실시간 상용 배포를 수행합니다.

---

## 7. 로컬 개발 및 환경변수 설정

프로젝트를 로컬 컴퓨터에서 다시 실행하거나 개발 환경을 구성할 때 필요한 정보입니다.

### 1) 환경 변수 파일 구성 (`.env.local`)
보안을 위해 `.env.local` 파일은 Git 추적 대상에서 제외되어 있습니다. 로컬 구동 시 프로젝트 최상위에 해당 파일을 만들고 아래 변수들을 구성해야 합니다:

```env
# Cloud PocketBase 서버 주소
VITE_POCKETBASE_URL=https://suprima-platform-pb.fly.dev

# AI 분석용 Google Gemini API Key
VITE_GEMINI_API_KEY=AIzaSy... (사용자 키 입력)

# 책 연계 수행평가 도서 검색용 알라딘 TTB Key
VITE_ALADIN_TTB_KEY=ttb... (사용자 키 입력)
```

### 2) 실행 명령어

| 명령어 | 용도 |
|--------|------|
| `npm install` | 의존성 모듈 설치 |
| `npm run dev` | 로컬 개발 서버 구동 (기본: `http://localhost:5173`) |
| `npm run build` | 프로덕션 빌드 테스트 |
| `npm run lint` | 코드 린트(검사) |
| `node scratch/auto_master.cjs` | 마스터(이기욱) 계정·프로필·라이선스 자동 보장 |
| `node scratch/create_staff.cjs <email> <name>` | 실무자 계정 생성 |

---

## 8. 운영 스크립트 목록

| 파일 경로 | 용도 | 실행 방법 |
|-----------|------|-----------|
| `scratch/auto_master.cjs` | 마스터(이기욱) 계정·프로필·라이선스 자동 보장 (Idempotent) | `node scratch/auto_master.cjs` |
| `scratch/create_staff.cjs` | 실무자(스태프) 계정·프로필·라이선스 신규 생성 | `node scratch/create_staff.cjs <email> <name>` |
| `scratch/set_user_password.cjs` | 기존 사용자 비밀번호 재설정 | `node scratch/set_user_password.cjs` |
| `scratch/manage_pb.cjs` | DB 헬스체크 (컬렉션별 레코드 수 조회) | `node scratch/manage_pb.cjs` |
| `scratch/test_gemini.cjs` | Gemini API 키 유효성 검증 | `node scratch/test_gemini.cjs` |
| `scratch/test_aladin.cjs` | 알라딘 API 키 유효성 검증 | `node scratch/test_aladin.cjs` |

---

## 9. 유지보수 및 예외 처리 가이드

### 로그인 문제 발생 시 체크리스트

1. **마스터 계정 복구** → `node scratch/auto_master.cjs` 실행 (DB 삭제 불필요)
2. **비밀번호 확인** → 앱은 `@@@` (3개), PocketBase 콘솔은 `@@` (2개)
3. **프로필 역할 확인** → `suprima_profiles`에서 마스터의 `role`이 `master`인지 확인
4. **라이선스 확인** → `suprima_licenses`에서 `active=true` 및 `expires_at`이 현재 날짜 이후인지 확인
5. **브라우저 캐시** → 로그인 오류 지속 시 브라우저 캐시/쿠키 삭제 후 재시도

### TypeScript / Lint 규칙 제어
현재 앱 내부에 레거시 JavaScript 연동 코드 및 암시적 `any` 타입이 포함되어 있어 린트 오류가 엄격할 경우 빌드가 실패할 수 있습니다. 이를 우회하기 위해 `eslint.config.js` 파일에서 `any` 경고 및 미사용 변수 검사 등을 완화해 두었으므로, 소스 코드 빌드 시 참고하시기 바랍니다.

### 라이선스 체크 작동
앱 진입 시 `LicenseGuard.tsx`가 작동하여, 프로필에 `role: master`가 아닌 사용자는 `suprima_licenses` DB에 활성화된 라이선스 정보가 없으면 만료/비활성화 안내 페이지를 렌더링하도록 안전장치가 걸려 있습니다.

---

## 10. 외부 API 연동 현황

| API | 용도 | 모델/키 | 상태 |
|-----|------|---------|:----:|
| Google Gemini | 학생부 PDF AI 분석, 탐구 주제 제안 | `gemini-2.5-flash` | ✅ 정상 |
| 알라딘 도서 검색 | 도서 연계 수행평가 탐구 자료 조회 | TTBKey `ttbchrisklee1714001` | ✅ 정상 |
| PocketBase (Fly.io) | 백엔드 DB 및 인증 | `suprima-platform-pb.fly.dev` | ✅ 정상 |

---

*최종 업데이트: 2026-05-20*
