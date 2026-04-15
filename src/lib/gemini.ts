import { GoogleGenerativeAI } from "@google/generative-ai";

// 환경변수에서 키 가져오기
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// 원장님 계정 전용 차세대 고성능 모델 (Gemini 2.5 Flash) 적용
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * File 객체를 Gemini가 읽을 수 있는 base64 part로 변환
 */
export async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Token = (reader.result as string).split(',')[1];
      resolve(base64Token);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    },
  };
}

/**
 * PDF 파일을 전송하고 구조화된 분석 데이터를 받아오는 핵심 함수
 */
export async function analyzeStudentReportPDF(file: File, retryCount = 3) {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY가 서버 설정(.env.local)에 누락되었습니다. 설정을 확인해 주세요.");
  }

  try {
    const filePart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const prompt = `
      너는 대치동 최고의 입시 수석 컨설턴트야. 
      다음 제공되는 문서는 학생의 학교생활기록부(또는 성적, 활동 기록) 문서 파일이야. 
      이 문서를 꼼꼼하게 읽고, 다음 3가지 정보를 완벽한 **JSON 형식(문자열 아님)**으로만 출력해줘. JSON 외의 부가적인 인사말이나 설명은 절대 금지야.
      
      [JSON 구조 필수 형식]
      {
        "analysisSummary": "이 학생의 성적 변화 추이, 두드러진 과목, 현재 약점을 3~4줄로 전문가 관점에서 요약해줘.",
        "grades": [
           {
             "semester": "학기(예: 1-1, 2-2)", 
             "subject": "과목명", 
             "credit": "이수단위수(학점) (반드시 숫자로만 표기, 예: 3)", 
             "score": "등수/등급에서 등급숫자만 표기 (A/B/C 성취도일 경우 0으로 표기, 예: 2)", 
             "note": "이 과목의 세특 핵심 1줄 요약"
           }
        ],
        "activities": [
           {"title": "동아리 또는 창체 활동명", "detail": "활동 내용 핵심 요약"}
        ]
      }
    `;

    // API 호출
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, filePart] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("AI로부터 빈 응답이 돌아왔습니다.");

    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    try {
      return JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      console.error("JSON 파싱 에러. 원문:", text);
      throw new Error("AI가 유효하지 않은 데이터 형식을 반환했습니다. 잠시 후 다시 시도해 주세요.");
    }

  } catch (error: any) {
    // 503 오류나 과부하 오류 시 자동 재시도 로직 트리거
    const errorMsg = error?.message || String(error);
    const isOverloadError = errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("Too Many Requests");
    
    if (isOverloadError && retryCount > 0) {
      console.warn(`구글 서버 과부하 감지. 재시도 합니다... (남은 횟수: ${retryCount - 1})`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return analyzeStudentReportPDF(file, retryCount - 1);
    }
    
    console.error("Gemini 상세 에러:", error);
    
    let userFriendlyMsg = errorMsg;
    if (errorMsg.includes("API_KEY_INVALID")) {
      userFriendlyMsg = "API 키가 올바르지 않습니다. .env.local 설정을 확인해 주세요.";
    } else if (isOverloadError) {
      userFriendlyMsg = "현재 AI 서버 사용량이 많아 연결이 지연되고 있습니다. 5~10초 뒤 다시 시도해 주세요.";
    } else if (errorMsg.includes("Model not found") || errorMsg.includes("404")) {
      userFriendlyMsg = `모델 설정(${DEFAULT_MODEL})에 일시적인 접근 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.`;
    }
    
    throw new Error(userFriendlyMsg);
  }
}

/**
 * [탐구/수행평가] 브레인스토밍을 위한 AI 함수
 * 학생 프로필(기존 기록) + 도서명 + 외부 자료를 결합하여 탐구 주제 제안
 */
export async function generateExplorationProposal(studentContext: string, bookTitle: string, externalData: string) {
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const prompt = `
      너는 대치동 최고의 입시 수석 컨설턴트이자 창의적 탐구 설계 전문가야. 
      다음 정보를 바탕으로 이 학생에게 가장 도움이 될 **[심화 탐구 주제 3가지]**를 제안해줘.
      
      [기존 학생 정보]
      ${studentContext}
      
      [탐구 소스 1: 관련 도서]
      ${bookTitle}
      
      [탐구 소스 2: 외부 자료/데이터 요약]
      ${externalData}
      
      [제안서 필수 포함 내용]
      1. 탐구 주제 (호기심을 자극하는 제목)
      2. 탐구 동기 및 연결 고리 (기본 학생 기록과 이 도서/자료가 어떻게 연결되는지)
      3. 구체적인 탐구 활동 로직 (어떤 실험이나 조사를 해야 하는지)
      4. 예상 생기부 세특 기재 예시 (입학사정관이 전공 적합성을 느낄 수 있는 핵심 문구)
      
      완벽한 JSON 형식으로만 출력해줘.
      {
        "proposals": [
          {
            "title": "주제 제목",
            "motivation": "동기",
            "activities": ["활동1", "활동2"],
            "recordDraft": "세특 예시 문구"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (error) {
    console.error("탐구 제안 생성 에러:", error);
    throw new Error("탐구 주제 생성에 실패했습니다. 입력 내용을 확인해 주세요.");
  }
}

/**
 * [Phase 18] PDF 보고서에서 합격자 탐구 사례 추출 (AI 스캔)
 */
export async function extractCaseFromPDF(file: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // File to base64
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const prompt = `
      입시 합격생의 탐구 보고서 혹은 생기부 PDF 파일입니다.
      이 문서에서 다음 정보를 추출하여 정확한 JSON 형식으로 반환하세요.
      
      결과 형식:
      {
        "book_title": "가장 핵심적으로 언급된 도서명",
        "author": "저자명",
        "inquiry_title": "심화 탐구 주제 제목",
        "inquiry_content": "탐구 활동의 핵심 내용 요약 (300자 내외)",
        "category": "입시 계형 또는 교과목 (예: 의치한, 컴퓨터공학, 물리)",
        "tags": ["태그1", "태그2", "태그3"]
      }

      추출이 어렵다면 최대한 근접한 정보를 적어주세요.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}
