# Daechi Suprima - AI Student Management & Exploration Platform

대치 수프리마 전용 AI 학생 관리 및 심화 탐구 설계 플랫폼입니다.
학생의 생기부를 분석하여 맞춤형 성적 관리와 심화 탐구 주제를 제안합니다.

## 🚀 주요 기능
1. **AI 학생 분석**: PDF 생기부를 업로드하면 성적 차트와 핵심 역량을 자동 분석합니다.
2. **탐구활동/수행평가**: 알라딘 API 연동을 통해 도서와 연계된 최적의 심화 활동을 3종 제안합니다.
3. **합격자 데이터뱅크(Library)**: 과거 우수 사례(엑셀/PDF)를 누적하여 키워드 검색 및 학생 매칭을 지원합니다.
4. **종합 보고서 출력**: 컨설턴트 의견을 결합하여 학부모 상담용 프리미엄 PDF 리포트를 생성합니다.

## 🛠️ 설치 및 실행 방법

### 1. 필수 요구사항
- Node.js 18.x 이상
- Supabase 프로젝트 (DB 및 스토리지 서비스)
- Google AI (Gemini) API Key

### 2. 프로젝트 설정
```bash
git clone [repository-url]
cd consultant_app
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 항목을 입력하세요:
```env
VITE_SUPABASE_URL=당신의_슈파베이스_URL
VITE_SUPABASE_ANON_KEY=당신의_슈파베이스_익명_키
VITE_GEMINI_API_KEY=당신의_제미나이_API_키
VITE_ALADIN_TTB_KEY=당신의_알라딘_TTB_키
```

### 4. 로컬 실행
```bash
npm run dev
```

### 5. 배포 (Vercel 추천)
- GitHub에 프로젝트를 올립니다.
- Vercel에서 `New Project`를 선택하고 환경 변수를 등록하면 자동으로 배포됩니다.

## 🛡️ 기술 스택
- **Frontend**: React (Vite), TypeScript
- **Styling**: Vanilla CSS (Premium Dark Mode)
- **Backend/DB**: Supabase
- **AI**: Google Gemini 2.5 Flash
- **API**: Aladin OpenAPI (Book Search)
- **Library**: Lucide React, Recharts, XLSX, Framer Motion

## 📄 라이선스
대치 수프리마 원장님(Master) 전용 플랫폼입니다. 무단 전재 및 배포를 금합니다.
