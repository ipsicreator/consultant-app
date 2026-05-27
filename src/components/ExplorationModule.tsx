import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Sparkles, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ExplorationModule.css';

interface ExplorationModuleProps {
  onBack: () => void;
  studentData: { id: string; name: string } | null;
}

type Suggestion = {
  title: string;
  objective: string;
  reading: { bookTitle: string; reason: string };
  activitySteps: string[];
  output: string;
};

const fallbackSuggestions = (a: string, b: string, c: string, d: string): Suggestion[] => [
  {
    title: `${a} × ${c} 융합 탐구`,
    objective: `${a} 기반 역량을 ${c} 관점으로 확장`,
    reading: { bookTitle: `${a}를 바꾸는 생각법`, reason: `${a} 기초개념과 실제 적용 프레임 확보` },
    activitySteps: ['핵심 개념 3개 정리', '학교 사례 1개 데이터화', '개선안 발표 슬라이드 작성'],
    output: '세특 문장 초안 + 탐구 보고서 1p',
  },
  {
    title: `${b} 중심 문제해결 프로젝트`,
    objective: `${b} 이슈를 ${d} 방식으로 해결`,
    reading: { bookTitle: `${b} 인사이트 리포트`, reason: `문제 정의/가설 설정 역량 강화` },
    activitySteps: ['문제 정의', '가설 수립', '실험/조사', '결론 정리'],
    output: '탐구활동 기록지 + 발표 대본',
  },
];

const ExplorationModule: React.FC<ExplorationModuleProps> = ({ studentData }) => {
  const initialKeywords = JSON.parse(sessionStorage.getItem('exploration_keywords') || '{}');
  
  const [studentKeyword1, setStudentKeyword1] = useState(initialKeywords.student?.[0] || '데이터 분석');
  const [studentKeyword2, setStudentKeyword2] = useState(initialKeywords.student?.[1] || '발표');
  const [studentKeyword3, setStudentKeyword3] = useState(initialKeywords.student?.[2] || '');
  const [userKeyword1, setUserKeyword1] = useState(initialKeywords.user?.[0] || 'AI 교육');
  const [userKeyword2, setUserKeyword2] = useState(initialKeywords.user?.[1] || '사회문제 해결');
  const [userKeyword3, setUserKeyword3] = useState(initialKeywords.user?.[2] || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Suggestion[]>([]);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const genAI = useMemo(() => new GoogleGenerativeAI(apiKey), [apiKey]);

  const generate = async () => {
    const sKeys = [studentKeyword1, studentKeyword2, studentKeyword3].filter(k => k.trim());
    const uKeys = [userKeyword1, userKeyword2, userKeyword3].filter(k => k.trim());
    
    if (sKeys.length === 0 && uKeys.length === 0) {
      alert('최소 1개 이상의 키워드를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      if (!apiKey) {
        setResult(fallbackSuggestions(studentKeyword1, studentKeyword2, userKeyword1, userKeyword2));
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `학생: ${studentData?.name || '학생'}
학생부 키워드: ${sKeys.join(', ')}
사용자 키워드: ${uKeys.join(', ')}
요청: 독서 포함 탐구활동 제안 2개를 JSON으로 반환
키: [{title, objective, reading:{bookTitle,reason}, activitySteps[], output}]`;
      const raw = (await (await model.generateContent(prompt)).response).text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw);
      if (Array.isArray(parsed) && parsed.length > 0) setResult(parsed);
      else setResult(fallbackSuggestions(studentKeyword1, studentKeyword2, userKeyword1, userKeyword2));
    } catch (e) {
      console.error(e);
      setResult(fallbackSuggestions(studentKeyword1, studentKeyword2, userKeyword1, userKeyword2));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="explore-wrap">
      <section className="explore-input glass-panel">
        <h2><Sparkles size={18} /> 탐구활동 제안 입력</h2>
        <p>학생부추출 키워드(최대 3개) + 사용자 추가 키워드(최대 3개)를 기반으로 제안을 생성합니다.</p>

        <div className="grid-2">
          <label>학생부 키워드 1<input value={studentKeyword1} onChange={(e) => setStudentKeyword1(e.target.value)} /></label>
          <label>사용자 키워드 1<input value={userKeyword1} onChange={(e) => setUserKeyword1(e.target.value)} /></label>
          <label>학생부 키워드 2<input value={studentKeyword2} onChange={(e) => setStudentKeyword2(e.target.value)} /></label>
          <label>사용자 키워드 2<input value={userKeyword2} onChange={(e) => setUserKeyword2(e.target.value)} /></label>
          <label>학생부 키워드 3<input value={studentKeyword3} onChange={(e) => setStudentKeyword3(e.target.value)} /></label>
          <label>사용자 키워드 3<input value={userKeyword3} onChange={(e) => setUserKeyword3(e.target.value)} /></label>
        </div>

        <button className="btn-primary" onClick={generate} disabled={isGenerating}>
          {isGenerating ? <RefreshCw className="spin" size={16} /> : <Send size={16} />}
          <span>{isGenerating ? '생성 중...' : '제안 생성'}</span>
        </button>
      </section>

      <section className="explore-result glass-panel">
        <h2><Lightbulb size={18} /> 결과 페이지 (독서 포함)</h2>
        {result.length === 0 ? (
          <p className="empty">아직 생성된 제안이 없습니다.</p>
        ) : (
          <div className="result-list">
            {result.map((s, i) => (
              <article key={i} className="result-card">
                <h3><CheckCircle2 size={16} /> {s.title}</h3>
                <p><strong>목표:</strong> {s.objective}</p>
                <p><strong><BookOpen size={14} /> 추천 독서:</strong> {s.reading?.bookTitle} - {s.reading?.reason}</p>
                <div>
                  <strong>탐구 단계</strong>
                  <ol>{(s.activitySteps || []).map((st, idx) => <li key={idx}>{st}</li>)}</ol>
                </div>
                <p><strong>산출물:</strong> {s.output}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorationModule;
