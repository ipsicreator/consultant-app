import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello");
    console.log(`Success with ${modelName}`);
  } catch (error) {
    console.log(`Failed with ${modelName}:`, error.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-pro");
  await testModel("gemini-pro");
  await testModel("gemini-1.0-pro");
}
run();
