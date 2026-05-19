# Suprima Platform - 교과·세특 코칭 운영 앱

수프리마 플랫폼은 학원/컨설턴트가 학생 데이터를 관리하고, 학생부 분석 및 심화탐구 제안을 수행하는 운영용 앱입니다.

## 핵심 기능
- 학생 CRM 관리: 학생 등록, 상태 변경, 상세 진입
- 학생부 분석: 텍스트 기반 AI 분석 및 결과 저장
- AI 탐구 브레인: 관심사 기반 탐구 주제/활동/세특 초안 생성
- 라이브러리 관리: 엑셀 일괄 업로드, PDF AI 추출 적재
- 월간/진학 리포트: 학생별 리포트 확인 및 출력
- 라이선스 가드: 활성 라이선스 체크 후 접근 제어

## 기술 스택
- Frontend: React + Vite + TypeScript
- Backend/Data: PocketBase
- AI: Google Gemini (`@google/generative-ai`)
- 기타: Lucide React, Recharts, XLSX

## 실행 방법
1. 의존성 설치
```bash
npm install
```
2. 환경변수 설정 (`.env.local`)
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
VITE_ALADIN_TTB_KEY=YOUR_ALADIN_TTB_KEY
```
3. 개발 서버 실행
```bash
npm run dev
```
4. 빌드
```bash
npm run build
```

## 운영 메모
- 기본 로컬 주소: `http://127.0.0.1:5173`
- PocketBase 기본 주소: `http://127.0.0.1:8090`
- 라이선스/학원 매핑이 없으면 일부 화면 접근이 제한될 수 있습니다.
