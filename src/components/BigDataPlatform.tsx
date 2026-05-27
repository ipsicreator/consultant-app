import React from 'react';
import { ExternalLink, Database, BookOpen } from 'lucide-react';

const BigDataPlatform: React.FC = () => {
  const platforms = [
    {
      id: 'snu',
      title: '서울대학교 데이터사이언스 지식정보플랫폼',
      desc: '다양한 입시 및 진로 관련 빅데이터 정보를 탐색할 수 있습니다.',
      url: 'https://likesnu.snu.ac.kr/usr/userMain.do',
      icon: <Database size={48} color="#3b82f6" />,
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      id: 'skku',
      title: '성균관대학교 전공가이드북 (웹진)',
      desc: '성균관대학교의 학과별 안내, 교육과정, 진로 정보를 열람할 수 있습니다.',
      url: 'https://book.skku.edu/review',
      icon: <BookOpen size={48} color="#10b981" />,
      bgColor: 'rgba(16, 185, 129, 0.1)'
    }
  ];

  const openPlatform = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bigdata-platform fade-in" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
      <header className="glass-panel" style={{ padding: '24px 32px', marginBottom: '24px', borderRadius: '16px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: 700 }}>대학 지식정보 플랫폼</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>각 대학에서 제공하는 입시/전공 지식정보망을 새 창에서 안전하게 이용하세요.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {platforms.map(platform => (
          <div key={platform.id} className="glass-panel" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            borderRadius: '16px', 
            padding: '40px 32px',
            textAlign: 'center',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{
              background: platform.bgColor,
              padding: '24px',
              borderRadius: '50%',
              marginBottom: '24px'
            }}>
              {platform.icon}
            </div>
            
            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '16px', lineHeight: '1.4' }}>
              {platform.title}
            </h3>
            
            <p style={{ color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '32px', flex: 1 }}>
              {platform.desc}
            </p>

            <button 
              onClick={() => openPlatform(platform.url)}
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <ExternalLink size={20} /> 새 창으로 열기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BigDataPlatform;
