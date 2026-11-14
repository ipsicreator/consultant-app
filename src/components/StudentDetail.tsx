import StudentActivities from './StudentActivities';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, FileSearch, Save, FileText, RefreshCw, Sparkles, History, ClipboardList, ChevronRight, BarChart3, Target, Printer, Upload, Send,
  Square, Plus, Trash2, Calendar, CheckCircle2, AlertCircle, X, ExternalLink, FlaskConical, Scale, BookOpen, Lightbulb, Check, Copy
} from 'lucide-react';
import {
  type ConsultantRecommendation,
  INQUIRY_METHODOLOGY_GUIDES,
  CURATED_MATCHING_TEMPLATES
} from '../lib/inquiryMatchingTemplates';
import { pdfPayload, requestLabAI, SUPREMA_LAB_URL } from '../lib/lab';
import { requireStudentAccess } from '../lib/profileLink';
import { studentAnalysis, evidenceAverage } from '../lib/analysisResult';
import { readStudentDraft, sessionIdentity, studentRecords } from '../lib/studentRecords';
import { draftStorageKey } from '../lib/academyScope';
import ConsultantGuideModal from './ConsultantGuideModal';
import './StudentDetail.css';

interface StudentDetailProps {
  studentData: { id: string; name: string } | null;
  onBack: () => void;
}

type Analysis = {
  summary: string;
  gradeAnalysis: { subject: string; score: number | null; comment: string }[];
  strengths: string[];
  improvements: string[];
  finalRecordDraft: string;
  studentKeywords: string[];
};

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const generation = useRef(0), draftIdentity = useRef('');
  const currentTask = (ticket: number, identity: string) => ticket === generation.current && identity === sessionIdentity();
  const [activeView, setActiveView] = useState<'analysis' | 'planner' | 'evaluation' | 'recommendation'>('analysis');
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Input fields (initialized from localStorage if available)
  const [inputText, setInputText] = useState('');
  const [hopeMajor, setHopeMajor] = useState('');
  const [gpa, setGpa] = useState('');
  const [activities, setActivities] = useState('');

  // Results & History list (contains raw pb records)
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // User Keywords
  const [userKeywords, setUserKeywords] = useState(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consulting Service Term (1개월, 3개월, 6개월 정기 관리)
  const [serviceTerm, setServiceTerm] = useState<'1month' | '3month' | '6month'>(() => {
    try {
      const saved = localStorage.getItem(`service_term:${studentData?.id}`);
      if (saved === '1month' || saved === '3month' || saved === '6month') return saved;
    } catch {}
    return '3month';
  });

  const handleTermChange = (term: '1month' | '3month' | '6month') => {
    setServiceTerm(term);
    try {
      if (studentData?.id) {
        localStorage.setItem(`service_term:${studentData.id}`, term);
      }
    } catch {}
  };

  // Planner States
  const [plannerRecord, setPlannerRecord] = useState<any>(null);
  const [plannerTasks, setPlannerTasks] = useState<any[]>([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState<number>(1);

  // Evaluation States
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [isEditingEval, setIsEditingEval] = useState(false);
  const [evalType, setEvalType] = useState<'monthly' | 'quarterly' | 'semester'>('monthly');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalSemester, setEvalSemester] = useState('');
  const [evalAttitude, setEvalAttitude] = useState('');
  const [evalInquiry, setEvalInquiry] = useState('');
  const [evalPlan, setEvalPlan] = useState('');
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [printEval, setPrintEval] = useState<any>(null);

  // Recommendations & AI Matching States
  const [recommendationRecord, setRecommendationRecord] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<ConsultantRecommendation[]>([]);
  const [activeRecCategory, setActiveRecCategory] = useState<'all' | 'science' | 'social' | 'ai' | 'general'>('all');
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [printRec, setPrintRec] = useState<ConsultantRecommendation | 'all' | null>(null);
  const [isGuideBookModalOpen, setIsGuideBookModalOpen] = useState(false);

  // Form States for Recommendation
  const [recCategory, setRecCategory] = useState<'science' | 'social' | 'ai' | 'general'>('science');
  const [recSubject, setRecSubject] = useState('');
  const [recTopicTitle, setRecTopicTitle] = useState('');
  const [recBookTitle, setRecBookTitle] = useState('');
  const [recBookAuthor, setRecBookAuthor] = useState('');
  const [recBookPublisher, setRecBookPublisher] = useState('');
  const [recCoreConcept, setRecCoreConcept] = useState('');
  const [recSetukDraft, setRecSetukDraft] = useState('');
  const [recConsultantTip, setRecConsultantTip] = useState('');
  const [autoAddPlanner, setAutoAddPlanner] = useState(true);
  const [autoAddPlannerWeek, setAutoAddPlannerWeek] = useState(1);
  const [isSavingRec, setIsSavingRec] = useState(false);
  const [modalTab, setModalTab] = useState<'guide' | 'templates' | 'form'>('templates');


  const loadHistory = async () => {
    if (!studentData?.id) return;
    const ticket = generation.current, identity = sessionIdentity();
    try {
      const records = await studentRecords(studentData?.id).getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      });
      if (!currentTask(ticket, identity)) return;
      setHistory(records);

      // Filter evaluation history
      const evals = records.filter(r => r.content?.dataType === 'evaluation');
      setEvaluationHistory(evals);

      // Load recommendation data
      const rec = records.find(r => r.content?.dataType === 'recommendations');
      setRecommendationRecord(rec);
      if (rec && Array.isArray(rec.content?.items)) {
        setRecommendations(rec.content.items);
      } else {
        try {
          const local = localStorage.getItem(`suprima_recommendations:${identity}:${studentData.id}`);
          if (local) setRecommendations(JSON.parse(local));
          else setRecommendations([]);
        } catch { setRecommendations([]); }
      }

      // Load planner data
      const planner = records.find(r => r.content?.dataType === 'planner');
      setPlannerRecord(planner);
      if (planner) {
        setPlannerTasks(planner.content?.tasks || []);
        setFeedbackNote(planner.content?.consultantNote || '');
      } else {
        setPlannerTasks([]);
        setFeedbackNote('');
      }
    } catch (e) {
      console.error('loadHistory error:', e);
    }
  };

useEffect(() => {
    const ticket = ++generation.current, identity = sessionIdentity(); draftIdentity.current = '';
    setInputText(''); setHopeMajor(''); setGpa(''); setActivities(''); setResult(null); setHistory([]); setEvaluationHistory([]); setPlannerRecord(null); setPlannerTasks([]); setFeedbackNote(''); setSelectedEval(null); setPrintEval(null); setRecommendationRecord(null); setRecommendations([]); setPrintRec(null); setIsRecModalOpen(false); setUserKeywords(['', '', '']); setActiveView('analysis'); setIsEditingEval(false);
    const load = async () => {
      if (!studentData?.id) return;
      try {
        const saved = await readStudentDraft(studentData.id);
        if (!currentTask(ticket, identity)) return;
        setHopeMajor(saved.hopeMajor || ''); setGpa(saved.gpa || ''); setActivities(saved.activities || '');
        draftIdentity.current = identity + ':' + studentData.id;
        await loadHistory();
      } catch (error) { if (currentTask(ticket, identity)) console.error('Student access unavailable', error); }
    }; void load();
    return () => { generation.current++; draftIdentity.current = ''; };
  }, [studentData?.id]);

  useEffect(() => {
    const identity = sessionIdentity();
    if (studentData?.id && identity && draftIdentity.current === identity + ':' + studentData.id) {
      try { localStorage.setItem(draftStorageKey(identity, studentData.id), JSON.stringify({ hopeMajor, gpa, activities })); } catch { /* Draft storage may be unavailable. */ }
    }
  }, [hopeMajor, gpa, activities, studentData?.id]);



  useEffect(() => {
    const handleTransfer = async (e: any) => {
      if (e.detail && e.detail.title && studentData?.id) {
        try {
          const records = await studentRecords(studentData?.id).getFullList({
            filter: `student_id = "${studentData.id}"`,
            sort: '-created',
          });
          const planner = records.find(r => r.content?.dataType === 'planner');
          const currentTasks = planner?.content?.tasks || [];
          const currentNote = planner?.content?.consultantNote || '';

          const newTask = {
            id: Date.now().toString() + Math.random().toString(),
            text: `[탐구활동] ${e.detail.title}`,
            week: 1,
            done: false,
          };
          const updatedTasks = [...currentTasks, newTask];
          const content = {
            dataType: 'planner',
            tasks: updatedTasks,
            consultantNote: currentNote
          };

          if (planner) {
            if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

            await requireStudentAccess(studentData.id);

            await studentRecords(studentData?.id).update(planner.id, { content });
          } else {
            if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

            await requireStudentAccess(studentData.id);

            await studentRecords(studentData?.id).create({
              student_id: studentData.id,
              content
            });
          }
          await loadHistory();
          alert(`[탐구활동 제안]에서 '${e.detail.title}' 과제가 플래너에 추가되었습니다!`);
        } catch (err) {
          console.error('Planner transfer error:', err);
        }
      }
    };
    window.addEventListener('TRANSFER_TO_PLANNER', handleTransfer);
    return () => window.removeEventListener('TRANSFER_TO_PLANNER', handleTransfer);
  }, [studentData?.id, plannerRecord]);

  // Save Recommendation Data to PocketBase and localStorage
  const saveRecommendationsData = async (items: ConsultantRecommendation[]) => {
    if (!studentData?.id) return;
    const identity = sessionIdentity();
    try {
      localStorage.setItem(`suprima_recommendations:${identity}:${studentData.id}`, JSON.stringify(items));
    } catch {}

    const content = {
      dataType: 'recommendations',
      items
    };

    try {
      if (recommendationRecord) {
        await studentRecords(studentData.id).update(recommendationRecord.id, { content });
      } else {
        const created = await studentRecords(studentData.id).create({
          student_id: studentData.id,
          content
        });
        setRecommendationRecord(created);
      }
    } catch (err) {
      console.error('saveRecommendationsData error:', err);
    }
  };

  const handleOpenMatchModal = (category: 'science' | 'social' | 'ai' | 'general' = 'science', defaultTab: 'guide' | 'templates' | 'form' = 'templates') => {
    setEditingRecId(null);
    setRecCategory(category);
    setModalTab(defaultTab);
    const tmpl = CURATED_MATCHING_TEMPLATES.find(t => t.category === category);
    if (tmpl && defaultTab === 'form') {
      setRecSubject(tmpl.subject);
      setRecTopicTitle(tmpl.topicTitle);
      setRecBookTitle(tmpl.bookTitle);
      setRecBookAuthor(tmpl.bookAuthor || '');
      setRecBookPublisher(tmpl.bookPublisher || '');
      setRecCoreConcept(tmpl.coreConcept);
      setRecSetukDraft(tmpl.setukDraft);
      setRecConsultantTip(tmpl.consultantTip || '');
    } else {
      setRecSubject(category === 'science' ? '과학탐구실험 / 통합과학' : category === 'social' ? '사회·문화 / 경제' : category === 'ai' ? '정보 / 인공지능' : '공통');
      setRecTopicTitle('');
      setRecBookTitle('');
      setRecBookAuthor('');
      setRecBookPublisher('');
      setRecCoreConcept('');
      setRecSetukDraft('');
      setRecConsultantTip('');
    }
    setAutoAddPlanner(true);
    setAutoAddPlannerWeek(1);
    setIsRecModalOpen(true);
  };

  const handleApplyTemplate = (tmpl: ConsultantRecommendation) => {
    setRecCategory(tmpl.category);
    setRecSubject(tmpl.subject);
    setRecTopicTitle(tmpl.topicTitle);
    setRecBookTitle(tmpl.bookTitle);
    setRecBookAuthor(tmpl.bookAuthor || '');
    setRecBookPublisher(tmpl.bookPublisher || '');
    setRecCoreConcept(tmpl.coreConcept);
    setRecSetukDraft(tmpl.setukDraft);
    setRecConsultantTip(tmpl.consultantTip || '');
    setModalTab('form');
  };

  const handleSaveRecommendation = async () => {
    if (!recTopicTitle.trim()) {
      alert('탐구 주제명을 입력해 주세요.');
      return;
    }
    if (!recBookTitle.trim()) {
      alert('필수 연계 도서명을 입력해 주세요.');
      return;
    }
    if (!recSetukDraft.trim()) {
      alert('추천 세특 문장을 입력해 주세요.');
      return;
    }

    setIsSavingRec(true);
    try {
      let updated: ConsultantRecommendation[];
      const targetItem: ConsultantRecommendation = {
        id: editingRecId || Date.now().toString() + Math.random().toString(),
        category: recCategory,
        subject: recSubject || '교과 공통',
        topicTitle: recTopicTitle.trim(),
        bookTitle: recBookTitle.trim(),
        bookAuthor: recBookAuthor.trim(),
        bookPublisher: recBookPublisher.trim(),
        coreConcept: recCoreConcept.trim(),
        setukDraft: recSetukDraft.trim(),
        consultantTip: recConsultantTip.trim(),
        status: 'recommended',
        createdAt: new Date().toISOString().slice(0, 10)
      };

      if (editingRecId) {
        updated = recommendations.map(r => r.id === editingRecId ? targetItem : r);
      } else {
        updated = [targetItem, ...recommendations];
      }

      setRecommendations(updated);
      await saveRecommendationsData(updated);

      if (autoAddPlanner && !editingRecId) {
        await handleTransferRecToPlanner(targetItem, autoAddPlannerWeek);
      }

      alert(`'${targetItem.topicTitle}' 탐구·독서·세특이 성공적으로 매칭되었습니다!`);
      setIsRecModalOpen(false);
    } catch (err) {
      console.error('handleSaveRecommendation error:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingRec(false);
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    if (!window.confirm('이 추천 항목을 삭제하시겠습니까?')) return;
    const updated = recommendations.filter(r => r.id !== id);
    setRecommendations(updated);
    await saveRecommendationsData(updated);
  };

  const handleTransferRecToPlanner = async (rec: ConsultantRecommendation, week: number = 1) => {
    if (!studentData?.id) return;
    try {
      const records = await studentRecords(studentData.id).getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      });
      const planner = records.find(r => r.content?.dataType === 'planner');
      const currentTasks = planner?.content?.tasks || plannerTasks || [];
      const currentNote = planner?.content?.consultantNote || feedbackNote || '';

      const categoryLabel = rec.category === 'science' ? '과학AI' : rec.category === 'social' ? '사회AI' : rec.category === 'ai' ? 'AI데이터' : '탐구';
      const newTask = {
        id: Date.now().toString() + Math.random().toString(),
        text: `[${categoryLabel}] ${rec.topicTitle} (도서: ${rec.bookTitle})`,
        week,
        done: false,
      };
      const updatedTasks = [...currentTasks, newTask];
      const content = {
        dataType: 'planner',
        tasks: updatedTasks,
        consultantNote: currentNote
      };

      if (planner) {
        await studentRecords(studentData.id).update(planner.id, { content });
      } else {
        const created = await studentRecords(studentData.id).create({
          student_id: studentData.id,
          content
        });
        setPlannerRecord(created);
      }
      setPlannerTasks(updatedTasks);
    } catch (err) {
      console.error('Transfer to planner error:', err);
    }
  };

  const loadPreloadedExamples = async () => {
    if (!studentData?.id) return;
    const examples = CURATED_MATCHING_TEMPLATES.slice(0, 3).map(tmpl => ({
      ...tmpl,
      id: Date.now().toString() + Math.random().toString(),
      createdAt: new Date().toISOString().slice(0, 10)
    }));
    const updated = [...examples, ...recommendations];
    setRecommendations(updated);
    await saveRecommendationsData(updated);
    alert('대치 수프리마 엄선 과학·사회·AI 심화탐구 3종이 학생 추천으로 불러와졌습니다!');
  };

  // Listen to ADD_RECOMMENDATION event
  useEffect(() => {
    const handleAddRec = async (e: any) => {
      if (e.detail && studentData?.id) {
        const newRec: ConsultantRecommendation = {
          id: Date.now().toString() + Math.random().toString(),
          category: e.detail.category || 'general',
          subject: e.detail.subject || '공통',
          topicTitle: e.detail.topicTitle || '',
          bookTitle: e.detail.bookTitle || '',
          bookAuthor: e.detail.bookAuthor || '',
          bookPublisher: e.detail.bookPublisher || '',
          coreConcept: e.detail.coreConcept || '',
          setukDraft: e.detail.setukDraft || '',
          consultantTip: e.detail.consultantTip || '',
          status: 'recommended',
          createdAt: new Date().toISOString().slice(0, 10)
        };
        const updated = [newRec, ...recommendations];
        setRecommendations(updated);
        await saveRecommendationsData(updated);
        alert(`'${newRec.topicTitle}' 탐구·독서·세특이 학생 추천 목록에 추가되었습니다.`);
      }
    };
    window.addEventListener('ADD_RECOMMENDATION', handleAddRec);
    return () => window.removeEventListener('ADD_RECOMMENDATION', handleAddRec);
  }, [studentData?.id, recommendations, recommendationRecord]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ticket = generation.current, identity = sessionIdentity();
    setIsPdfLoading(true);
    try {
      if (studentData?.id) await requireStudentAccess(studentData.id);
      const extracted = await requestLabAI('extract-student-text', { file: await pdfPayload(file) });
      if (typeof extracted.text !== 'string') throw new Error('PDF 추출 응답을 확인해 주세요.');
      if (!currentTask(ticket, identity)) return;
      const extractedText = extracted.text;
      setInputText(prev => prev + (prev ? '\n\n' : '') + extractedText.trim());
    } catch (error) {
      console.error('PDF extraction error:', error);
      alert('AI PDF 텍스트 추출에 실패했습니다. 암호가 걸려있지 않은지 확인해 주세요.');
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runAnalysis = async () => {
    if (!inputText.trim()) {
      alert('학생부 내용이나 근거를 입력해 주세요.');
      return;
    }

    const ticket = generation.current, identity = sessionIdentity();
    setIsScanning(true);
    try {
      if (studentData?.id) await requireStudentAccess(studentData.id);
      const parsed = await requestLabAI('analyze-student-text', { inputText, hopeMajor, gpa, activities });
      if (!currentTask(ticket, identity)) return;
      setResult(studentAnalysis(parsed));
      if (parsed.detectedGpa && !gpa) setGpa(parsed.detectedGpa);
      if (parsed.detectedActivities && !activities) setActivities(parsed.detectedActivities);
      setUserKeywords(['', '', '']);
    } catch (e) {
      console.error(e);
      setResult(null);
      alert(e instanceof Error ? e.message : '분석을 완료하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsScanning(false);
    }
  };

  const saveAnalysis = async () => {
    if (!studentData?.id || !result) return;
    setIsSaving(true);
    try {
      if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

      await requireStudentAccess(studentData.id);

      await studentRecords(studentData?.id).create({ student_id: studentData.id, content: result });
      await loadHistory();
      alert('분석 결과가 저장되었습니다.');
    } catch (e: any) {
      alert(`저장 실패: ${e?.message || 'unknown'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToExploration = () => {
    if (!result) return;
    const data = {
      student: result.studentKeywords,
      user: userKeywords.filter(k => k.trim()),
    };
    sessionStorage.setItem('exploration_keywords:' + sessionIdentity() + ':' + (studentData?.id || 'unassigned'), JSON.stringify(data));

    // Dispatch a custom event to navigate globally
    window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'exploration' }));
  };

  const printResult = () => {
    window.print();
  };

  // Save Evaluation
  const handleSaveEvaluation = async () => {
    if (!studentData?.id) return;
    if (!evalTitle.trim()) {
      alert('평가서 제목을 입력해 주세요.');
      return;
    }
    setIsSavingEval(true);
    const content = {
      dataType: 'evaluation',
      evalType,
      title: evalTitle,
      semester: evalSemester,
      attitude: evalAttitude,
      inquiry: evalInquiry,
      plan: evalPlan,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };
    try {
      if (selectedEval && isEditingEval) {
        // Edit existing
        if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

        await requireStudentAccess(studentData.id);

        await studentRecords(studentData?.id).update(selectedEval.id, { content });
        alert('평가서가 수정되었습니다.');
      } else {
        // Create new
        if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

        await requireStudentAccess(studentData.id);

        await studentRecords(studentData?.id).create({
          student_id: studentData.id,
          content
        });
        alert('평가서가 저장되었습니다.');
      }
      setIsEditingEval(false);
      setSelectedEval(null);
      await loadHistory();
    } catch (e: any) {
      alert(`평가서 저장 실패: ${e?.message}`);
    } finally {
      setIsSavingEval(false);
    }
  };

  // Delete Evaluation
  const handleDeleteEvaluation = async (id: string) => {
    if (window.confirm('이 평가서를 정말로 삭제하시겠습니까?')) {
      try {
        if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

        await requireStudentAccess(studentData.id);

        await studentRecords(studentData?.id).delete(id);
        alert('평가서가 삭제되었습니다.');
        setSelectedEval(null);
        await loadHistory();
      } catch (e: any) {
        alert(`평가서 삭제 실패: ${e?.message}`);
      }
    }
  };

  // Edit Mode Activation
  const handleStartEditEval = (ev: any) => {
    setSelectedEval(ev);
    setEvalType(ev.content.evalType || 'monthly');
    setEvalTitle(ev.content.title || '');
    setEvalSemester(ev.content.semester || '');
    setEvalAttitude(ev.content.attitude || '');
    setEvalInquiry(ev.content.inquiry || '');
    setEvalPlan(ev.content.plan || '');
    setIsEditingEval(true);
  };

  // Create Mode Activation
  const handleStartCreateEval = () => {
    setSelectedEval(null);
    setEvalType('monthly');
    setEvalTitle('');
    setEvalSemester('');
    setEvalAttitude('');
    setEvalInquiry('');
    setEvalPlan('');
    setIsEditingEval(true);
  };

  // Save Planner Data
  const savePlannerData = async (tasks: any[], note: string) => {
    if (!studentData?.id) return;
    const content = {
      dataType: 'planner',
      tasks,
      consultantNote: note
    };
    try {
      if (plannerRecord) {
        if (!studentData?.id) throw new Error('학생을 먼저 선택해 주세요.');

        await requireStudentAccess(studentData.id);

        await studentRecords(studentData?.id).update(plannerRecord.id, { content });
      } else {
        const newRecord = await studentRecords(studentData?.id).create({
          student_id: studentData.id,
          content
        });
        setPlannerRecord(newRecord);
      }

      // Reload history to keep records updated
      const records = await studentRecords(studentData?.id).getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      });
      setHistory(records);
      const planner = records.find(r => r.content?.dataType === 'planner');
      setPlannerRecord(planner);
    } catch (err: any) {
      console.error('Planner save error:', err);
    }
  };

  // Add Task
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString() + Math.random().toString(),
      text: newTaskText,
      week: newTaskWeek,
      done: false,
    };
    const updated = [...plannerTasks, newTask];
    setPlannerTasks(updated);
    setNewTaskText('');
    savePlannerData(updated, feedbackNote);
  };

  // Toggle Task Status
  const handleToggleTask = (id: string) => {
    const updated = plannerTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setPlannerTasks(updated);
    savePlannerData(updated, feedbackNote);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updated = plannerTasks.filter(t => t.id !== id);
    setPlannerTasks(updated);
    savePlannerData(updated, feedbackNote);
  };

  // Handle File Upload/Change for Task
  const handleFileChangeForTask = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = plannerTasks.map(t => t.id === taskId ? { ...t, fileName: file.name } : t);
      setPlannerTasks(updated);
      savePlannerData(updated, feedbackNote);
      alert(`[${file.name}] 결과물이 과제에 매칭되어 등록되었습니다.`);
    }
  };

  const avg = result ? evidenceAverage(result.gradeAnalysis) : null;

  return (
    <div className="student-detail fade-in">
      <header className="detail-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
          <div className="student-profile">
            <div className="avatar">{studentData?.name?.[0] || '학'}</div>
            <div className="info">
              <h3>{studentData?.name || '학생'} 종합 케어</h3>
              <span>분석 · 플래닝 · 성과 관리 · 평가서 작성</span>
            </div>
          </div>
        </div>
        <div className="header-tabs">
          <button className={activeView === 'analysis' ? 'active' : ''} onClick={() => setActiveView('analysis')}><Sparkles size={16} /> 1. 학생부 분석</button>
          <button className={activeView === 'planner' ? 'active' : ''} onClick={() => setActiveView('planner')}><ClipboardList size={16} /> 2. 밀착 플래너</button>
          <button className={activeView === 'evaluation' ? 'active' : ''} onClick={() => setActiveView('evaluation')}><FileText size={16} /> 3. 성장 평가서</button>
          <button className={activeView === 'recommendation' ? 'active' : ''} onClick={() => setActiveView('recommendation')}><Lightbulb size={16} /> 4. 탐구·독서·세특 추천 & AI 매칭</button>
        </div>
        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="service-term-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>컨설팅 과정:</span>
            <select
              aria-label="컨설팅 서비스 기간"
              value={serviceTerm}
              onChange={(e) => handleTermChange(e.target.value as any)}
              style={{
                background: '#0f172a',
                color: serviceTerm === '6month' ? '#fbbf24' : serviceTerm === '3month' ? '#38bdf8' : '#c084fc',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <option value="1month">1개월 (속성 진단)</option>
              <option value="3month">3개월 (학기 집중 관리)</option>
              <option value="6month">6개월 (수시 올인원 풀케어)</option>
            </select>
          </div>
          <a
            href={`${SUPREMA_LAB_URL}/diagnosis/step1`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b1a1a 0%, #b91c1c 100%)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(139,26,26,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={14} />
            <span>나의 입시멘토 진단 열기</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </header>
      {studentData?.id && <StudentActivities key={studentData.id} studentId={studentData.id}/>}

      {activeView === 'analysis' && (
        <div className="detail-grid">
          {/* Left panel */}
          <section className="scan-section glass-panel">
            <div className="sub-tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                className={`sub-tab-btn ${activeTab === 'input' ? 'active' : ''}`}
                onClick={() => setActiveTab('input')}
                style={{
                  background: activeTab === 'input' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 정보 입력 및 스캔
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
                style={{
                  background: activeTab === 'history' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <History size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 분석 이력 ({history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').length})</button>
            </div>

            {activeTab === 'input' ? (
              <>
                <div className="section-title"><ClipboardList size={20} /><h3>학생 학업 정보 기입</h3></div>

                <div className="info-form">
                  <div className="form-group-inline">
                    <label>희망 전공 (진로)</label>
                    <input type="text" value={hopeMajor} onChange={e => setHopeMajor(e.target.value)} placeholder="예: 컴퓨터공학, 경영학" />
                  </div>
                  <div className="form-group-inline">
                    <label>내신 등급 (국영수과사)</label>
                    <input type="text" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="예: 국1 영2 수2 과1" />
                  </div>
                  <div className="form-group-inline">
                    <label>비교과 활동 요약</label>
                    <input type="text" value={activities} onChange={e => setActivities(e.target.value)} placeholder="예: 수학동아리 기장, 발명대회 수상" />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '2rem' }}><FileText size={20} /><h3>학생부 내용 (PDF/직접 입력)</h3></div>
                <div className="upload-box">
                  <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isPdfLoading}>
                    {isPdfLoading ? <RefreshCw className="spin" size={16} /> : <Upload size={16} />}
                    <span>{isPdfLoading ? 'AI PDF 텍스트 추출 중...' : '학생부 PDF 업로드 (AI 텍스트 스캔)'}</span>
                  </button>
                  <span className="upload-hint">NEIS 학생부 PDF 파일을 업로드하면 AI(Gemini)가 텍스트를 정밀하게 추출합니다.</span>
                </div>

                <textarea
                  className="student-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="추출된 텍스트가 이곳에 나타납니다. 직접 복사/붙여넣기도 가능합니다."
                />

                <div className="actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn-primary full-width" onClick={runAnalysis} disabled={isScanning} style={{ padding: '1rem', fontSize: '1rem' }}>
                    {isScanning ? <RefreshCw className="spin" size={20} /> : <FileSearch size={20} />}
                    <span>{isScanning ? 'AI 종합 분석 중...' : '학생부 기반 종합 분석 실행'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="analysis-history-list-container">
                <div className="section-title"><History size={18} /><h3>분석 저장 이력</h3></div>
                <div className="history-list">
                  {history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').map((h) => (
                    <div key={h.id} className="history-item" onClick={() => { setResult(h.content as Analysis); setActiveTab('input'); }}>
                      <span className="date">{new Date(h.created).toLocaleString()}</span>
                      <p className="preview">{(h.content?.summary || '요약 없음').slice(0, 70)}...</p>
                      <ChevronRight size={16} />
                    </div>
                  ))}
                  {history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').length === 0 && (
                    <div className="empty-msg">저장된 분석 결과가 없습니다.</div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right panel */}
          <section className="report-section glass-panel">
            <div className="section-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} /><h3>분석 결과 및 키워드 추출</h3></div>
              <div className="action-buttons">
                {result && <button className="icon-action-btn" onClick={printResult} title="출력"><Printer size={18} /></button>}
                {result && <button className="icon-action-btn" onClick={saveAnalysis} disabled={isSaving} title="저장"><Save size={18} /></button>}
              </div>
            </div>

            {result ? (
              <div className="report-content">
                {/* Keywords Section */}
                <div className="keywords-container">
                  <div className="keywords-box ai-keywords">
                    <h4><Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }}/>추출된 핵심 키워드 (최대 3개)</h4>
                    <div className="keyword-tags">
                      {result.studentKeywords?.map((kw, i) => (
                        <span key={i} className="k-tag ai-tag">{kw}</span>
                      ))}
                      {(!result.studentKeywords || result.studentKeywords.length === 0) && <span className="k-tag empty">추출된 키워드 없음</span>}
                    </div>
                  </div>

                  <div className="keywords-box manual-keywords">
                    <h4>사용자 추가 키워드 (직접 입력)</h4>
                    <div className="keyword-inputs">
                      {[0, 1, 2].map(idx => (
                        <input
                          key={idx}
                          type="text"
                          value={userKeywords[idx]}
                          onChange={(e) => {
                            const newK = [...userKeywords];
                            newK[idx] = e.target.value;
                            setUserKeywords(newK);
                          }}
                          placeholder={`추가 키워드 ${idx+1}`}
                          className="k-input"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="exploration-action">
                  <button className="btn-primary highlight-btn full-width" onClick={handleGoToExploration}>
                    <Send size={18} /> 위 키워드들로 탐구활동 주제 제안 받기
                  </button>
                </div>

                <hr className="report-divider" />

                <div className="summary-box">
                  <h4>종합 요약</h4>
                  <p>{result.summary}</p>
                </div>

                <div className="kpi-grid">
                  <div className="kpi-card"><BarChart3 size={16} /><span>기록 수치 평균</span><strong>{avg ?? '—'}</strong></div>
                  <div className="kpi-card"><Target size={16} /><span>강점 수</span><strong>{result.strengths.length}</strong></div>
                  <div className="kpi-card"><Target size={16} /><span>보완 수</span><strong>{result.improvements.length}</strong></div>
                </div>

                <div className="report-card">
                  <h4>교과 분석</h4>
                  <table>
                    <thead><tr><th>과목</th><th>점수</th><th>코멘트</th></tr></thead>
                    <tbody>
                      {result.gradeAnalysis.map((g, i) => <tr key={i}><td>{g.subject}</td><td>{g.score ?? '—'}</td><td>{g.comment}</td></tr>)}
                    </tbody>
                  </table>
                </div>

                <div className="two-col">
                  <div className="report-card"><h4>강점</h4><ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                  <div className="report-card"><h4>보완점</h4><ul>{result.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                </div>

                <div className="report-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} className="accent-color" />
                      추천 세특 문장 초안
                    </h4>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      onClick={() => {
                        if (!result.finalRecordDraft) return;
                        navigator.clipboard.writeText(result.finalRecordDraft);
                        alert('세특 문장 초안이 클립보드에 복사되었습니다.');
                      }}
                    >
                      <Sparkles size={12} /> 문장 복사
                    </button>
                  </div>
                  <p style={{ lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {result.finalRecordDraft}
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-msg">분석 결과가 없습니다. 왼쪽에서 정보를 입력하고 분석을 실행해 주세요.</div>
            )}
          </section>
        </div>
      )}

      {activeView === 'planner' && (
        <div className="planner-view-container glass-panel" style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
          <div className="planner-header-bar" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><ClipboardList size={20} className="accent-color" /> {studentData?.name} 학생의 밀착 학습/탐구 계획표</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>주차별 과제를 세우고, 학생이 완료하면 탐구 결과물 문서를 업로드해 보관합니다.</span>
          </div>

          <div className="planner-content-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
            {/* Task Checklist Panel */}
            <div className="planner-tasks-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Task Adder Bar */}
              <div className="task-adder-bar" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <select
                  value={newTaskWeek}
                  onChange={(e) => setNewTaskWeek(Number(e.target.value))}
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                >
                  <option value={1}>1주차</option>
                  <option value={2}>2주차</option>
                  <option value={3}>3주차</option>
                  <option value={4}>4주차</option>
                </select>
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="이 학생의 이번 주 새로운 탐구/학습 과제를 입력해 주세요..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}
                />
                <button onClick={handleAddTask} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px' }}>
                  <Plus size={16} /> 추가
                </button>
              </div>

              {/* Weekly Groups */}
              <div className="weekly-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4].map((week) => {
                  const weekTasks = plannerTasks.filter(t => t.week === week);
                  return (
                    <div key={week} className="week-group-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                      <div className="week-group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <Calendar size={16} className="accent-color" />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{week}주차 과제</h4>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>{weekTasks.length}개</span>
                      </div>

                      <div className="week-tasks" style={{ display: 'grid', gap: '8px' }}>
                        {weekTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`planner-task-item ${task.done ? 'done' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              opacity: task.done ? 0.8 : 1
                            }}
                          >
                            <div className="task-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <button
                                className="checkbox-btn"
                                onClick={() => handleToggleTask(task.id)}
                                style={{ background: 'transparent', border: 'none', color: task.done ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
                              >
                                {task.done ? <CheckCircle2 size={20} /> : <Square size={20} />}
                              </button>
                              <span className="task-text" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : '#fff', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</span>
                            </div>

                            <div className="task-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                              {task.done && (
                                <div className="file-attachment-section">
                                  {task.fileName ? (
                                    <div
                                      className="attached-file-badge"
                                      title="결과물 파일"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(14,165,233,0.15)',
                                        border: '1px solid rgba(14,165,233,0.3)',
                                        color: '#38bdf8',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <FileText size={12} />
                                      <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.fileName}</span>
                                      <button
                                        onClick={() => {
                                          const updated = plannerTasks.map(t => t.id === task.id ? { ...t, fileName: undefined } : t);
                                          setPlannerTasks(updated);
                                          savePlannerData(updated, feedbackNote);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                        title="파일 삭제"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="file-upload-trigger">
                                      <label
                                        htmlFor={`file-input-${task.id}`}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          background: 'rgba(255,255,255,0.05)',
                                          border: '1px solid rgba(255,255,255,0.1)',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Upload size={12} /> 결과물 첨부
                                      </label>
                                      <input
                                        type="file"
                                        id={`file-input-${task.id}`}
                                        onChange={(e) => handleFileChangeForTask(e, task.id)}
                                        style={{ display: 'none' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                                className="delete-task-btn"
                                title="과제 삭제"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {weekTasks.length === 0 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>이 주차에 배정된 과제가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consultant Feedback Note Panel */}
            <div className="planner-feedback-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="feedback-card glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <ClipboardList size={18} className="accent-color" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>컨설턴트 밀착 지도 피드백</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>학생의 성취 상황을 모니터링하고 지도 내용을 기록해 학부모 상담 시 활용하세요.</p>
                <textarea
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="이번 달 학생의 과제 수행 상태, 집중 보완이 필요한 영역을 작성해 주세요..."
                  style={{ width: '100%', minHeight: '180px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', resize: 'vertical' }}
                />
                <button
                  onClick={() => savePlannerData(plannerTasks, feedbackNote).then(() => alert('피드백이 저장되었습니다.'))}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} /> 피드백 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'recommendation' && (
        <div className="recommendation-view-container glass-panel" style={{ padding: '24px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Banner & AI Matching Center */}
          <div className="rec-header-banner" style={{ background: 'linear-gradient(135deg, rgba(139,26,26,0.2) 0%, rgba(30,41,59,0.6) 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ background: '#8b1a1a', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>대치 수프리마 AI 매칭 센터</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>학생: <strong style={{ color: '#fff' }}>{studentData?.name}</strong></span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={22} color="#f59e0b" />
                  교과 연계 심화탐구 · 필수독서 · 세특 추천 & 학생 매칭
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.86rem', color: '#cbd5e1' }}>
                  탑재된 과학 AI, 사회 AI, AI 데이터 분석 프롬프트 도구를 활용하여 학생 맞춤형 [탐구주제 + 연계독서 + 3단계 세특]을 정교하게 매칭하고 밀착 플래너와 연동합니다.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsGuideBookModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  <BookOpen size={15} /> 📄 사회·과학 AI 활용 가이드북
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleOpenMatchModal('science')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <FlaskConical size={15} /> 🧪 과학 AI 탐구 매칭
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleOpenMatchModal('social')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', border: 'none', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <Scale size={15} /> ⚖️ 사회 AI 탐구 매칭
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleOpenMatchModal('ai')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', border: 'none', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <Sparkles size={15} /> 🤖 AI 데이터분석 매칭
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleOpenMatchModal('general', 'form')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Plus size={15} /> 직접 추천 등록
                </button>
                {recommendations.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPrintRec('all')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                  >
                    <Printer size={15} /> 추천서 인쇄 (A4)
                  </button>
                )}
              </div>
            </div>

            {/* Embedded AI Tools Fast Launch Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', fontSize: '0.8rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>탑재된 AI 도구 열기:</span>
              <a
                href="https://jinhak.esteacher.kr/sciencetam.html"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                🧪 과학 교과 탐구 가이드 ↗
              </a>
              <a
                href="https://jinhak.esteacher.kr/socialtam.html"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                ⚖️ 사회 교과 탐구 가이드 ↗
              </a>
              <a
                href="https://jinhak.esteacher.kr/ai_prompt.html"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(139,92,246,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                🤖 AI 데이터 분석·프롬프트 ↗
              </a>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'exploration' }))}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
              >
                💡 주제탐구활동 생성기로 이동
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-secondary ${activeRecCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveRecCategory('all')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: activeRecCategory === 'all' ? '#1e293b' : 'rgba(255,255,255,0.04)', color: activeRecCategory === 'all' ? '#fff' : '#94a3b8', border: activeRecCategory === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)' }}
              >
                전체 ({recommendations.length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeRecCategory === 'science' ? 'active' : ''}`}
                onClick={() => setActiveRecCategory('science')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: activeRecCategory === 'science' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)', color: activeRecCategory === 'science' ? '#34d399' : '#94a3b8', border: activeRecCategory === 'science' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)' }}
              >
                🧪 과학 AI ({recommendations.filter(r => r.category === 'science').length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeRecCategory === 'social' ? 'active' : ''}`}
                onClick={() => setActiveRecCategory('social')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: activeRecCategory === 'social' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)', color: activeRecCategory === 'social' ? '#fbbf24' : '#94a3b8', border: activeRecCategory === 'social' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)' }}
              >
                ⚖️ 사회 AI ({recommendations.filter(r => r.category === 'social').length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeRecCategory === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveRecCategory('ai')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: activeRecCategory === 'ai' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: activeRecCategory === 'ai' ? '#c084fc' : '#94a3b8', border: activeRecCategory === 'ai' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)' }}
              >
                🤖 AI 데이터분석 ({recommendations.filter(r => r.category === 'ai').length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${activeRecCategory === 'general' ? 'active' : ''}`}
                onClick={() => setActiveRecCategory('general')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: activeRecCategory === 'general' ? '#1e293b' : 'rgba(255,255,255,0.04)', color: activeRecCategory === 'general' ? '#60a5fa' : '#94a3b8', border: activeRecCategory === 'general' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)' }}
              >
                📚 일반 ({recommendations.filter(r => r.category === 'general').length})
              </button>
            </div>

            {recommendations.length === 0 && (
              <button
                type="button"
                className="btn-primary"
                onClick={loadPreloadedExamples}
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#334155' }}
              >
                <Sparkles size={14} /> 대치 수프리마 추천 예시 3종 불러오기
              </button>
            )}
          </div>

          {/* Recommendations List Grid */}
          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Lightbulb size={40} style={{ color: '#64748b', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#cbd5e1' }}>등록된 탐구·독서·세특 추천이 없습니다</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: '#64748b' }}>
                상단의 [🧪 과학 AI 탐구 매칭], [⚖️ 사회 AI 탐구 매칭], [🤖 AI 데이터분석 매칭] 버튼을 누르면 정교화된 프로세스를 통해 학생 맞춤형 탐구를 즉시 배정할 수 있습니다.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={loadPreloadedExamples}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> 대치 수프리마 추천 예시 3종 즉시 불러오기
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '16px' }}>
              {recommendations
                .filter(r => activeRecCategory === 'all' || r.category === activeRecCategory)
                .map((rec) => {
                  const categoryBadgeColor = rec.category === 'science' ? '#10b981' : rec.category === 'social' ? '#f59e0b' : rec.category === 'ai' ? '#8b5cf6' : '#3b82f6';
                  const categoryBadgeLabel = rec.category === 'science' ? '🧪 과학 AI 탐구' : rec.category === 'social' ? '⚖️ 사회 AI 탐구' : rec.category === 'ai' ? '🤖 AI 데이터분석' : '📚 일반 교과';

                  return (
                    <article key={rec.id} className="rec-card glass-panel" style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '18px', background: 'rgba(15,23,42,0.6)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ background: `${categoryBadgeColor}22`, color: categoryBadgeColor, border: `1px solid ${categoryBadgeColor}66`, fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                              {categoryBadgeLabel}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px' }}>
                              {rec.subject}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{rec.createdAt}</span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.4 }}>
                            {rec.topicTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecommendation(rec.id)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Section 1: 필수 연계 독서 */}
                      <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BookOpen size={14} /> STEP 1. 필수 연계 독서 · 핵심 개념
                          </span>
                        </div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                          📖 {rec.bookTitle} {rec.bookAuthor && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({rec.bookAuthor}{rec.bookPublisher ? ` / ${rec.bookPublisher}` : ''})</span>}
                        </p>
                        {rec.coreConcept && (
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            {rec.coreConcept}
                          </p>
                        )}
                      </div>

                      {/* Section 2: 추천 세특 문장 */}
                      <div style={{ background: 'rgba(215,194,165,0.08)', border: '1px solid rgba(215,194,165,0.25)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={14} /> STEP 2. 추천 세특 기재 문장 (생기부용)
                          </span>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              navigator.clipboard.writeText(rec.setukDraft);
                              alert('세특 문장이 복사되었습니다.');
                            }}
                            style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Copy size={12} /> 복사
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {rec.setukDraft}
                        </p>
                      </div>

                      {/* Section 3: 컨설턴트 코칭 노트 */}
                      {rec.consultantTip && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                            📋 컨설턴트 지도 조언 (변인통제 / 통계 / 실행 팁):
                          </span>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            {rec.consultantTip}
                          </p>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleTransferRecToPlanner(rec, 1)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calendar size={14} /> 밀착 플래너 과제로 전송
                        </button>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setEditingRecId(rec.id);
                              setRecCategory(rec.category);
                              setRecSubject(rec.subject);
                              setRecTopicTitle(rec.topicTitle);
                              setRecBookTitle(rec.bookTitle);
                              setRecBookAuthor(rec.bookAuthor || '');
                              setRecBookPublisher(rec.bookPublisher || '');
                              setRecCoreConcept(rec.coreConcept);
                              setRecSetukDraft(rec.setukDraft);
                              setRecConsultantTip(rec.consultantTip || '');
                              setModalTab('form');
                              setIsRecModalOpen(true);
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setPrintRec(rec)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            <Printer size={13} /> 인쇄
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Recommendation Create / Edit / Matching Modal */}
      {isRecModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                  {recCategory === 'science' ? '🧪 과학 교과 AI 심화탐구 매칭' : recCategory === 'social' ? '⚖️ 사회 교과 AI 심화탐구 매칭' : recCategory === 'ai' ? '🤖 AI 데이터 분석·프롬프트 매칭' : '📚 일반 탐구 추천'}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#fff' }}>
                  {studentData?.name} 학생 맞춤 심화탐구 매칭
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setModalTab('templates')}
                style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: modalTab === 'templates' ? '2px solid #38bdf8' : 'none', color: modalTab === 'templates' ? '#38bdf8' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                1. 수프리마 엄선 템플릿 선택
              </button>
              <button
                type="button"
                onClick={() => setModalTab('guide')}
                style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: modalTab === 'guide' ? '2px solid #38bdf8' : 'none', color: modalTab === 'guide' ? '#38bdf8' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                2. 4단계 정교화 프로세스 가이드
              </button>
              <button
                type="button"
                onClick={() => setModalTab('form')}
                style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: modalTab === 'form' ? '2px solid #38bdf8' : 'none', color: modalTab === 'form' ? '#38bdf8' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                3. 상세 내용 편집 및 매칭 확인
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {/* Tab 1: Templates */}
              {modalTab === 'templates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
                    원하시는 템플릿의 <strong>[이 템플릿 적용하기]</strong>를 클릭하면 [3. 상세 내용 편집] 폼으로 자동 채워지며, 학생에게 즉시 매칭할 수 있습니다.
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {CURATED_MATCHING_TEMPLATES
                      .filter(t => t.category === recCategory || recCategory === 'general')
                      .map(t => (
                        <div key={t.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>{t.subject}</span>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleApplyTemplate(t)}
                              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                            >
                              이 템플릿 적용하기
                            </button>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>{t.topicTitle}</h4>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <strong style={{ color: '#38bdf8' }}>📖 연계 도서:</strong> {t.bookTitle} ({t.bookAuthor})
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                            {t.setukDraft}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Guide */}
              {modalTab === 'guide' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {recCategory !== 'general' && INQUIRY_METHODOLOGY_GUIDES[recCategory] && (
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#38bdf8' }}>
                        {INQUIRY_METHODOLOGY_GUIDES[recCategory].title}
                      </h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.86rem', color: '#94a3b8' }}>
                        {INQUIRY_METHODOLOGY_GUIDES[recCategory].subtitle}
                      </p>

                      <div style={{ display: 'grid', gap: '12px' }}>
                        {INQUIRY_METHODOLOGY_GUIDES[recCategory].steps.map(step => (
                          <div key={step.stepNum} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ background: '#8b1a1a', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                STEP {step.stepNum}
                              </span>
                              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{step.name}</strong>
                            </div>
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.84rem', color: '#cbd5e1' }}>{step.description}</p>
                            <div style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                              🔍 체크포인트: {step.checkPoint}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(56,189,248,0.06)', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.2)' }}>
                        <strong style={{ color: '#38bdf8', fontSize: '0.86rem', display: 'block', marginBottom: '6px' }}>
                          💡 컨설턴트 정교화 코칭 팁:
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                          {INQUIRY_METHODOLOGY_GUIDES[recCategory].consultingTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setModalTab('templates')}
                    style={{ marginTop: '10px' }}
                  >
                    확인 후 템플릿 선택으로 이동
                  </button>
                </div>
              )}

              {/* Tab 3: Form */}
              {modalTab === 'form' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>카테고리</label>
                      <select
                        value={recCategory}
                        onChange={(e) => setRecCategory(e.target.value as any)}
                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem' }}
                      >
                        <option value="science">🧪 과학 AI 탐구</option>
                        <option value="social">⚖️ 사회 AI 탐구</option>
                        <option value="ai">🤖 AI 데이터분석</option>
                        <option value="general">📚 일반 교과</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>교과목</label>
                      <input
                        type="text"
                        value={recSubject}
                        onChange={(e) => setRecSubject(e.target.value)}
                        placeholder="예: 물리학Ⅰ / 화학 / 사회·문화 / 정보"
                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>탐구 주제명 (연구 질문 / 가설)</label>
                    <input
                      type="text"
                      value={recTopicTitle}
                      onChange={(e) => setRecTopicTitle(e.target.value)}
                      placeholder="예: 미세플라스틱의 생체 축적 메커니즘과 친환경 바이오필터 소재의 흡착 효율 비교 실험"
                      style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>필수 연계 도서명</label>
                      <input
                        type="text"
                        value={recBookTitle}
                        onChange={(e) => setRecBookTitle(e.target.value)}
                        placeholder="예: 침묵의 봄"
                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>저자</label>
                      <input
                        type="text"
                        value={recBookAuthor}
                        onChange={(e) => setRecBookAuthor(e.target.value)}
                        placeholder="예: 레이첼 카슨"
                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>출판사</label>
                      <input
                        type="text"
                        value={recBookPublisher}
                        onChange={(e) => setRecBookPublisher(e.target.value)}
                        placeholder="예: 에코리브르"
                        style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>도서 핵심 개념 및 탐구 동기 요약</label>
                    <textarea
                      value={recCoreConcept}
                      onChange={(e) => setRecCoreConcept(e.target.value)}
                      rows={2}
                      placeholder="도서의 핵심 이론 및 탐구 질문으로 확장된 배경을 간략히 요약합니다."
                      style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      추천 세특 기재 문장 (생기부 3단계: 동기 → 심화탐구/실험/데이터 → 성장 역량)
                    </label>
                    <textarea
                      value={recSetukDraft}
                      onChange={(e) => setRecSetukDraft(e.target.value)}
                      rows={4}
                      placeholder="[교과목]으로 시작하여 학생의 주도적 탐구 과정과 역량이 드러나는 완성형 문장 작성"
                      style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '0.88rem', lineHeight: 1.5 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>컨설턴트 코칭 조언 (변인 통제, 오차 분석, KOSIS 통계, 코딩 조언 등)</label>
                    <input
                      type="text"
                      value={recConsultantTip}
                      onChange={(e) => setRecConsultantTip(e.target.value)}
                      placeholder="학생 지도 시 유의할 실험 조건이나 데이터 출처 조언"
                      style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <input
                      type="checkbox"
                      id="autoPlanner"
                      checked={autoAddPlanner}
                      onChange={(e) => setAutoAddPlanner(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="autoPlanner" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', flex: 1 }}>
                      이 추천을 학생의 밀착 플래너 과제로 자동 연동 등록
                    </label>
                    {autoAddPlanner && (
                      <select
                        value={autoAddPlannerWeek}
                        onChange={(e) => setAutoAddPlannerWeek(Number(e.target.value))}
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', padding: '3px 8px', fontSize: '0.8rem' }}
                      >
                        <option value={1}>1주차</option>
                        <option value={2}>2주차</option>
                        <option value={3}>3주차</option>
                        <option value={4}>4주차</option>
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsRecModalOpen(false)}
                style={{ padding: '8px 16px' }}
              >
                취소
              </button>
              {modalTab !== 'form' ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setModalTab('form')}
                  style={{ padding: '8px 20px' }}
                >
                  입력 폼으로 이동
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveRecommendation}
                  disabled={isSavingRec}
                  style={{ padding: '8px 24px', fontWeight: 700 }}
                >
                  {isSavingRec ? '매칭 저장 중...' : '학생에게 즉시 매칭 & 추천 저장'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConsultantGuideModal isOpen={isGuideBookModalOpen} onClose={() => setIsGuideBookModalOpen(false)} />

      {/* Print Recommendation Modal (A4) */}
      {printRec && (
        <div className="print-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, overflow: 'auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '210mm', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>추천서 인쇄 미리보기</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <Printer size={15} /> 즉시 인쇄 (A4)
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrintRec(null)}
                style={{ padding: '8px 16px' }}
              >
                닫기
              </button>
            </div>
          </div>

          <div className="print-page A4 print-section" style={{ width: '210mm', minHeight: '297mm', background: '#fff', color: '#1e293b', padding: '20mm', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            <div className="print-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '2px', borderBottom: '2px double #1e293b', paddingBottom: '8px', color: '#0f172a' }}>
                심화탐구 · 독서 · 세특 맞춤 추천서
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8', fontSize: '0.88rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '7px', border: '1px solid #94a3b8', textAlign: 'center' }}>학생명</td>
                    <td style={{ width: '35%', padding: '7px', border: '1px solid #94a3b8' }}>{studentData?.name}</td>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '7px', border: '1px solid #94a3b8', textAlign: 'center' }}>컨설팅 과정</td>
                    <td style={{ width: '35%', padding: '7px', border: '1px solid #94a3b8' }}>
                      {serviceTerm === '6month' ? '6개월 (수시 올인원 풀케어)' : serviceTerm === '3month' ? '3개월 (학기 집중 관리)' : '1개월 (속성 진단)'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '7px', border: '1px solid #94a3b8', textAlign: 'center' }}>희망 진로</td>
                    <td style={{ padding: '7px', border: '1px solid #94a3b8' }}>{hopeMajor || '종합 학문'}</td>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '7px', border: '1px solid #94a3b8', textAlign: 'center' }}>발행일자</td>
                    <td style={{ padding: '7px', border: '1px solid #94a3b8' }}>{new Date().toISOString().slice(0, 10)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(printRec === 'all' ? recommendations : [printRec]).map((item, index) => (
                <div key={item.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8b1a1a' }}>
                      추천 {index + 1}. [{item.subject}] ({item.category === 'science' ? '과학AI' : item.category === 'social' ? '사회AI' : item.category === 'ai' ? 'AI데이터분석' : '교과탐구'})
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{item.topicTitle}</span>
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '0.84rem' }}>
                    <strong style={{ color: '#0369a1' }}>📖 필수 연계 독서:</strong> {item.bookTitle} ({item.bookAuthor || '공통'}{item.bookPublisher ? ` / ${item.bookPublisher}` : ''})
                    {item.coreConcept && <p style={{ margin: '3px 0 0 0', color: '#475569', fontSize: '0.8rem' }}>- 핵심 요약: {item.coreConcept}</p>}
                  </div>
                  <div style={{ marginBottom: '6px', fontSize: '0.84rem' }}>
                    <strong style={{ color: '#b45309' }}>💡 추천 세특 문장:</strong>
                    <p style={{ margin: '3px 0 0 0', color: '#1e293b', fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.setukDraft}</p>
                  </div>
                  {item.consultantTip && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <strong>📋 지도 조언:</strong> {item.consultantTip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="print-footer" style={{ borderTop: '2px solid #0f172a', paddingTop: '15px', marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#475569' }}>위와 같이 학생의 학업 성장 및 학생부 종합전형을 위한 맞춤 심화탐구를 추천합니다.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>대치수프리마 입시&코칭센터</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px red solid', color: 'red', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: '0.8rem', transform: 'rotate(-10deg)', userSelect: 'none' }}>인</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <p style={{ margin: '2px 0' }}>대표 : 이기욱 대표컨설턴트 | 메일 : suprimalab@gmail.com | 연락처 : 010-2370-1077(문자전송)</p>
                <p style={{ margin: '2px 0' }}>소재지 : 서울시 강남구 테헤란로 326 B1F</p>
                <p style={{ margin: '2px 0' }}>네이버 밴드 : band.us/@suprima | 블로그 : blog.naver.com/gouniv_hifive | 인스타그램 : suprima_ipsicreator</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'evaluation' && (
        <div className="eval-view-container" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px', flex: 1, minHeight: 0, padding: '20px', overflow: 'hidden' }}>
          {/* Left panel: list of evaluations */}
          <div className="eval-sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', overflow: 'hidden' }}>
            <div className="sidebar-header-action" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>성장 평가서 목록</h3>
              <button
                onClick={handleStartCreateEval}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} /> 신규 작성
              </button>
            </div>

            <div className="eval-list" style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '10px', alignContent: 'start' }}>
              {evaluationHistory.map((ev) => (
                <div
                  key={ev.id}
                  className={`eval-list-item ${selectedEval?.id === ev.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEval(ev);
                    setIsEditingEval(false);
                  }}
                  style={{
                    background: selectedEval?.id === ev.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
                    border: selectedEval?.id === ev.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="eval-badge-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span
                      className={`eval-badge ${ev.content.evalType}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        background: ev.content.evalType === 'semester' ? 'rgba(244,63,94,0.15)' : ev.content.evalType === 'quarterly' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                        color: ev.content.evalType === 'semester' ? '#f43f5e' : ev.content.evalType === 'quarterly' ? '#38bdf8' : '#10b981'
                      }}
                    >
                      {ev.content.evalType === 'monthly' && '월말평가'}
                      {ev.content.evalType === 'quarterly' && '분기평가'}
                      {ev.content.evalType === 'semester' && '학기평가'}
                    </span>
                    <span className="eval-date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.content.date}</span>
                  </div>
                  <h4 className="eval-item-title" style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.content.title}</h4>
                  <p className="eval-item-semester" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.content.semester || '학기 미정'}</p>
                </div>
              ))}
              {evaluationHistory.length === 0 && (
                <div className="empty-sidebar-msg" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={24} style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.2)' }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>등록된 성장 평가서가 없습니다.<br />우측 상단의 '신규 작성' 버튼을 눌러보세요.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: editor or display card */}
          <div className="eval-main-panel glass-panel" style={{ height: '100%', padding: '20px', overflowY: 'auto' }}>
            {isEditingEval ? (
              <div className="eval-editor-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{selectedEval ? '성장 평가서 수정' : '새로운 성장 평가서 작성'}</h4>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>평가 구분</label>
                    <select
                      value={evalType}
                      onChange={(e) => setEvalType(e.target.value as any)}
                      style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                    >
                      <option value="monthly">월말평가서</option>
                      <option value="quarterly">분기평가서</option>
                      <option value="semester">학기평가서</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>기준 학년/학기</label>
                    <input
                      type="text"
                      value={evalSemester}
                      onChange={(e) => setEvalSemester(e.target.value)}
                      placeholder="예: 2학년 1학기"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>평가서 제목</label>
                  <input
                    type="text"
                    value={evalTitle}
                    onChange={(e) => setEvalTitle(e.target.value)}
                    placeholder="예: 5월 교과학습 및 탐구 보고서 평가서"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>1. 학습 태도 및 수업 참여도 분석</label>
                  <textarea
                    value={evalAttitude}
                    onChange={(e) => setEvalAttitude(e.target.value)}
                    placeholder="학생이 수업 중 보인 적극성, 경청하는 자세, 과제 성실성 등을 구체적인 관찰 내용 중심으로 작성해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>2. 주제 탐구 및 과제 수행 역량 평가</label>
                  <textarea
                    value={evalInquiry}
                    onChange={(e) => setEvalInquiry(e.target.value)}
                    placeholder="제안받은 탐구활동을 주도적으로 구현했는지, 데이터나 도서를 적절히 활용해 완성도 높은 결과물을 도출했는지 기술해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>3. 향후 학습 및 입시 코칭 중점 계획</label>
                  <textarea
                    value={evalPlan}
                    onChange={(e) => setEvalPlan(e.target.value)}
                    placeholder="다음 평가 시기까지 성적을 개선하거나 세특 심화 주제를 발전시키기 위한 액션 플랜을 제시해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    onClick={handleSaveEvaluation}
                    disabled={isSavingEval}
                    className="btn-primary"
                    style={{ padding: '10px 20px' }}
                  >
                    {isSavingEval ? '저장 중...' : '평가서 저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingEval(false);
                      if (!selectedEval && evaluationHistory.length > 0) {
                        setSelectedEval(evaluationHistory[0]);
                      }
                    }}
                    className="btn-secondary"
                    style={{ padding: '10px 20px' }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : selectedEval ? (
              <div className="eval-detail-view">
                <div className="detail-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="title-section">
                    <span
                      className={`eval-badge ${selectedEval.content.evalType}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        display: 'inline-block',
                        marginBottom: '6px',
                        background: selectedEval.content.evalType === 'semester' ? 'rgba(244,63,94,0.15)' : selectedEval.content.evalType === 'quarterly' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                        color: selectedEval.content.evalType === 'semester' ? '#f43f5e' : selectedEval.content.evalType === 'quarterly' ? '#38bdf8' : '#10b981'
                      }}
                    >
                      {selectedEval.content.evalType === 'monthly' && '월말평가'}
                      {selectedEval.content.evalType === 'quarterly' && '분기평가'}
                      {selectedEval.content.evalType === 'semester' && '학기평가'}
                    </span>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#fff' }}>{selectedEval.content.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>기준 학기: {selectedEval.content.semester} · 작성일자: {selectedEval.content.date}</p>
                  </div>

                  <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPrintEval(selectedEval)}
                      className="icon-action-btn"
                      title="PDF 출력/인쇄"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => handleStartEditEval(selectedEval)}
                      className="icon-action-btn"
                      title="수정"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvaluation(selectedEval.id)}
                      className="icon-action-btn"
                      style={{ color: 'var(--text-muted)' }}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <hr className="report-divider" style={{ margin: '16px 0' }} />

                <div className="eval-content-sections" style={{ display: 'grid', gap: '16px' }}>
                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>1</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>학습 태도 및 수업 참여도 분석</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.attitude || '작성된 내용이 없습니다.'}</p>
                  </div>

                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>2</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>주제 탐구 및 과제 수행 역량 평가</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.inquiry || '작성된 내용이 없습니다.'}</p>
                  </div>

                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>3</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>향후 학습 및 입시 코칭 중점 계획</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.plan || '작성된 내용이 없습니다.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-main-msg" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.15)' }} />
                <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 6px 0' }}>성장 평가서를 관리합니다</h3>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>왼쪽 목록에서 평가서를 선택하거나 '신규 작성'을 눌러 새로운 보고서를 발행해 보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Preview Overlay */}
      {printEval && (
        <div className="print-preview-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="print-control-box" style={{
            width: '100%',
            maxWidth: '800px',
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>인쇄 미리보기</span>
            <div className="print-controls" style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.88rem' }}
              >
                <Printer size={14} /> 즉시 인쇄 (A4)
              </button>
              <button
                className="btn-secondary"
                onClick={() => setPrintEval(null)}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                닫기
              </button>
            </div>
          </div>

          <div className="print-page A4 print-section" style={{
            width: '210mm',
            minHeight: '297mm',
            background: '#fff',
            color: '#1e293b',
            padding: '20mm',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'sans-serif'
          }}>
            <div className="print-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 20px 0', letterSpacing: '2px', borderBottom: '2px double #1e293b', paddingBottom: '10px', color: '#0f172a' }}>학습 및 탐구 성장 평가서</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8', fontSize: '0.9rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>학생명</td>
                    <td style={{ width: '35%', padding: '8px', border: '1px solid #94a3b8' }}>{studentData?.name}</td>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>평가 구분</td>
                    <td style={{ width: '35%', padding: '8px', border: '1px solid #94a3b8' }}>
                      {printEval.content.evalType === 'monthly' && '월말평가 보고서'}
                      {printEval.content.evalType === 'quarterly' && '분기평가 보고서'}
                      {printEval.content.evalType === 'semester' && '학기평가 보고서'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>대상 학기</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{printEval.content.semester || '해당 없음'}</td>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>발행일자</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{printEval.content.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-body" style={{ flex: 1, display: 'grid', gap: '20px', alignContent: 'start', margin: '10px 0' }}>
              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>1. 학습 태도 및 참여도 분석</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.attitude || '기록 없음'}</p>
              </div>

              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>2. 주제 탐구 및 수행 역량 평가</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.inquiry || '기록 없음'}</p>
              </div>

              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>3. 향후 학습 및 입시 코칭 중점 계획</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.plan || '기록 없음'}</p>
              </div>
            </div>

            <div className="print-footer" style={{ borderTop: '2px solid #0f172a', paddingTop: '15px', marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#475569' }}>위와 같이 학생의 학업 성장을 진단하고 향후 계획을 전달합니다.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>대치수프리마 입시&코칭센터</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px red solid', color: 'red', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: '0.8rem', transform: 'rotate(-10deg)', userSelect: 'none' }}>인</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <p style={{ margin: '2px 0' }}>대표 : 이기욱 대표컨설턴트 | 메일 : suprimalab@gmail.com | 연락처 : 010-2370-1077(문자전송)</p>
                <p style={{ margin: '2px 0' }}>소재지 : 서울시 강남구 테헤란로 326 B1F</p>
                <p style={{ margin: '2px 0' }}>네이버 밴드 : band.us/@suprima | 블로그 : blog.naver.com/gouniv_hifive | 인스타그램 : suprima_ipsicreator</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
