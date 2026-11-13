import { pdfPayload, requestLabAI } from './lab';
export async function fileToGenerativePart(file: File) { return { inlineData: await pdfPayload(file) }; }
export async function analyzeStudentReportPDF(file: File) { return requestLabAI('analyze-student-pdf', { file: await pdfPayload(file) }); }
export async function generateExplorationProposal(studentContext: string, bookTitle: string, externalData: string) { return requestLabAI('exploration-proposal', { studentContext, bookTitle, externalData }); }
export async function extractCaseFromPDF(file: File) { return requestLabAI('extract-case-pdf', { file: await pdfPayload(file) }); }
