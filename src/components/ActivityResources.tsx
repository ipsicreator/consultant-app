export const ACTIVITY_RESOURCES = [
  { title: "과학탐구 가이드", href: "https://jinhak.esteacher.kr/sciencetam.html" },
  { title: "사회탐구 가이드", href: "https://jinhak.esteacher.kr/socialtam.html" },
  { title: "AI 데이터 분석·프롬프트", href: "https://jinhak.esteacher.kr/ai_prompt.html" },
] as const;
export default function ActivityResources() {
  return <nav aria-label="탐구·세특·독서 참고 도구" style={{marginBottom:20,padding:16,border:"1px solid #e8dfd3",borderRadius:16,background:"#fffaf4",color:"#50352a"}}>
    <p className="mb-3 text-sm font-bold text-[#50352a]">탐구·세특·독서 참고 도구</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>{ACTIVITY_RESOURCES.map(resource => <a key={resource.href} href={resource.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" style={{padding:"9px 14px",border:"1px solid #d9c8b3",borderRadius:10,background:"white",color:"#8b1a1a",fontWeight:700}}>{resource.title} ↗</a>)}</div>
  </nav>;
}
