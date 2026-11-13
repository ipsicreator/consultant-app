# 수프리마 랩 학원용

수프리마 랩에 연결되는 학원 관리자·담당 컨설턴트용 앱입니다. 기존 화면 디자인과 로고 자산은 유지하고 학원 운영 범위·공통 입시 자료·분석 연결을 정리했습니다.

## 역할과 범위

- 일반 PocketBase users 계정으로 로그인합니다. 슈퍼유저 계정은 앱 사용 계정으로 받지 않습니다.
- suprima_profiles의 실제 user 관계로 본인 계정을 확인합니다. admin_id 문자열은 로그인 권한으로 사용하지 않습니다. 역할은 master/admin/consultant, academy_id는 필수입니다.
- 프로필을 자동 생성하거나 임의의 활성 학원·이용권에 연결하지 않습니다.
- suprima_licenses의 같은 academy_id와 active=true를 확인해야 이용할 수 있습니다.
- 학원 관리자·마스터도 현재 소속 학원 범위만 조회합니다. 실행 담당자는 assigned_consultant에 배정된 학생만 조회합니다.
- 관리자 화면은 소속 담당자·학생과 실제 배정 인원을 표시합니다. 마스터는 Google 로그인 후 /admin/academy에서 학원별 관리자·실행 담당자 계정과 비밀번호를 관리합니다. 학원 관리자는 학생별 담당자를 선택하여 저장·해제·재배정합니다.

## 수프리마 랩 연결

- 공통 입시 파일은 수프리마 랩의 /admin/admissions에서 검증·반영합니다.
- 학원 앱은 수프리마 랩 /api/admissions의 현재 활성 자료를 조회합니다. 로컬 복제 JSON을 사용하지 않습니다.
- 공통 자료가 없거나 연결이 실패하면 해당 상태를 알립니다. 다른 전형·임의 입결로 대신 판단하지 않습니다.
- AI는 수프리마 랩 /api/academy/ai로 로그인 토큰을 전달하여 서버에서 처리합니다. 클라이언트 코드에 Gemini·알라딘 비밀키를 넣지 않습니다.
- PDF는 application/pdf, 원본 최대 2MB입니다. AI 실패 시 가상 점수·도서·문장을 성공 결과로 채우지 않습니다.
- 알라딘 OpenAPI 종료에 따라 기존 API 프록시와 기본 키 사용을 제거했습니다. 도서 검색 링크와 실제 서지 확인은 구분합니다.

## 환경변수

| 이름 | 값·범위 |
|---|---|
| VITE_POCKETBASE_URL | 운영 PocketBase 공개 접속 주소. 일반 users 인증용 |
| VITE_SUPREMA_LAB_URL | https://suprema-lab.vercel.app |
| VITE_STUDENT_CONSULTANT_FIELD | 실제 학생→suprima_profiles 배정 관계 필드가 확인된 경우에만 설정 |

기본 배정 필드는 assigned_consultant이며 suprima_profiles의 단일 관계입니다. 별도 환경변수 없이 기본값을 사용합니다. 변경은 실제 저장소의 관계와 일치해야 하며 임의 필드로 접근 범위를 넓히지 않습니다.

기존 배포에 보존된 AI 키는 서버 함수에서만 읽을 수 있습니다. 프런트 src에서 VITE_GEMINI_API_KEY·VITE_ALADIN_TTB_KEY를 참조하지 않습니다. 이 설정명은 기존 비밀값의 이동·공개를 뜻하지 않습니다.

## 실행과 검증

- npm ci --ignore-scripts
- npm test
- npm run lint -- --quiet
- npm run build
- npm run dev

## 운영 적용 시 확인할 사항

1. PocketBase의 profiles/users/student 관계와 실제 배정 필드를 확인합니다.
2. 데이터베이스 API 규칙으로 타 학원·미배정 학생의 직접 요청을 차단합니다. 화면의 필터·역할 검사만으로 DB 보안이 완성되었다고 볼 수 없습니다.
3. 서로 다른 두 학원과 관리자·담당자로 실제 조회·변경 거부를 확인합니다.
4. 수프리마 랩의 허용 출처, PocketBase 접속 주소, AI 서버 함수와 라이선스를 운영 계정으로 확인합니다.
5. 기존 별도 학습 플래너의 일부 작업·첨부는 현재 화면 상태이며 영구 저장·파일 보관으로 표시하지 않습니다. 학생 상세에 저장하는 기록과 구분합니다.

운영 URL 변경과 Vercel 프로젝트·환경변수 설정은 배포 확인 기록과 함께 관리합니다. 기존 GitHub 저장소 식별자는 별도로 변경하지 않습니다.

