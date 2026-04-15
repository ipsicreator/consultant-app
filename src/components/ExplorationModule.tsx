import React, { useState } from 'react';
import { 
  ChevronLeft, Paperclip, FileText, Bot, 
  CheckCircle, BookOpen, Sparkles, Plus, X, Search, Database 
} from 'lucide-react';
import './ExplorationModule.css';
import { generateExplorationProposal } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { searchBooks, getBookDetail } from '../lib/aladin';

interface ExplorationModuleProps {
  onBack: () => void;
  studentData?: { id: string, name: string } | null;
}

const ExplorationModule: React.FC<ExplorationModuleProps> = ({ onBack, studentData }) => {
  const [bookTitle, setBookTitle] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [studentRecord, setStudentRecord] = useState<string>("기존 생기부 기록 없음");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // 첫 번째 제안 자동 확장

  // 도서 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchList, setShowSearchList] = useState(false);
  const [bookTOC, setBookTOC] = useState('');

  // 라이브러리(데이터뱅크) 검색 관련
  const [libSearchResults, setLibSearchResults] = useState<any[]>([]);

  const handleLibrarySearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setLibSearchResults([]);
      return;
    }
    const { data, error } = await supabase
      .from('exploration_library')
      .select('*')
      .or(`inquiry_title.ilike.%${keyword}%,book_title.ilike.%${keyword}%`)
      .limit(5);
    
    if (!error) setLibSearchResults(data || []);
  };

  const selectLibraryItem = (item: any) => {
    setBookTitle(item.book_title || '');
    setSearchQuery(item.book_title || '');
    setExtraContext(`[학원 우수 사례 참고]\n기존 탐구명: ${item.inquiry_title}\n내용: ${item.inquiry_content}\n---\n위 사례를 바탕으로 우리 학생에 맞춰 심화시켜주세요.`);
    setLibSearchResults([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowSearchList(true);
    try {
      const items = await searchBooks(searchQuery);
      setSearchResults(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectBook = async (book: any) => {
    setBookTitle(book.title);
    setShowSearchList(false);
    setSearchQuery(book.title);
    
    // 상세 정보(목차) 가져오기
    try {
      const detail = await getBookDetail(book.itemId);
      // 알라딘 응답 구조에 따라 detail.subInfo.toc 또는 detail.toc 확인
      const rawToc = detail?.subInfo?.toc || detail?.toc || "";
      
      if (rawToc) {
        // \n 을 <br/> 로 변환하여 HTML로 표시할 수 있게 처리
        const formattedToc = rawToc.replace(/\n/g, '<br/>');
        setBookTOC(formattedToc);
        setExtraContext(prev => prev); // 목시는 별도 상태로 관리하므로 굳이 덧붙이지 않음 (AI 요청 시 결합됨)
      } else {
        setBookTOC("이 도서는 제공되는 목차 정보가 없습니다.");
      }
    } catch (e) {
      console.error("목차 로드 에러:", e);
      setBookTOC("목차 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  React.useEffect(() => {
    if (studentData?.id) {
       fetchStudentRecord();
    }
  }, [studentData]);

  const fetchStudentRecord = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('analysis_result')
      .eq('id', studentData?.id)
      .single();
    
    if (!error && data?.analysis_result) {
      const res = data.analysis_result;
      const summary = `${studentData?.name} 학생 (${res.analysisSummary || ''}). \n전체 성적: ${res.grades?.map((g:any) => g.subject + ':' + g.score).join(', ')}`;
      setStudentRecord(summary);
    }
  };

  const handleGenerate = async () => {
    if (!bookTitle.trim()) {
      alert("도서명 혹은 탐구의 핵심 키워드를 입력해주세요!");
      return;
    }
    
    setIsGenerating(true);
    try {
      // 목차 정보와 추가 컨텍스트를 하나로 결합하여 AI에게 전달
      const combinedContext = `[관련 도서 목차]\n${bookTOC}\n\n[추가 자료/메모]\n${extraContext}`;
      const result = await generateExplorationProposal(studentRecord, bookTitle, combinedContext);
      if (result && result.proposals) {
        setProposals(result.proposals);
        setExpandedIndex(0); // 새로운 제안 나오면 첫 번째 열기
      }
    } catch (error) {
       alert("AI 탐구 제안 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("클립보드에 복사되었습니다!");
  };

  return (
    <div className="exploration-view">
      <div className="exploration-header glass-panel">
        <button className="icon-btn secondary" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div className="module-title">
          <h2><Sparkles size={24} color="#10b981" /> 탐구활동/수행평가</h2>
          <p>{studentData?.name ? `${studentData.name} 학생` : '선택된 학생'}의 도서와 외부 자료를 결합하여 활동을 설계합니다.</p>
        </div>
      </div>

      <div className="exploration-content">
        {/* Input Panel (Left) */}
        <div className="input-panel glass-panel">
          {/* [Phase 18] Library Search Bar */}
          <div className="input-group library-search-group" style={{ marginBottom: '24px', position: 'relative' }}>
            <label style={{ color: '#3b82f6' }}><Database size={16} /> 우리 학원 우수 사례/합격자 데이터뱅크 검색</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="키워드로 과거 우수 탐구 사례 찾기 (예: 인공지능, 세포...)" 
                style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
                onChange={(e) => handleLibrarySearch(e.target.value)}
              />
            </div>
            {libSearchResults.length > 0 && (
              <div className="lib-results-dropdown glass-panel">
                 {libSearchResults.map(item => (
                   <div key={item.id} className="lib-item" onClick={() => selectLibraryItem(item)}>
                      <div className="lib-title">{item.inquiry_title}</div>
                      <div className="lib-meta">{item.book_title} | {item.category}</div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '24px' }}></div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label><BookOpen size={16} /> 탐구 관련 도서 검색 (알라딘 연동)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="도서명을 검색하고 책을 선택하세요" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="btn-secondary" 
                onClick={handleSearch} 
                style={{ padding: '0 15px', borderRadius: '12px' }}
                disabled={isSearching}
              >
                <Search size={18} />
              </button>
            </div>

            {showSearchList && (
              <div className="book-search-results glass-panel">
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>검색 결과 {searchResults.length}건</span>
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => setShowSearchList(false)} />
                 </div>
                 <div className="search-items-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                   {isSearching ? (
                     <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>알라딘에서 찾는 중...</div>
                   ) : searchResults.length === 0 ? (
                     <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>검색 결과가 없습니다.</div>
                   ) : searchResults.map(book => (
                     <div 
                        key={book.itemId} 
                        className="search-item" 
                        onClick={() => selectBook(book)}
                        style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                     >
                       <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{book.title}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{book.author} | {book.publisher}</div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            
            {bookTitle && (
              <div className="selected-book-info animate-in" style={{ marginTop: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bookTOC ? '12px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> {bookTitle}
                    </div>
                    {bookTOC && <span style={{ fontSize: '0.75rem', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>목차 분석 완료</span>}
                  </div>
                  
                  {bookTOC && (
                    <div className="toc-preview" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', maxHeight: '120px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ marginBottom: '6px', color: '#cbd5e1', fontWeight: 'bold' }}>[도서 목차 미리보기]</div>
                      <div dangerouslySetInnerHTML={{ __html: bookTOC }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label><FileText size={16} /> 추가 탐구 컨텍스트 (뉴스, 논문, 아이디어)</label>
            <textarea 
              placeholder="도서 목차 외에 추가하고 싶은 뉴스 기사나 원장님의 아이디어를 적어주세요. AI가 모두 결합하여 분석합니다." 
              rows={6}
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </div>

          <div className="file-upload-zone">
            <Paperclip size={20} />
            <span>탐구 증빙 자료 업로드 (PDF/이미지)</span>
            <input type="file" className="file-input" />
          </div>

          <button 
            className={`generate-btn ${isGenerating ? 'loading' : ''}`} 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'AI가 최적의 탐구 경로를 찾는 중...' : <><Sparkles size={18} /> <span>탐구 제안서 생성 (1회 3종)</span></>}
          </button>
          
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            * Gemini 2.5 Flash 기반의 정밀 분석이 수행됩니다.
          </div>
        </div>

        {/* Results Panel (Right) - Accordion Style */}
        <div className="result-panel">
          {proposals.length === 0 ? (
            <div className="empty-result glass-panel" style={{ minHeight: '600px', justifyContent: 'center' }}>
              <div className="ai-pulse-icon" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
                <Bot size={56} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#f8fafc', marginBottom: '12px' }}>나만의 탐구 페이퍼를 설계해 보세요</h3>
              <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>왼쪽에 도서명이나 탐구할 주제를 입력하면, <br/>학생의 기존 활동과 연계된 3가지의 차별화된 심화 탐구 주제를 AI가 즉시 제안합니다.</p>
            </div>
          ) : (
            <div className="proposals-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {proposals.map((item, idx) => (
                <div key={idx} className={`proposal-item glass-panel ${expandedIndex === idx ? 'expanded' : ''}`} style={{ overflow: 'hidden', borderLeft: '4px solid #10b981' }}>
                  {/* Header: Title */}
                  <div 
                    className="item-header" 
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    style={{ padding: '20px 24px 10px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="idx-badge" style={{ background: '#10b981', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</span>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{item.title}</h3>
                    </div>
                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        className="copy-btn-small" 
                        onClick={(e) => { e.stopPropagation(); handleCopy(`${item.title}\n\n[동기]\n${item.motivation}\n\n[활동]\n${item.activities.join('\n')}\n\n[세특예시]\n${item.recordDraft}`); }}
                        style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >복사</button>
                    </div>
                  </div>

                  {/* Motivation: Always Visible */}
                  <div style={{ padding: '0 24px 15px 60px' }}>
                    <div className="sub-tag" style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>탐구 동기 및 추진 배경</div>
                    <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>{item.motivation}</p>
                    
                    <button 
                      onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.85rem', padding: '10px 0 0 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {expandedIndex === idx ? '상세 탐구 로직 접기' : '상세 탐구 로직 및 세특 예시 보기'} 
                      <Plus size={14} style={{ transform: expandedIndex === idx ? 'rotate(45deg)' : 'none', transition: '0.3s' }} />
                    </button>
                  </div>
                  
                  {/* Toggle Content: Activities & Draft */}
                  {expandedIndex === idx && (
                    <div className="item-content animate-in" style={{ padding: '0 24px 24px 60px' }}>
                       <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' }}></div>
                      <div className="content-section" style={{ marginBottom: '20px' }}>
                        <div className="sub-tag" style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>핵심 탐구 로직 (Step-by-Step)</div>
                        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                          {item.activities.map((act: any, aIdx: number) => (
                            <li key={aIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="record-draft-box" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                        <div className="sub-tag" style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '6px', fontWeight: 'bold' }}><Sparkles size={12} /> 생기부 세특 기재 예시</div>
                        <p style={{ fontSize: '0.9rem', color: '#34d399', fontStyle: 'italic', margin: 0 }}>"{item.recordDraft}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorationModule;
