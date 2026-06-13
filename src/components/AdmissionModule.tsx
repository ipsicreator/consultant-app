import { useState } from 'react';
import { Compass, Sparkles, Target } from 'lucide-react';
import PositionDiagnosis from './admission/screens/PositionDiagnosis';
import EvaluationSimulation from './admission/screens/EvaluationSimulation';

interface Props {
  onBack?: () => void;
  studentData?: { id: string; name: string } | null;
}

export default function AdmissionModule({ onBack, studentData }: Props) {
  const [view, setView] = useState<'diagnosis' | 'simulation'>('diagnosis');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section
        style={{
          borderRadius: '1.25rem',
          padding: '1.25rem 1.5rem',
          color: '#fff',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', placeItems: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.8rem', backgroundColor: 'rgba(255,255,255,0.14)' }}>
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.18em', fontWeight: 800, opacity: 0.8 }}>학습/입시 설계</div>
            <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.45rem', fontWeight: 900 }}>입시위치 진단</h1>
          </div>
        </div>
        <p style={{ margin: 0, maxWidth: '56rem', lineHeight: 1.7, opacity: 0.92 }}>
          학생부 분석 결과를 기반으로 지원 가능성을 가늠하고, 사정관 평가까지 한 화면에서 연결합니다.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          <MiniChip icon={<Sparkles size={14} />} label="학생부 분석 연계" />
          <MiniChip icon={<Target size={14} />} label="사정관 평가 동시 노출" />
          <MiniChip icon={<Compass size={14} />} label="26·25·24 컷 비교" />
        </div>
      </section>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          width: 'fit-content',
          padding: '0.5rem',
          borderRadius: '999px',
          backgroundColor: '#e2e8f0',
        }}
      >
        <button
          onClick={() => setView('diagnosis')}
          style={{
            padding: '0.75rem 1.1rem',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: view === 'diagnosis' ? '#0f172a' : 'transparent',
            color: view === 'diagnosis' ? '#fff' : '#334155',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          입시위치 진단
        </button>
        <button
          onClick={() => setView('simulation')}
          style={{
            padding: '0.75rem 1.1rem',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: view === 'simulation' ? '#0f172a' : 'transparent',
            color: view === 'simulation' ? '#fff' : '#334155',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          사정관 평가
        </button>
      </div>

      <div style={{ borderRadius: '1rem' }}>
        {view === 'diagnosis' ? <PositionDiagnosis onBack={onBack} studentData={studentData} /> : <EvaluationSimulation onBack={onBack} studentData={studentData} />}
      </div>
    </div>
  );
}

function MiniChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.45rem 0.75rem',
        borderRadius: '999px',
        backgroundColor: 'rgba(255,255,255,0.14)',
        fontSize: '0.82rem',
        fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
