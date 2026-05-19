import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  FileSignature, 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  Image as ImageIcon,
  FileText,
  Database,
  Upload,
  FileDown,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { pb } from '../lib/pocketbase';
import { extractCaseFromPDF } from '../lib/gemini';
import './Settings.css';

interface FieldDef {
  id: string;
  label: string;
  type: 'text' | 'image' | 'file';
  required: boolean;
  system?: boolean; // 삭제 불가 기본 항목
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'consultant' | 'library'>('student');

  // 학생 등록 폼 초기 상태
  const [studentFields, setStudentFields] = useState<FieldDef[]>([
    { id: 's1', label: '학생명', type: 'text', required: true, system: true },
    { id: 's2', label: '재학 중인 학교명 및 학년', type: 'text', required: true, system: true },
    { id: 's3', label: '부모님 연락처', type: 'text', required: true, system: true },
    { id: 's4', label: '재학증명서 사본', type: 'file', required: true, system: false },
    { id: 's5', label: '1지망 희망 학과', type: 'text', required: false, system: false },
  ]);

  // 컨설턴트 등록 폼 초기 상태
  const [consultantFields, setConsultantFields] = useState<FieldDef[]>([
    { id: 'c1', label: '컨설턴트 성함', type: 'text', required: true, system: true },
    { id: 'c2', label: '연락처', type: 'text', required: true, system: true },
    { id: 'c3', label: '프로필 사진 등록', type: 'image', required: true, system: false },
    { id: 'c4', label: '전문 상담 분야 (예: 의치한, 컴공)', type: 'text', required: true, system: false },
    { id: 'c5', label: '관련 자격증 사본 첨부', type: 'file', required: false, system: false },
  ]);

  const [newFieldMode, setNewFieldMode] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text'|'image'|'file'>('text');
  const [newFieldReq, setNewFieldReq] = useState(false);

  // 대상 필드 배열 선택
  const targetFields = activeTab === 'student' ? studentFields : consultantFields;
  const setTargetFields = activeTab === 'student' ? setStudentFields : setConsultantFields;

  const handleDelete = (id: string) => {
    setTargetFields(targetFields.filter((f: any) => f.id !== id));
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: FieldDef = {
      id: 'custom-' + Date.now(),
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldReq,
      system: false
    };
    setTargetFields([...targetFields, newField]);
    setNewFieldMode(false);
    setNewFieldLabel('');
    setNewFieldReq(false);
  };

  const renderIcon = (type: string) => {
    switch(type) {
      case 'text': return <Type size={16} />;
      case 'image': return <ImageIcon size={16} />;
      case 'file': return <FileText size={16} />;
      default: return <Type size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'text': return '단답/서술 텍스트';
      case 'image': return '이미지(사진) 업로드';
      case 'file': return 'PDF/문서 증명서 업로드';
      default: return '텍스트';
    }
  };

  return (
    <div className="settings-view">
      <div className="detail-header glass-panel">
        <div className="title-area">
          <SettingsIcon size={24} className="accent-icon" />
          <h2>교과 탐구 세특 전문가 환경 설정</h2>
        </div>
      </div>

      <div className="settings-layout">
        {/* Left Setting Menu */}
        <div className="settings-menu glass-panel">
          <h3>설정 메뉴</h3>
          <ul>
            <li className={activeTab === 'student' ? 'active' : ''} onClick={() => setActiveTab('student')}>
              <Users size={18} /> 학생 등록 양식 커스텀
            </li>
            <li className={activeTab === 'consultant' ? 'active' : ''} onClick={() => setActiveTab('consultant')}>
              <FileSignature size={18} /> 컨설턴트 등록 양식 커스텀
            </li>
            <li className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
              <Database size={18} /> 합격자 라이브러리 관리
            </li>
          </ul>
        </div>

        {/* Right Content Area */}
        <div className="settings-content glass-panel">
          {activeTab === 'library' ? (
            <LibraryManager />
          ) : (
            <>
              <div className="content-header">
                <h3>{activeTab === 'student' ? '학생 신규 등원 폼 구성' : '위촉 컨설턴트 등록 폼 구성'}</h3>
                <p>
                  원생이나 컨설턴트를 등록할 때 <strong>필수/선택</strong>으로 받을 정보를 정의하세요. 
                  (예: 자격증, 재학증명서 등 문서 업로드 필드를 추가할 수 있습니다)
                </p>
              </div>

              <div className="form-builder-list">
                <div className="list-headers">
                  <div className="col-drag"></div>
                  <div className="col-label">입력 항목명</div>
                  <div className="col-type">입력 방식</div>
                  <div className="col-req">필수 여부</div>
                  <div className="col-action">관리</div>
                </div>

                {targetFields.map((field: any) => (
                  <div className={`field-row ${field.system ? 'system-row' : ''}`} key={field.id}>
                    <div className="col-drag">
                      <GripVertical size={18} className="drag-handle" />
                    </div>
                    <div className="col-label">
                      <strong>{field.label}</strong>
                      {field.system && <span className="sys-badge">기본</span>}
                    </div>
                    <div className="col-type">
                      <div className="type-badge">
                        {renderIcon(field.type)}
                        {getTypeLabel(field.type)}
                      </div>
                    </div>
                    <div className="col-req">
                      {field.required ? <span className="req-text yes">필수</span> : <span className="req-text no">선택</span>}
                    </div>
                    <div className="col-action">
                      {field.system ? (
                        <span className="locked-text">시스템 삭제불가</span>
                      ) : (
                        <button className="icon-btn secondary danger" onClick={() => handleDelete(field.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {newFieldMode ? (
                <div className="add-field-workspace">
                  <h4>🔥 새 등록 항목(필드) 만들기</h4>
                  <div className="add-grid">
                    <div className="add-group">
                      <label>항목 이름 (질문)</label>
                      <input 
                        type="text" 
                        placeholder="예) 가장 취약한 과목은?, 어학성적 증명서 등" 
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                      />
                    </div>
                    <div className="add-group">
                      <label>입력 형태</label>
                      <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)}>
                        <option value="text">텍스트 (일반 글자 입력)</option>
                        <option value="image">그림/사진 업로드 (JPG, PNG)</option>
                        <option value="file">문서/증명서 업로드 (PDF 등)</option>
                      </select>
                    </div>
                    <div className="add-group checkbox-align">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={newFieldReq} 
                          onChange={(e) => setNewFieldReq(e.target.checked)} 
                        />
                        반드시 입력해야하는 필수 항목입니까?
                      </label>
                    </div>
                  </div>
                  <div className="add-actions">
                    <button className="btn-secondary" onClick={() => setNewFieldMode(false)}>취소</button>
                    <button className="btn-primary" onClick={handleAddField}>이 항목을 등록 폼에 추가</button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary add-trigger-btn" onClick={() => setNewFieldMode(true)}>
                  <Plus size={18} /> 새로운 등록 항목 추가하기
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// --- Library Manager Sub-Component ---
const LibraryManager: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fetchLibrary = async () => {
    try {
      const records = await pb.collection('suprima_exploration_library').getFullList({
        sort: '-created',
      });
      setItems(records);
    } catch (error) {
      console.error("Fetch library error:", error);
    }
  };

  React.useEffect(() => {
    fetchLibrary();
  }, []);

  // 엑셀 일괄 업로드
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('엑셀 데이터를 분석 중...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      setUploadStatus(`${data.length}건의 데이터를 DB에 적재 중...`);
      
      const toInsert = data.map((row: any) => ({
        book_title: row['도서명'] || row['title'] || '',
        author: row['저자'] || row['author'] || '',
        inquiry_title: row['탐구주제'] || row['inquiry'] || '',
        inquiry_content: row['탐구내용'] || row['content'] || '',
        category: row['계열'] || row['category'] || '',
        source_type: 'excel'
      }));

      try {
        // PocketBase 병렬 처리 (청크 단위)
        const CHUNK_SIZE = 10;
        for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
          const chunk = toInsert.slice(i, i + CHUNK_SIZE);
          setUploadStatus(`${data.length}건 중 ${i + chunk.length}건 적재 중...`);
          await Promise.all(chunk.map(item => pb.collection('suprima_exploration_library').create(item)));
        }
        alert('업로드 완료!');
        fetchLibrary();
      } catch (error: any) {
        alert('업로드 중 일부 오류가 발생했습니다: ' + error.message);
      }
      setIsUploading(false);
      setUploadStatus('');
    };
    reader.readAsBinaryString(file);
  };

  // PDF AI 스캐닝 업로드
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('AI가 PDF 내용을 읽고 분석하는 중 (약 10~20초 소요)...');

    try {
      const extracted = await extractCaseFromPDF(file);
      await pb.collection('suprima_exploration_library').create({
        ...extracted,
        source_type: 'pdf'
      });
      alert('AI PDF 분석 및 저장 완료!');
      fetchLibrary();
    } catch (err: any) {
      alert('분석 실패: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await pb.collection('suprima_exploration_library').delete(id);
      fetchLibrary();
    } catch (error) {
      console.error("Delete item error:", error);
    }
  };

  return (
    <div className="library-manager">
      <div className="content-header">
        <h3>합격자 도서/탐구 라이브러리 (데이터뱅크)</h3>
        <p>기록은 힘이 됩니다. 과거 우수 사례를 누적하여 상담 경쟁력을 높이세요.</p>
      </div>

      <div className="upload-actions">
        <label className="upload-card">
          <FileDown size={32} />
          <div className="info">
            <strong>엑셀(XLSX) 일괄 등록</strong>
            <span>기존 도서/탐구 리스트를 한 번에 업로드</span>
          </div>
          <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} hidden disabled={isUploading} />
        </label>

        <label className="upload-card ai-scan">
          <Upload size={32} />
          <div className="info">
            <strong>합격생 PDF AI 스캔</strong>
            <span>보고서나 포트폴리오에서 정보를 자동 추출</span>
          </div>
          <input type="file" accept=".pdf" onChange={handlePDFUpload} hidden disabled={isUploading} />
        </label>
      </div>

      {isUploading && (
        <div className="upload-progress glass-panel animate-pulse">
          <Sparkles size={20} className="spin" />
          <span>{uploadStatus}</span>
        </div>
      )}

      <div className="library-list-container">
        <div className="list-headers">
           <div style={{ width: '40px' }}></div>
           <div style={{ flex: 1 }}>도서명/저자</div>
           <div style={{ flex: 2 }}>탐구주제(합격사례)</div>
           <div style={{ width: '100px' }}>계열</div>
           <div style={{ width: '60px' }}>출처</div>
           <div style={{ width: '60px' }}>삭제</div>
        </div>
        <div className="library-items-scroll">
          {items.map((item: any, idx: number) => (
            <div className="library-row" key={item.id}>
              <div style={{ width: '40px', color: '#64748b' }}>{items.length - idx}</div>
              <div style={{ flex: 1 }}>
                <strong>{item.book_title}</strong>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.author}</div>
              </div>
              <div style={{ flex: 2 }}>
                 <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{item.inquiry_title}</div>
                 <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    {item.inquiry_content?.substring(0, 80)}...
                 </div>
              </div>
              <div style={{ width: '100px' }}>
                <span className="category-badge">{item.category}</span>
              </div>
              <div style={{ width: '60px', textAlign: 'center' }}>
                {item.source_type === 'pdf' ? <FileText size={16} color="#10b981" /> : <Database size={16} color="#3b82f6" />}
              </div>
              <div style={{ width: '60px' }}>
                 <button className="icon-btn secondary danger" onClick={() => deleteItem(item.id)}>
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
