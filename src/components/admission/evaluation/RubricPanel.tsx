"use client";


interface RubricPanelProps {
  rubricState: Record<string, string>;
  setRubricState: (state: Record<string, string>) => void;
  labels: string[];
}

export default function RubricPanel({ rubricState, setRubricState, labels }: RubricPanelProps) {
  const keys = ['academic', 'career', 'community', 'inquiry', 'attitude', 'growth'];
  const grades = ['A', 'B', 'C', 'D'];

  const handleGradeChange = (key: string, grade: string) => {
    setRubricState({ ...rubricState, [key]: grade });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1e293b' }}>??웾 ?됯?(猷⑤툕由?</h3>
      {labels.map((label, i) => {
        const key = keys[i] || keys[0];
        const currentGrade = rubricState[key] || 'B';
        
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#475569', width: '100px' }}>{label}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => handleGradeChange(key, g)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: currentGrade === g ? '#4f46e5' : '#e2e8f0',
                    color: currentGrade === g ? 'white' : '#475569',
                    transition: 'all 0.2s'
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


