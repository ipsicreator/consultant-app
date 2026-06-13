interface Props {
  averageGrade: number | null;
  strongestSubject: string;
  weakestGrade: number | null;
  subjectCount: number;
  topKeywords?: string[];
  compact?: boolean;
}

function getLabel(avgGrade: number | null) {
  if (avgGrade === null) return '평가 불가';
  if (avgGrade <= 2) return '상위권';
  if (avgGrade <= 4) return '경쟁권';
  return '보완 필요';
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: '1rem', border: '1px solid #eadbc8', backgroundColor: '#fff', padding: '1rem' }}>
      <div style={{ fontSize: '0.78rem', color: '#8b5e3c', fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#1f2937' }}>{value}</div>
    </div>
  );
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ borderRadius: '1rem', border: '1px solid #ece0d1', backgroundColor: '#fffaf4', padding: '1rem' }}>
      <div style={{ fontWeight: 800, color: '#1f2937' }}>{title}</div>
      <p style={{ margin: '0.75rem 0 0', fontSize: '0.92rem', lineHeight: 1.6, color: '#475569' }}>{text}</p>
    </div>
  );
}

export default function AdmissionOfficerEvaluation({ averageGrade, strongestSubject, weakestGrade, subjectCount, topKeywords = [], compact = false }: Props) {
  const label = getLabel(averageGrade);
  const summary =
    averageGrade === null
      ? '학생부 데이터가 부족하여 세부 평가는 어렵습니다.'
      : averageGrade <= 2
        ? '과목 간 성취도와 핵심 과목의 안정성이 높습니다. 탐구 심화와 전형 적합성을 함께 강조하는 전략이 유리합니다.'
        : averageGrade <= 4
          ? '기본 성취는 확보되어 있으나, 핵심 과목과 탐구의 연결 강도를 더 분명하게 보여줄 필요가 있습니다.'
          : '과목별 보완이 필요합니다. 학생부의 강점과 전공 적합 활동을 더 선명하게 구성해야 합니다.';

  return (
    <section style={{ borderRadius: '1.5rem', border: '1px solid #ece0d1', backgroundColor: '#fffaf4', padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', color: '#8b1a1a' }}>03</p>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1a0f08' }}>입학사정관 평가</h2>
        <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>학생부 원본과 요약 분석을 기반으로 사정관 시선에서 해석한 핵심 평가입니다.</p>
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' }}>
        <MetricCard label="평균 등급" value={averageGrade?.toFixed(2) ?? '-'} />
        <MetricCard label="종합 평가" value={label} />
        <MetricCard label="분석 과목 수" value={String(subjectCount)} />
        <MetricCard label="보완 기준" value={weakestGrade ? `${weakestGrade}등급` : '-'} />
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <Note title="사정관 요약" text={summary} />
        <Note
          title="해석 포인트"
          text={
            strongestSubject
              ? `강점은 ${strongestSubject} 중심으로 드러납니다. 핵심 과목과 탐구 활동의 연결성을 함께 보여주는 구성이 필요합니다.`
              : '강점 과목이 아직 분명하지 않습니다. 핵심 과목과 활동의 연결을 먼저 정리하세요.'
          }
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <Note title="강점" text={averageGrade !== null ? '과목별 추세와 활동 내용을 엮으면 전공 적합성을 더 강하게 만들 수 있습니다.' : '입력 데이터가 부족합니다.'} />
        <Note title="보완점" text={weakestGrade ? `${weakestGrade}등급대 과목과 탐구 주제의 연결 설명을 보강하면 설득력이 올라갑니다.` : '보완이 필요한 과목 정보를 먼저 채워주세요.'} />
      </div>

      {topKeywords.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {topKeywords.slice(0, 6).map((keyword) => (
            <span key={keyword} style={{ borderRadius: '999px', backgroundColor: '#8b1a1a14', color: '#8b1a1a', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
              #{keyword}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
