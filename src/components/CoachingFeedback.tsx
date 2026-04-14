import React, { useState } from 'react';
import { ChevronLeft, Send, Paperclip, FileText, Bot, User, CheckCircle } from 'lucide-react';
import './CoachingFeedback.css';

interface CoachingFeedbackProps {
  onBack: () => void;
}

const CoachingFeedback: React.FC<CoachingFeedbackProps> = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'student', text: '선생님, 저번에 추천해주신 "엔지니어는 어떻게 일하는가" 읽고 탐구 보고서 초안 작성해봤습니다! 피드백 부탁드려요.', time: '10:30 AM' },
    { id: 2, sender: 'consultant', text: '네 지민학생, 초안 확인해볼게요. 서론에서 소프트웨어 공학과 구조 역학을 연결한 아이디어는 참 좋네요.', time: '11:15 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'consultant', text: newMessage, time: 'Just now' }]);
    setNewMessage('');
  };

  return (
    <div className="coaching-view">
      <div className="detail-header glass-panel">
        <button className="icon-btn secondary" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div className="coaching-meta">
          <h2>김지민 학생 코칭 룸</h2>
          <span className="tag-status process">보고서 첨삭 진행중</span>
        </div>
      </div>

      <div className="coaching-workspace">
        {/* Document Viewer Area (Left) */}
        <div className="document-panel glass-panel">
          <div className="doc-header">
            <FileText size={18} className="doc-icon" />
            <h3>[초안] 소프트웨어 시스템의 안정성과 건축 구조물 비교.pdf</h3>
            <button className="btn-secondary small ms-auto">AI 요약</button>
          </div>
          
          <div className="doc-viewer-mock">
            <div className="doc-page">
              <h1 className="doc-title">탐구 보고서: 소프트웨어 시스템의 안정성과 건축 구조물의 비교</h1>
              
              <h4>1. 탐구 동기</h4>
              <p>추천 도서인 '엔지니어는 어떻게 일하는가'를 읽고, 눈에 보이는 물리적 건축물(다리, 빌딩 등)이 붕괴하지 않기 위해 버티는 응력의 원리가 눈에 보이지 않는 무형의 소프트웨어 아키텍처에도 적용될 수 있지 않을까 하는 의문이 들었다. 특히 통합과학 시간에 배운 역학적 에너지 보존 법칙과 연결하여...</p>

              <h4>2. 탐구 내용</h4>
              <p className="highlight-text">
                (이 부분의 전개가 다소 비약적인 것 같습니다. 더 구체적인 사례를 넣어야 할 것 같아요.)
                소프트웨어의 트래픽 과부하는 마치 다리 위에 트럭이 많이 올라온 것과 같다. 따라서...
              </p>
            </div>
          </div>
        </div>

        {/* Feedback & Chat Area (Right) */}
        <div className="feedback-panel glass-panel">
          
          <div className="ai-coach-suggestion">
            <div className="coach-header">
              <Bot size={18} />
              <h4>AI 첨삭 어시스턴트 제안</h4>
            </div>
            <p><strong>[탐구 내용]</strong> 섹션 전개가 약합니다. 지민 학생의 진로(컴퓨터공학과)에 맞춰 '로드 밸런싱(Load Balancing)' 개념을 추가하도록 추천해보세요.</p>
            <button className="suggestion-btn">제안 내용 바로 복사</button>
          </div>

          <div className="chat-container">
            <div className="chat-history">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  <div className="chat-info">
                    {msg.sender === 'consultant' ? <User size={14} /> : <span className="student-avatar">S</span>}
                    <span className="name">{msg.sender === 'consultant' ? '나 (컨설턴트)' : '김지민'}</span>
                    <span className="time">{msg.time}</span>
                  </div>
                  <div className="chat-text">{msg.text}</div>
                </div>
              ))}
            </div>

            <div className="chat-input-area">
              <button className="icon-btn secondary attach-btn">
                <Paperclip size={18} />
              </button>
              <input 
                type="text" 
                placeholder="지민 학생에게 피드백 보내기..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="icon-btn send-btn" onClick={handleSend}>
                <Send size={18} />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CoachingFeedback;
