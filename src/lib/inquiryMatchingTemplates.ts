/**
 * 대치 수프리마 입시&코칭센터 - 과학·사회·AI 심화탐구 정교화 프로세스 및 매칭 템플릿
 */

export interface ConsultantRecommendation {
  id: string;
  category: 'science' | 'social' | 'ai' | 'general';
  subject: string;
  topicTitle: string;
  bookTitle: string;
  bookAuthor?: string;
  bookPublisher?: string;
  coreConcept: string;
  setukDraft: string;
  consultantTip?: string;
  performanceAssessment?: string; // 수행평가 내용 기입
  status?: 'recommended' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface InquiryMethodologyGuide {
  category: 'science' | 'social' | 'ai';
  title: string;
  subtitle: string;
  icon: string;
  steps: {
    stepNum: number;
    name: string;
    description: string;
    checkPoint: string;
  }[];
  consultingTips: string[];
}

export const INQUIRY_METHODOLOGY_GUIDES: Record<'science' | 'social' | 'ai', InquiryMethodologyGuide> = {
  science: {
    category: 'science',
    title: '과학 교과 AI 심화탐구 정교화 프로세스',
    subtitle: '단순 지식 나열을 지양하고, [가설-변인통제-정량실험-독서연계] 4단계를 구현합니다.',
    icon: '🧪',
    steps: [
      {
        stepNum: 1,
        name: '현상 관찰 및 과학적 의문 도출',
        description: '교과서 기본 개념(물·화·생·지, 통과)에서 출발하여 일상이나 첨단 기술의 문제 현상을 포착합니다.',
        checkPoint: '거창한 전공명보다 교과 개념과의 직접적 연결고리가 명확한가?'
      },
      {
        stepNum: 2,
        name: '가설 설정 및 변인 통제 설계',
        description: '조작 변인(독립 변인)과 종속 변인(측정값)을 구체화하고, 외생 변인의 통제 기준을 엄밀히 세웁니다.',
        checkPoint: '수치로 측정 가능한 종속 변인이 정의되어 있는가?'
      },
      {
        stepNum: 3,
        name: '필수 과학 독서 연계 및 원리 규명',
        description: '가설의 학문적 근거가 되는 과학 학술서/도서를 정독하고 핵심 이론(메커니즘)을 추출합니다.',
        checkPoint: '도서의 핵심 개념이 탐구의 논리적 디딤돌 역할을 하는가?'
      },
      {
        stepNum: 4,
        name: '정량적 실험/시뮬레이션 및 세특 문장 완성',
        description: '실험 데이터 또는 공개 데이터셋을 분석하여 가설을 검증하고, 성장형 3단계 세특 문장으로 정리합니다.',
        checkPoint: '동기 → 심화탐구(실험/측정 수치) → 학업적 성장 역량이 드러나는가?'
      }
    ],
    consultingTips: [
      '결과를 단정하지 말고 오차 요인(오차율 %) 및 후속 탐구 과제를 언급할 때 학종 평가관의 호평을 받습니다.',
      '수학적 모델링(미적분, 확률, 회귀분석) 또는 정보(파이썬 시뮬레이션)와의 융합을 권장합니다.'
    ]
  },
  social: {
    category: 'social',
    title: '사회 교과 AI 심화탐구 정교화 프로세스',
    subtitle: '단순 의견 주장을 배제하고, [쟁점발견-사상이론독서-통계실증-정책제안] 4단계를 구현합니다.',
    icon: '⚖️',
    steps: [
      {
        stepNum: 1,
        name: '사회적 쟁점 및 모순 포착',
        description: '통합사회, 사회·문화, 생활과 윤리, 정치와 법, 경제 교과 내 갈등 쟁점을 현실 문제와 연결합니다.',
        checkPoint: '찬반 또는 다각도의 이해관계가 충돌하는 실제 사회적 쟁점인가?'
      },
      {
        stepNum: 2,
        name: '인문·사회 이론 필수 도서 분석',
        description: '고전 사상가(롤스, 노직, 센 등)나 사회학/경제학 이론 도서를 통해 분석의 이론적 준거틀을 마련합니다.',
        checkPoint: '주관적 주장이 아닌 공인된 학문적 프레임을 적용했는가?'
      },
      {
        stepNum: 3,
        name: '공공 통계(KOSIS) 및 실증 데이터 교차 검증',
        description: '통계청 KOSIS, 공공데이터포털, 판례, 조례 데이터 등 객관적 실증 지표를 수집·가공합니다.',
        checkPoint: '데이터의 시계열 추세나 집단 간 격차가 수치로 명시되었는가?'
      },
      {
        stepNum: 4,
        name: '실천적 대안/정책 제안 및 세특 문장 완성',
        description: '현실 적용 가능한 법률·제도·정책적 개선안을 도출하고 3단계 세특 문장으로 기술합니다.',
        checkPoint: '사회적 기여 의지와 비판적 문제해결 역량이 세특 문장에 각인되었는가?'
      }
    ],
    consultingTips: [
      '단순 "캠페인을 벌였다" 식의 활동보다 법률안 개정 검토, 경제적 비용편익 분석 등 전문적 접근이 유리합니다.',
      '사회 지표 분석 시 GIS 지리정보나 파이썬 데이터 시각화를 연계하면 융합 역량이 극대화됩니다.'
    ]
  },
  ai: {
    category: 'ai',
    title: 'AI 데이터 분석·프롬프트 심화탐구 정교화 프로세스',
    subtitle: '단순 툴 사용을 넘어, [데이터정의-프롬프트파이프라인-알고리즘검증-윤리독서] 4단계를 구축합니다.',
    icon: '🤖',
    steps: [
      {
        stepNum: 1,
        name: '데이터 기반 문제 정의',
        description: '실생활 또는 특정 학문 도메인의 비효율을 해결하기 위한 데이터셋(정형/비정형)을 선정합니다.',
        checkPoint: '어떤 문제를 어떤 데이터로 해결하려 하는지 목표가 뚜렷한가?'
      },
      {
        stepNum: 2,
        name: '프롬프트 엔지니어링 및 파이프라인 설계',
        description: 'Few-shot, CoT, RAG 등 체계적인 프롬프트 구조와 파이썬/판다스 전처리 로직을 설계합니다.',
        checkPoint: '단순 질의응답이 아닌 구조화된 파이프라인(전처리-분석-검증)을 거쳤는가?'
      },
      {
        stepNum: 3,
        name: '컴퓨터과학 및 AI 윤리 필독서 연계',
        description: '알고리즘의 수학적 원리(선형대수, 최적화)와 AI 윤리·편향성 문제를 다룬 도서를 교차 분석합니다.',
        checkPoint: '기술적 구현뿐 아니라 사회적 영향과 윤리적 책임성을 함께 고찰했는가?'
      },
      {
        stepNum: 4,
        name: '성능 지표 측정 및 융합 세특 문장 완성',
        description: '정확도, 응답 일관성, F1-Score 등 정량 지표를 측정하고 전공 맞춤형 세특 문장으로 승화합니다.',
        checkPoint: '디지털 리터러시와 논리적 문제해결력이 구체적 알고리즘 명칭과 함께 드러나는가?'
      }
    ],
    consultingTips: [
      '프롬프트 작성 프레임워크(역할-맥락-지침-출력형식)를 세특 문장에 명시하면 자기주도성이 돋보입니다.',
      '수학(행렬, 확률과 통계) 교과목과 연계하여 알고리즘의 작동 원리를 수식으로 풀어내는 것을 추천합니다.'
    ]
  }
};

export const CURATED_MATCHING_TEMPLATES: ConsultantRecommendation[] = [
  // 과학 AI 템플릿
  {
    id: 'tmpl-sci-01',
    category: 'science',
    subject: '과학탐구실험 / 통합과학',
    topicTitle: '미세플라스틱의 생체 축적 메커니즘과 친환경 바이오필터 소재의 흡착 효율 비교 실험',
    bookTitle: '침묵의 봄',
    bookAuthor: '레이첼 카슨',
    bookPublisher: '에코리브르',
    coreConcept: '화학 물질의 먹이사슬 내 생체 농축 위험성을 경고한 고전을 바탕으로, 현대 해양 생태계 미세플라스틱의 흡착 및 여과 메커니즘을 규명함.',
    setukDraft: '[과학탐구실험] 생태계 내 미세플라스틱의 농축 문제에 문제의식을 갖고 도서 \'침묵의 봄\'을 정독하며 환경 생태학적 탐구를 심화함. 친환경 키토산 및 활성탄 기반 바이오필터의 미세플라스틱 흡착률을 온도와 pH 조건별로 통제 변인을 설정하여 정량 비교함. 실험 결과 키토산 복합 필터가 최대 94.2%의 흡착 효율을 보임을 데이터로 도출하고, 친환경 지속가능 소재 개발에 대한 학문적 탐구 역량을 탁월하게 드러냄.',
    consultantTip: '단순 환경오염 경각심 보고서가 되지 않도록, 독립변인(pH 5~9, 수온 15~35℃)에 따른 흡착 속도 그래프와 오차 분석(반복 3회)을 필수 첨부할 것.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  {
    id: 'tmpl-sci-02',
    category: 'science',
    subject: '물리학Ⅰ / 화학',
    topicTitle: '전고체 배터리 고체 전해질의 이온 전도도 향상을 위한 결정 격자 결함 모델링',
    bookTitle: '배터리 전쟁',
    bookAuthor: '루카시 베드나르스키',
    bookPublisher: '미래엔',
    coreConcept: '글로벌 배터리 산업의 기술 패권과 차세대 리튬 이온 전지의 물리화학적 한계를 탐구하고, 고체 전해질(황화물계)의 이온 이동 원리를 분석함.',
    setukDraft: '[물리학Ⅰ·화학 융합] 차세대 전고체 배터리의 안정성과 계면 저항 극복 방안에 주목하여 도서 \'배터리 전쟁\'을 통해 에너지 기술 패러다임을 분석함. 황화물계 고체 전해질 내부의 리튬 이온 전도 메커니즘을 결정 격자 결함 모델로 수식화하고, 온도 변화에 따른 아레니우스 활성화 에너지를 수학적으로 모델링함. 계면 임피던스 저감을 위한 표면 코팅 설계를 이론적으로 제안하여 물리학과 재료공학을 융합하는 뛰어난 역량을 보임.',
    consultantTip: '물리학의 전자기학(옴의 법칙, 임피던스)과 화학의 화학 반응 속도론(활성화 에너지)을 연립하여 해석하도록 유도할 것.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  {
    id: 'tmpl-sci-03',
    category: 'science',
    subject: '생명과학Ⅰ / 화학',
    topicTitle: 'mRNA 백신 전달체로서의 지질 나노입자(LNP) 구조적 안정성 및 세포 내 흡수 메커니즘 분석',
    bookTitle: '생명의 암호를 풀다',
    bookAuthor: '월터 아이작슨',
    bookPublisher: '21세기북스',
    coreConcept: '유전자 가위와 바이오 의학의 혁신을 다룬 도서를 바탕으로, 외가닥 mRNA가 체내에서 분해되지 않고 세포막을 통과하는 이온화 지질의 생화학적 구조를 규명함.',
    setukDraft: '[생명과학Ⅰ] 분자생물학적 호기심으로 도서 \'생명의 암호를 풀다\'를 탐독한 후, mRNA 백신의 핵심 전달 기술인 지질 나노입자(LNP)의 작동 기전에 착안함. 체내 pH(혈액 7.4 vs 엔도솜 5.5) 변화에 따른 이온화 가능 지질의 전하 역전 현상을 세포막 투과율과 연계하여 심층 분석함. 유전자 치료제의 표적 전달 효율을 높이기 위한 지질 조성비 최적화 모델을 학술 논문 교차 검증을 통해 제시함.',
    consultantTip: '의예·약학·생명공학 지망생에게 강력 추천. 화학의 산염기 평형(pKa) 개념을 세포생물학 메커니즘과 연계하여 설명하는 것이 핵심 포인트.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  // 사회 AI 템플릿
  {
    id: 'tmpl-soc-01',
    category: 'social',
    subject: '정치와 법 / 경제',
    topicTitle: '플랫폼 노동자의 법적 지위와 사회보험 사각지대 해소를 위한 공공 정책 설계',
    bookTitle: '플랫폼 자본주의',
    bookAuthor: '닉 서르닉',
    bookPublisher: '경성대학교출판부',
    coreConcept: '데이터 중심 플랫폼 기업의 독점화와 긱 이코노미(Gig Economy) 노동 환경의 변화를 경제학적·사회학적으로 조망함.',
    setukDraft: '[정치와 법·경제 융합] 플랫폼 경제 확산에 따른 고용 구조의 구조적 변화를 탐색하고자 도서 \'플랫폼 자본주의\'를 정독함. 근로기준법상 전통적 근로자 개념과 특수형태근로종사자의 괴리를 법률 조항별로 분석하고, 고용보험 적용 데이터와 유럽연합(EU)의 플랫폼 노동 지침을 비교 검토함. 알고리즘 통제 수준에 따른 단계별 노동자성 인정 기준과 사회보험료 차등 분담 모델을 담은 모의 입법안을 완성도 높게 작성함.',
    consultantTip: '단순 감성적 노동 인권 주장을 지양하고, 법률 조항(근로기준법 제2조) 및 OECD 노동 통계 지표를 실증 근거로 제시할 것.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  {
    id: 'tmpl-soc-02',
    category: 'social',
    subject: '사회·문화 / 한국지리',
    topicTitle: '공공 데이터 기반 지방 소멸 위험 지역의 생활 인프라 격차와 거점 압축도시 모델 분석',
    bookTitle: '지방도시 살생부',
    bookAuthor: '마강래',
    bookPublisher: '개마고원',
    coreConcept: '인구 절벽과 수도권 집중 현상이 초래하는 지방 중소도시의 인프라 붕괴 위험을 도시계획 및 사회학적 관점에서 분석함.',
    setukDraft: '[사회·문화] 지역 불균형과 인구 감소 문제에 대한 문제의식으로 도서 \'지방도시 살생부\'를 읽고 심화 탐구를 기획함. 국가통계포털(KOSIS)의 시군구별 인구 이동률 및 고령화 지수를 기반으로 지역별 의료·교육 시설 접근성 데이터를 GIS 지도상에 시각화함. 대도시 분산 정책의 한계를 지적하고, 대중교통 거점을 중심으로 한 콤팩트 시티(Compact City) 재편 전략을 데이터 기반의 정책 보고서로 발표함.',
    consultantTip: '통계청 데이터(KOSIS) 다운로드 및 엑셀 상관관계 분석(인구소멸위험지수 vs 응급의료 접근성 r값 산출)을 반드시 보고서에 포함하도록 지도할 것.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  // AI 데이터분석 템플릿
  {
    id: 'tmpl-ai-01',
    category: 'ai',
    subject: '정보 / 인공지능 기초',
    topicTitle: '대규모 언어 모델(LLM)의 환각(Hallucination) 저감을 위한 검색 증강 생성(RAG) 파이프라인 구현',
    bookTitle: '인공지능의 시대가 온다',
    bookAuthor: '이수안',
    bookPublisher: '시대의창',
    coreConcept: '생성형 인공지능의 기술적 원리와 사회적 파급력을 분석하고, 신뢰성 있는 도메인 특화 지식 생성을 위한 엔지니어링 방법론을 고찰함.',
    setukDraft: '[정보] 생성형 AI 모델이 지닌 사실 왜곡(할루시네이션) 현상의 한계를 극복하고자 도서 \'인공지능의 시대가 온다\'를 바탕으로 기술적 원리를 탐구함. 고교 교과 교육과정 텍스트 문서를 벡터 임베딩한 후 코사인 유사도 기반의 벡터 DB 검색 파이프라인(RAG)을 파이썬으로 구현함. 질의응답 정확도와 응답 일관성을 정량적으로 비교 분석하여 답변 신뢰도를 31.8% 개선하는 의미 있는 소프트웨어 프로젝트를 완수함.',
    consultantTip: '컴퓨터공학·소프트웨어 지망생 필수 템플릿. 코사인 유사도 수식(선형대수학 벡터 내적)을 수식으로 직접 설명하면 평가관의 감탄을 자아냄.',
    status: 'recommended',
    createdAt: '2026-11-14'
  },
  {
    id: 'tmpl-ai-02',
    category: 'ai',
    subject: '확률과 통계 / 정보',
    topicTitle: '머신러닝 기반 지역별 아동 보육 수요 예측 모델 설계 및 복지 자원 최적 분배 알고리즘',
    bookTitle: '수학으로 생각하는 힘',
    bookAuthor: '키트 예이츠',
    bookPublisher: '웅진지식하우스',
    coreConcept: '수학적 통계 모델이 현실 세계의 보건, 복지, 일상 의사결정에 어떻게 적용되는지를 탐색하며 데이터 과학의 가치를 체득함.',
    setukDraft: '[확률과 통계·정보 융합] 실생활의 복지 정책 효율화에 관심을 품고 도서 \'수학으로 생각하는 힘\'을 읽으며 수학적 모델링의 실용성을 확인함. 공공데이터포털의 영유아 인구수, 맞벌이 비율, 국공립 어린이집 정원 데이터를 수집하여 다중 선형 회귀분석 및 랜덤포레스트 모델을 구축함. 예측 수요 대비 공급 부족 지역을 도출하고 공공 보육 자원의 우선 배분 알고리즘을 제안하는 탁월한 데이터 분석 역량을 과시함.',
    consultantTip: '결정계수(R²), 평균제곱오차(MSE) 지표를 모델 간 비교표로 정리하여 결과물에 수록할 것.',
    status: 'recommended',
    createdAt: '2026-11-14'
  }
];
