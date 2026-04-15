export interface GradeEntry {
  id: string;      // 고유 식별자
  semester: string; // 예: "1-1", "1-2"
  subject: string;  // 과목명
  category: string; // 공통, 일반, 진로 등
  credit: number;   // 단위수(학점)
  score: number;    // 성적(등급) 1~9 (또는 1~5)
}

export interface CalculationResult {
  totalAverage: string;
  majorAverage: string; // 국영수과 또는 국영수사
  totalCredits: number;
  curriculum: '2015' | '2022';
}

/**
 * 단위수와 등급을 바탕으로 내신 평점을 계산하는 핵심 엔진
 * 공식: Σ(단위수 × 등급) / Σ(단위수)
 */
export function calculateGPA(grades: GradeEntry[], curriculum: '2015' | '2022' = '2015'): CalculationResult {
  let totalPoints = 0;
  let totalCredits = 0;
  
  let majorPoints = 0;
  let majorCredits = 0;

  const majorKeywords = ['국어', '수학', '영어', '과학', '사회', '역사', '도덕'];

  grades.forEach(entry => {
    // 0 학점이나 0 등급 등 비정상 데이터 스킵
    if (!entry.credit || !entry.score || entry.credit <= 0 || entry.score <= 0) return;

    totalPoints += (entry.credit * entry.score);
    totalCredits += entry.credit;

    // 주요 교과 필터링 (과목명에 키워드가 포함될 경우)
    const isMajor = majorKeywords.some(kw => entry.subject.includes(kw));
    if (isMajor) {
      majorPoints += (entry.credit * entry.score);
      majorCredits += entry.credit;
    }
  });

  const totalAverage = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  const majorAverage = majorCredits > 0 ? (majorPoints / majorCredits).toFixed(2) : "0.00";

  return {
    totalAverage,
    majorAverage,
    totalCredits,
    curriculum
  };
}

/**
 * 성적 데이터를 과목군별(국영수과사)로 분류하여 방사형 차트용 데이터로 변환
 */
export function prepareChartData(grades: any[]) {
  if (!grades || grades.length === 0) return [];
  
  const categories = [
    { name: '국어', keywords: ['국어', '문학', '화법', '작문', '언어', '매체'] },
    { name: '영어', keywords: ['영어', '회화', '독해'] },
    { name: '수학', keywords: ['수학', '미적분', '확률', '통계', '기하'] },
    { name: '과학', keywords: ['과학', '물리', '화학', '생명', '지구'] },
    { name: '사회', keywords: ['사회', '역사', '도덕', '윤리', '지리', '정치', '경제'] }
  ];

  return categories.map(cat => {
    const matched = grades.filter(g => 
      g.score > 0 && cat.keywords.some(kw => g.subject.includes(kw))
    );
    
    const avgScore = matched.length > 0 
      ? matched.reduce((acc, curr) => acc + curr.score, 0) / matched.length 
      : 0;

    return {
      subject: cat.name,
      value: avgScore > 0 ? (10 - avgScore) : 0, // 1등급 -> 9점 (시각용)
      actualGrade: avgScore > 0 ? avgScore.toFixed(1) : '-'
    };
  });
}

/**
 * 성적 데이터를 학기별(1-1, 1-2 등)로 그룹화하여 꺾은선 그래프용 추이 데이터로 변환
 */
export function prepareTrendData(grades: any[]) {
  if (!grades || grades.length === 0) return [];

  // 학기별 그룹화
  const semesterMap: { [key: string]: { totalPoints: number; totalCredits: number } } = {};
  
  grades.forEach(g => {
    const sem = g.semester || '기타';
    if (!g.credit || !g.score || g.credit <= 0 || g.score <= 0) return;
    
    if (!semesterMap[sem]) {
      semesterMap[sem] = { totalPoints: 0, totalCredits: 0 };
    }
    semesterMap[sem].totalPoints += (g.credit * g.score);
    semesterMap[sem].totalCredits += g.credit;
  });

  // 학기 순서 정렬 (1-1, 1-2, 2-1, 2-2...)
  const sortedSemesters = Object.keys(semesterMap).sort((a, b) => {
    if (a === '기타') return 1;
    if (b === '기타') return -1;
    return a.localeCompare(b);
  });

  return sortedSemesters.map(sem => {
    const stats = semesterMap[sem];
    const avgScore = stats.totalCredits > 0 ? (stats.totalPoints / stats.totalCredits) : 0;
    return {
      semester: sem,
      // 시각화를 위해 반전: 1등급(최고) 가 위로 가게끔 (10 - 등급)
      chartValue: avgScore > 0 ? (10 - avgScore) : null,
      actualGrade: avgScore > 0 ? avgScore.toFixed(2) : '-'
    };
  });
}

/**
 * 학년별 누적 내신 및 주요 과목군별 정밀 분석 데이터 산출
 */
export function prepareDetailedStats(grades: any[]) {
  if (!grades || grades.length === 0) return null;

  const validGrades = grades.filter(g => g.credit > 0 && g.score > 0);

  // 1. 학년별 누적 (1학년, 1~2학년, 1~3학년)
  const getCumulative = (maxYear: number) => {
    let t = 0, c = 0;
    validGrades.forEach(g => {
      const year = parseInt(g.semester?.[0] || "1");
      if (year <= maxYear) {
        t += g.credit * g.score;
        c += g.credit;
      }
    });
    return c > 0 ? (t / c).toFixed(2) : "-";
  };

  // 2. 과목군별 산출
  const getGroupGPA = (keywords: string[]) => {
    let t = 0, c = 0;
    validGrades.forEach(g => {
      if (keywords.some(kw => g.subject.includes(kw))) {
        t += g.credit * g.score;
        c += g.credit;
      }
    });
    return c > 0 ? (t / c).toFixed(2) : "-";
  };

  return {
    cumulative: [
      { label: '1학년 전체', value: getCumulative(1) },
      { label: '1~2학년 합산', value: getCumulative(2) },
      { label: '1~3학년 합산', value: getCumulative(3) }
    ],
    groups: [
      { label: '국수영사과 (주요 5개)', value: getGroupGPA(['국어', '수학', '영어', '사회', '과학', '역사', '도덕']) },
      { label: '국영수 (기초 3개)', value: getGroupGPA(['국어', '영어', '수학']) },
      { label: '국영수사 (인문계열)', value: getGroupGPA(['국어', '영어', '수학', '사회', '역사', '도덕']) },
      { label: '국영수과 (자연계열)', value: getGroupGPA(['국어', '영어', '수학', '과학']) }
    ]
  };
}
