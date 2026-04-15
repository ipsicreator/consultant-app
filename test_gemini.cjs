require('dotenv').config({ path: './.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test_gemini() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API KEY NOT FOUND IN .env.local");
    return;
  }
  
  console.log("Testing with API Key ends with:", apiKey.slice(-4));
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Fetching available models...");
    // @google/generative-ai SDK에서 모델 목록 가져오기
    // 0.24.x 버전 기준 방식
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels ? "v1" : "v1beta"; 
    // 실제로는 genAI 객체의 다른 메서드를 써야 함 (SDK 마다 다름)
    // 최신 SDK는 genAI.getGenerativeModel({ model: '...' }).model 를 쓰거나 함.
    // 하지만 404가 났으니 키 자체가 문제일 확률이 높음.
    
    // 재확인: 직접 fetch를 날려보자 (API KEY의 생존 여부 확인)
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
       console.error("API ERROR RESPONSE:", JSON.stringify(data.error, null, 2));
    } else {
       console.log("AVAILABLE MODELS:", data.models?.map(m => m.name).join(', '));
    }
  } catch (e) {
    console.error("FETCH FAILED:", e.message);
  }
}

test_gemini();
