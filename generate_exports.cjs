const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = require('docx');

const outDir = path.join(process.cwd(), 'docs', 'exports');
fs.mkdirSync(outDir, { recursive: true });

const reportDate = new Date().toLocaleString('ko-KR');

const studentAnalysis = {
  input: '수학 심화탐구 활동, 과학 프로젝트 발표, 팀 협업 우수',
  summary: '학생은 입력된 활동에서 탐구 지속성과 문제해결력이 확인되며, 발표 과정에서 의사소통 역량이 안정적으로 나타남.',
  rows: [
    ['국어', '87', '핵심 내용 요약 능력 양호'],
    ['수학', '91', '문제해결 과정의 논리성 우수'],
    ['과학', '90', '가설-검증 흐름이 명확함'],
  ],
  strengths: ['자기주도 학습', '탐구 지속성', '협업 태도'],
  improvements: ['활동별 정량 지표 보강', '과목 간 연계 문장 강화'],
  finalDraft: '학생은 교과 기반 탐구활동에서 주도적으로 문제를 정의하고 근거를 구조화하여 전공 적합성을 보여주는 성과를 도출함.'
};

const explore = {
  studentKeywords: ['데이터 분석', '발표'],
  userKeywords: ['AI 교육', '사회문제 해결'],
  suggestions: [
    {
      title: '데이터 분석 기반 AI 교육 격차 탐구',
      reading: '「팩트풀니스」',
      reason: '데이터 해석과 오판 교정 프레임 학습',
      steps: ['지역 교육 데이터 수집', '격차 원인 가설 설정', 'AI 보조학습 모델 제안'],
      output: '탐구 보고서 1p + 발표자료 6장'
    },
    {
      title: '발표 역량을 활용한 사회문제 해결 캠페인 설계',
      reading: '「정의란 무엇인가」',
      reason: '사회문제 접근의 윤리적 관점 정립',
      steps: ['문제 선정', '이해관계자 맵 작성', '해결안 발표 및 피드백 반영'],
      output: '실행계획서 + 세특 문장 초안'
    }
  ]
};

async function createDocx() {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['과목', '점수', '코멘트'].map((t) => new TableCell({ children: [new Paragraph({ text: t })] })) }),
      ...studentAnalysis.rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph({ text: c })] })) })),
    ],
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: '수프리마 플랫폼 결과 리포트', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `생성일시: ${reportDate}` }),
        new Paragraph({ text: '' }),

        new Paragraph({ text: '1) 학생부입력 - 분석 - 결과', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `입력 원문: ${studentAnalysis.input}` }),
        new Paragraph({ text: `종합 요약: ${studentAnalysis.summary}` }),
        table,
        new Paragraph({ text: `강점: ${studentAnalysis.strengths.join(', ')}` }),
        new Paragraph({ text: `보완점: ${studentAnalysis.improvements.join(', ')}` }),
        new Paragraph({ text: `세특 문장 초안: ${studentAnalysis.finalDraft}` }),

        new Paragraph({ text: '' }),
        new Paragraph({ text: '2) 키워드 기반 탐구활동 제안(독서 포함)', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `학생부 키워드: ${explore.studentKeywords.join(', ')}` }),
        new Paragraph({ text: `사용자 키워드: ${explore.userKeywords.join(', ')}` }),
        ...explore.suggestions.flatMap((s, i) => [
          new Paragraph({ text: `${i + 1}. ${s.title}`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `추천 독서: ${s.reading}` }),
          new Paragraph({ text: `독서 반영 이유: ${s.reason}` }),
          new Paragraph({ text: `탐구 단계: ${s.steps.join(' → ')}` }),
          new Paragraph({ text: `산출물: ${s.output}` }),
        ]),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(outDir, 'suprima_result_report.docx'), buffer);
}

function createHtml() {
  const html = `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>Suprima Report</title>
  <style>
  body{font-family:'Noto Sans KR',sans-serif;padding:32px;line-height:1.6;color:#111}
  h1,h2,h3{margin:0 0 8px}
  .section{margin-top:24px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border:1px solid #ccc;padding:8px;text-align:left}
  .meta{color:#555;font-size:13px}
  </style></head><body>
  <h1>수프리마 플랫폼 결과 리포트</h1>
  <p class="meta">생성일시: ${reportDate}</p>
  <div class="section"><h2>1) 학생부입력 - 분석 - 결과</h2>
  <p><b>입력 원문:</b> ${studentAnalysis.input}</p>
  <p><b>종합 요약:</b> ${studentAnalysis.summary}</p>
  <table><thead><tr><th>과목</th><th>점수</th><th>코멘트</th></tr></thead><tbody>
  ${studentAnalysis.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
  </tbody></table>
  <p><b>강점:</b> ${studentAnalysis.strengths.join(', ')}</p>
  <p><b>보완점:</b> ${studentAnalysis.improvements.join(', ')}</p>
  <p><b>세특 문장 초안:</b> ${studentAnalysis.finalDraft}</p>
  </div>
  <div class="section"><h2>2) 키워드 기반 탐구활동 제안(독서 포함)</h2>
  <p><b>학생부 키워드:</b> ${explore.studentKeywords.join(', ')}</p>
  <p><b>사용자 키워드:</b> ${explore.userKeywords.join(', ')}</p>
  ${explore.suggestions.map((s,i)=>`<h3>${i+1}. ${s.title}</h3><p><b>추천 독서:</b> ${s.reading}</p><p><b>독서 반영 이유:</b> ${s.reason}</p><p><b>탐구 단계:</b> ${s.steps.join(' → ')}</p><p><b>산출물:</b> ${s.output}</p>`).join('')}
  </div></body></html>`;

  fs.writeFileSync(path.join(outDir, 'suprima_result_report.html'), html, 'utf8');
}

async function createPdf() {
  const htmlPath = 'file:///' + path.join(outDir, 'suprima_result_report.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(htmlPath, { waitUntil: 'networkidle2' });
  await page.pdf({ path: path.join(outDir, 'suprima_result_report.pdf'), format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' } });
  await browser.close();
}

(async () => {
  await createDocx();
  createHtml();
  await createPdf();
  console.log('EXPORT_DONE');
})();
