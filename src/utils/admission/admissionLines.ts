export interface AdmissionTier {
  id: string;
  name: string;
  universities: string[];
  safeGpa: number;     // 안정 컷 (교과전형 기준)
  matchGpa: number;    // 적정 컷
  reachGpa: number;    // 상향(소신) 컷
  color: string;
}

export const ADMISSION_TIERS: AdmissionTier[] = [
  {
    id: "tier_s",
    name: "S그룹 (최상위)",
    universities: ["서울대", "연세대", "고려대", "의치한약수"],
    safeGpa: 1.15,
    matchGpa: 1.35,
    reachGpa: 1.60,
    color: "#6366f1" // indigo-500
  },
  {
    id: "tier_a",
    name: "A그룹 (상위)",
    universities: ["서강대", "성균관대", "한양대"],
    safeGpa: 1.45,
    matchGpa: 1.75,
    reachGpa: 2.10,
    color: "#3b82f6" // blue-500
  },
  {
    id: "tier_b",
    name: "B그룹 (중상위)",
    universities: ["중앙대", "경희대", "한국외대", "서울시립대", "이화여대"],
    safeGpa: 1.80,
    matchGpa: 2.10,
    reachGpa: 2.50,
    color: "#0ea5e9" // sky-500
  },
  {
    id: "tier_c",
    name: "C그룹 (중위)",
    universities: ["건국대", "동국대", "홍익대", "숙명여대"],
    safeGpa: 2.20,
    matchGpa: 2.50,
    reachGpa: 2.90,
    color: "#10b981" // emerald-500
  },
  {
    id: "tier_d",
    name: "D그룹 (중도)",
    universities: ["국민대", "숭실대", "세종대", "단국대"],
    safeGpa: 2.60,
    matchGpa: 2.90,
    reachGpa: 3.40,
    color: "#8b5cf6" // violet-500
  }
];

export type DiagnosisResult = '안정' | '적정' | '소신' | '상향' | '위험';

/**
 * 학생의 내신 점수와 목표 그룹을 바탕으로 합격 가능성을 진단합니다.
 * @param gpa 학생 내신 (낮을수록 좋음)
 * @param tier 목표 대학 그룹
 * @returns 진단 결과 문자열 및 색상
 */
export function diagnosePosition(gpa: number, tier: AdmissionTier): { status: DiagnosisResult; color: string; desc: string } {
  if (gpa <= tier.safeGpa) {
    return { status: '안정', color: '#16a34a', desc: '교과 성적만으로도 충분히 합격 안정권에 속합니다.' }; // green-600
  } else if (gpa <= tier.matchGpa) {
    return { status: '적정', color: '#2563eb', desc: '해당 대학 라인 지원 시 적정권입니다. 서류/면접 대비가 중요합니다.' }; // blue-600
  } else if (gpa <= tier.reachGpa) {
    return { status: '소신', color: '#d97706', desc: '교과 커트라인 대비 부족하지만, 학생부종합전형(세특 우수성)으로 역전을 노려볼 수 있습니다.' }; // amber-600
  } else if (gpa <= tier.reachGpa + 0.4) {
    return { status: '상향', color: '#ea580c', desc: '합격 확률이 낮습니다. 비교과 스펙이 최상위권이어야 학종으로 상향 지원이 가능합니다.' }; // orange-600
  } else {
    return { status: '위험', color: '#dc2626', desc: '현재 성적으로는 지원을 권장하지 않습니다. 목표 라인을 하향 조정하세요.' }; // red-600
  }
}

/**
 * 내신 텍스트(예: "국1 영2 수2 과1")에서 평균 내신을 대략적으로 추론합니다.
 */
export function parseGpaTextToNumber(gpaText: string): number | null {
  if (!gpaText) return null;
  // Try to find numbers 1-9 in the text
  const match = gpaText.match(/[1-9](?:\.[0-9]+)?/g);
  if (match && match.length > 0) {
    const sum = match.reduce((a, b) => a + parseFloat(b), 0);
    return sum / match.length;
  }
  return null;
}
