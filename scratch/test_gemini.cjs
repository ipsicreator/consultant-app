const { GoogleGenerativeAI } = require('@google/generative-ai');

const fs = require('fs');
const path = require('path');

// Read key from .env.local to avoid hardcoding it
let API_KEY = process.env.VITE_GEMINI_API_KEY;
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.*)/);
    if (match && match[1]) {
      API_KEY = match[1].trim();
    }
  }
} catch (e) {
  // Ignore error
}

if (!API_KEY) {
  console.error("❌ VITE_GEMINI_API_KEY not found in process.env or .env.local file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  try {
    console.log('Testing Gemini API key with gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi, respond in 5 words.');
    console.log('Response:', result.response.text().trim());
    console.log('Gemini API key is working perfectly!');
  } catch (error) {
    console.error('Gemini API test failed:', error.message || error);
  }
}

run();
