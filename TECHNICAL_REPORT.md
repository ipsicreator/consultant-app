# 수프리마 플랫폼 기술 보고서 (Technical & Deployment Report)

본 문서는 수프리마 교과·세특 코칭 앱(운영용 컨설턴트 앱)의 아키텍처, 데이터베이스 설정, Git 저장소 주소, 배포 환경 및 인수인계에 필요한 제반 지식을 정리한 문서입니다. 관리자나 후임 개발자가 시스템을 유지보수할 때 참고할 수 있도록 기록되었습니다.

---

## 1. 시스템 아키텍처 개요

본 서비스는 클라우드 서버 기반의 **Front-End / Back-End 분리형 아키텍처**로 구성되어 있습니다.

* **Frontend**: React + Vite + TS (Vercel 클라우드 호스팅)
* **Backend**: PocketBase (Fly.io 클라우드 가상서버 호스팅)
* **Database**: SQLite (PocketBase 내장 DB)
* **AI Engine**: Google Gemini API (`gemini-2.5-flash` 모델 활용)

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

### 5대 핵심 컬렉션 목록
1. `suprima_licenses`: 플랫폼 접근 권한(라이선스 만료일, 활성화 여부) 관리
2. `suprima_profiles`: 학원 및 컨설턴트 프로필 정보
3. `suprima_students`: 학생 CRM 데이터 (이름, 학교, 학년, 학부모 연락처 등)
4. `suprima_pdf_analyses`: 학생부 PDF 텍스트 추출물 및 AI 종합 분석 결과
5. `suprima_exploration_library`: 합격자 데이터뱅크 및 탐구 주제 아카이브 자료

---

## 4. 프론트엔드 배포 환경 (Vercel)

* **Vercel 프로젝트 대시보드 URL**: [https://vercel.com/ipsicreators-projects/consultant_app](https://vercel.com/ipsicreators-projects/consultant_app)
* **프로젝트 ID**: `prj_wNpD3doktg7em9QTOpAmQN2oFliL`
* **조직/팀 ID**: `team_5GAX2hfIOgckFHibZoaido1k` (Vercel Team: `ipsicreators-projects`)
* **배포 방식**: 깃허브 `ipsicreator/consultant-app` 저장소의 **`master`** 브랜치로 코드가 Push되면 Vercel이 이를 자동으로 감지하여 빌드 및 실시간 상용 배포를 수행합니다.

---

## 5. 로컬 개발 및 환경변수 설정

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
* **의존성 모듈 설치**: `npm install`
* **로컬 개발 서버 구동**: `npm run dev` (기본 주소: `http://localhost:5173`)
* **프로젝트 빌드 테스트**: `npm run build`
* **코드 린트(검사)**: `npm run lint`

---

## 6. 유지보수 및 예외 처리 가이드

* **TypeScript / Lint 규칙 제어**:
  현재 앱 내부에 레거시 JavaScript 연동 코드 및 암시적 `any` 타입이 포함되어 있어 린트 오류가 엄격할 경우 빌드가 실패할 수 있습니다. 이를 우회하기 위해 `eslint.config.js` 파일에서 `any` 경고 및 미사용 변수 검사 등을 완화해 두었으므로, 소스 코드 빌드 시 참고하시기 바랍니다.
* **라이선스 체크 작동**:
  앱 진입 시 `LicenseGuard.tsx`가 작동하여, 로컬 스토리지에 학원 매핑 키가 없거나 `suprima_licenses` DB에 활성화된 라이선스 정보가 없으면 만료/비활성화 안내 페이지를 렌더링하도록 안전장치가 걸려 있습니다.
