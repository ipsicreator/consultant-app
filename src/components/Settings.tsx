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
  FileText
} from 'lucide-react';
import './Settings.css';

interface FieldDef {
  id: string;
  label: string;
  type: 'text' | 'image' | 'file';
  required: boolean;
  system?: boolean; // 삭제 불가 기본 항목
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'consultant'>('student');

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
    setTargetFields(targetFields.filter(f => f.id !== id));
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
          <h2>대치수프리마 마스터 환경 설정</h2>
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
          </ul>
        </div>

        {/* Right Form Builder Area */}
        <div className="settings-content glass-panel">
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

            {targetFields.map((field) => (
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

        </div>
      </div>
    </div>
  );
};

export default Settings;
