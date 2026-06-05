
import { isCommonText } from '../../utils/evaluationLogic';

interface SepecViewerProps {
  sepecData: { term: string; subject: string; text: string }[];
  keyword: string;
}

export default function SepecViewer({ sepecData, keyword }: SepecViewerProps) {
  const highlightText = (text: string) => {
    if (!keyword.trim()) return text;
    
    // Split text by keyword (case insensitive)
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} style={{ backgroundColor: '#fef08a', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> : part
    );
  };

  return (
    <div className="sepec-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sepecData.map((item, index) => {
        const isCommon = isCommonText(item.text);
        return (
          <div 
            key={index} 
            style={{ 
              padding: '1rem', 
              backgroundColor: isCommon ? '#fff1f2' : '#f8fafc',
              border: `1px solid ${isCommon ? '#fecdd3' : '#e2e8f0'}`,
              borderRadius: '0.5rem'
            }}
          >
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.subject}</span>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.term}</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
              {highlightText(item.text)}
            </div>
            {isCommon && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#e11d48' }}>
                * ê³µí†µ/?íˆ¬??ë¬¸êµ¬(ì²´í—˜???ì?) ?¬í•¨ ?˜ì‹¬
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
