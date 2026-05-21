const fs = require('fs');
const path = require('path');

let TTB_KEY = process.env.VITE_ALADIN_TTB_KEY;
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_ALADIN_TTB_KEY\s*=\s*(.*)/);
    if (match && match[1]) {
      TTB_KEY = match[1].trim();
    }
  }
} catch (e) {
  // Ignore error
}

if (!TTB_KEY) {
  console.error("❌ VITE_ALADIN_TTB_KEY not found in process.env or .env.local file.");
  process.exit(1);
}

async function run() {
  const query = '수학';
  const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=3&start=1&SearchTarget=Book&output=js&Version=20131101`;

  try {
    console.log('Testing Aladin API Key...');
    const response = await fetch(url);
    const text = await response.text();
    const cleanJson = text.trim().replace(/;$/, "");
    const result = JSON.parse(cleanJson);
    
    if (result.item && result.item.length > 0) {
      console.log('Aladin API is working! Found books:');
      result.item.forEach((book, idx) => {
        console.log(`[${idx+1}] ${book.title} (Author: ${book.author})`);
      });
    } else {
      console.error('Aladin API returned no items. Response:', result);
    }
  } catch (error) {
    console.error('Aladin API test failed:', error.message || error);
  }
}

run();
