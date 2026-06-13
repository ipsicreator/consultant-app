import { isCommonText } from '../../../utils/evaluationLogic';

interface SepecViewerProps {
  sepecData: { term: string; subject: string; text: string }[];
  keyword: string;
}

export default function SepecViewer({ sepecData, keyword }: SepecViewerProps) {
  const highlightText = (text: string) => {
    if (!keyword.trim()) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={index} style={{ backgroundColor: '#fef08a', padding: '0 0.2rem', borderRadius: '0.2rem', fontWeight: 'bold' }}>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sepecData.map((item, index) => {
        const isCommon = isCommonText(item.text);
        return (
          <div key={index} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', backgroundColor: isCommon ? '#fef2f2' : '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>
                [{item.term}] {item.subject}
              </span>
              {isCommon && <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>공통 서술 패턴</span>}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>{highlightText(item.text)}</p>
          </div>
        );
      })}
    </div>
  );
}
