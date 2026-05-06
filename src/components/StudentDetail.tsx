import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileSearch, 
  Save, 
  Award, 
  Activity, 
  CheckCircle,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './StudentDetail.css';

interface StudentDetailProps {
  studentData: { id: string; name: string } | null;
  onBack: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);

  useEffect(() => {
    if (studentData) {
      fetchPastAnalyses();
    }
  }, [studentData]);

  const fetchPastAnalyses = async () => {
    const { data, error } = await supabase
      .from('pdf_analyses')
      .select('*')
      .eq('student_id', studentData?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPastAnalyses(data);
      if (data.length > 0) {
        setAnalysisResult(data[0]);
      }
    }
  };

  const handleStartScan = async () => {
    if (!inputText.trim()) {
      alert("분석할 텍스트를 입력하거나 PDF를 스캔해 주세요.");
      return;
    }

    setIsScanning(true);
    try {
      // AI 분석 로직 (Gemini API 연동 부분은 별도 lib 활용 권장)
      // 여기서는 분석 프로세스 시뮬레이션 및 데이터 구조화만 수행
      setTimeout(() => {
        const mockResult = {
          analysis_summary: "전체적으로 학업 역량이 우수하며, 특히 수학 및 과학 교과에서 깊이 있는 탐구 역량이 돋보입니다. 진로에 대한 확신이 뚜렷하게 나타나는 생활기록부입니다.",
          grades: [
            { semester: "1-1", subject: "국어", credit: 4, score: 1.2, note: "비문학 독해 능력이 탁월함" },
            { semester: "1-1", subject: "수학", credit: 4, score: 1.0, note: "문제 해결 과정이 매우 창의적임" },
            { semester: "1-1", subject: "영어", credit: 4, score: 1.5, note: "원어민 수준의 표현력 보유" }
          ],
          activities: [
            { title: "자율활동", detail: "학급 회장으로서 갈등 중재 역량을 발휘함" },
            { title: "동아리활동", detail: "인공지능 탐구 동아리에서 딥러닝 모델을 직접 설계함" }
          ]
        };
        setAnalysisResult(mockResult);
        setIsScanning(false);
      }, 2000);
    } catch (error) {
      console.error("AI 분석 중 오류 발생:", error);
      setIsScanning(false);
    }
  };

  const handleSaveResult = async () => {
    if (!studentData || !analysisResult) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('pdf_analyses')
      .insert([{
        student_id: studentData.id,
        analysis_summary: analysisResult.analysis_summary,
        grades: analysisResult.grades,
        activities: analysisResult.activities
      }]);

    if (!error) {
      alert("분석 결과가 안전하게 저장되었습니다.");
      fetchPastAnalyses();
    } else {
      alert("저장 실패: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="student-detail fade-in">
      <header className="detail-header glass-panel">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>목록으로</span>
        </button>
        <div className="student-info-chip">
          <div className="avatar-small">{studentData?.name[0]}</div>
          <strong>{studentData?.name}</strong>
          <span className="id-badge">#{studentData?.id.slice(0, 5)}</span>
        </div>
      </header>

      <div className="detail-grid">
        {/* 왼쪽: 입력 및 스캔 섹션 */}
        <section className="scan-section glass-panel">
          <div className="section-title">
            <FileSearch size={20} />
            <h3>생활기록부 데이터 입력</h3>
          </div>
          <div className="input-area">
            <textarea 
              placeholder="생활기록부 텍스트를 붙여넣거나, PDF에서 추출된 내용을 입력하세요..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="scan-actions">
              <button className="btn-secondary">
                <Upload size={18} />
                <span>PDF 파일 업로드</span>
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStartScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>AI 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Activity size={18} />
                    <span>AI 정밀 분석 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 오른쪽: 결과 리포트 섹션 */}
        <section className="report-section glass-panel">
          <div className="section-title">
            <Award size={20} />
            <h3>AI 분석 리포트</h3>
            {analysisResult && (
              <button className="btn-mini-save" onClick={handleSaveResult} disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? '저장중' : '결과 저장'}</span>
              </button>
            )}
          </div>

          {!analysisResult ? (
            <div className="empty-report">
              <FileText size={48} />
              <p>왼쪽에서 분석을 시작해 주세요.</p>
            </div>
          ) : (
            <div className="report-content">
              <div className="summary-box">
                <h4><CheckCircle size={18} /> 종합 핵심 요약</h4>
                <p>{analysisResult.analysis_summary}</p>
              </div>

              <div className="grades-box">
                <h4><Award size={18} /> 주요 교과 성적 및 세특 분석</h4>
                <div className="compact-table">
                  <table>
                    <thead>
                      <tr>
                        <th>학기</th>
                        <th>과목</th>
                        <th>등급</th>
                        <th>핵심 포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.grades?.map((g: any, idx: number) => (
                        <tr key={idx}>
                          <td>{g.semester}</td>
                          <td>{g.subject}</td>
                          <td><span className="score-tag">{g.score}</span></td>
                          <td className="note-text">{g.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="activities-box">
                <h4><Activity size={18} /> 창체 및 세부 활동 요약</h4>
                <div className="activity-list">
                  {analysisResult.activities?.map((a: any, idx: number) => (
                    <div key={idx} className="activity-item">
                      <strong>{a.title}</strong>
                      <p>{a.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDetail;
