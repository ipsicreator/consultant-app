import React from 'react';
import { ExternalLink } from 'lucide-react';

const BigDataPlatform: React.FC = () => {
  const openPlatform = () => {
    window.open('https://likesnu.snu.ac.kr/usr/userMain.do', '_blank');
  };

  return (
    <div className="bigdata-platform fade-in" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' }}>
      <header className="glass-panel" style={{ padding: '20px 32px', marginBottom: '24px', borderRadius: '16px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>빅데이터 지식정보플랫폼</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>다양한 입시 및 진로 관련 빅데이터 정보를 탐색할 수 있습니다.</p>
        </div>
        <button 
          onClick={openPlatform}
          className="btn-primary" 
          style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ExternalLink size={16} /> 새 창으로 열기 (권장)
        </button>
      </header>
      
      <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', borderRadius: '16px', padding: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', textAlign: 'center', fontSize: '0.85rem', zIndex: 1 }}>
          ⚠ 서울대 사이트 자체 보안 설정(외부 임베딩 차단)으로 인해 회색 화면이나 '연결 거부' 에러가 뜰 수 있습니다. 에러 발생 시 우측 상단의 [새 창으로 열기]를 눌러주세요.
        </div>
        <iframe 
          src="https://likesnu.snu.ac.kr/usr/userMain.do" 
          title="빅데이터 지식정보플랫폼"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', paddingTop: '40px' }}
        />
      </div>
    </div>
  );
};

export default BigDataPlatform;
