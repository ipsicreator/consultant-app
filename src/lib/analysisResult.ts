export type StudentAnalysis = { summary: string; gradeAnalysis: { subject: string; score: number | null; comment: string }[]; strengths: string[]; improvements: string[]; finalRecordDraft: string; studentKeywords: string[] };
export function studentAnalysis(value: unknown): StudentAnalysis {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('분석 결과 형식을 확인하지 못했습니다.');
  const row = value as Record<string, unknown>;
  if (typeof row.summary !== 'string') throw new Error('분석 요약이 없습니다. 다시 시도해 주세요.');
  const strings = (key: string) => Array.isArray(row[key]) ? (row[key] as unknown[]).filter((item): item is string => typeof item === 'string') : [];
  return { summary: row.summary, gradeAnalysis: Array.isArray(row.gradeAnalysis) ? row.gradeAnalysis.filter(item => item && typeof item === 'object' && typeof item.subject === 'string').map(item => ({ subject: item.subject, score: typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : null, comment: typeof item.comment === 'string' ? item.comment : '' })) : [], strengths: strings('strengths'), improvements: strings('improvements'), finalRecordDraft: typeof row.finalRecordDraft === 'string' ? row.finalRecordDraft : '', studentKeywords: strings('studentKeywords').slice(0, 3) };
}
export function evidenceAverage(rows: StudentAnalysis['gradeAnalysis']): number | null { const scores = rows.map(row => row.score).filter((value): value is number => typeof value === 'number' && Number.isFinite(value)); return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length * 100) / 100 : null; }
