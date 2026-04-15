const TTB_KEY = import.meta.env.VITE_ALADIN_TTB_KEY || "ttbchrisklee1714001"; // 알라딘 TTBKey (환경변수 또는 기본값)

/**
 * 도서 검색 API (ItemSearch)
 */
export async function searchBooks(query: string) {
  if (!TTB_KEY) throw new Error("알라딘 TTBKey가 설정되지 않았습니다.");
  
  // Vite Proxy (/ttb)를 사용하여 속도 및 CORS 해결
  const url = `/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=5&start=1&SearchTarget=Book&output=js&Version=20131101`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    // output=js는 콜백 형태가 아님. JSON 문자열만 파싱
    const cleanJson = text.trim().replace(/;$/, "");
    const result = JSON.parse(cleanJson);
    
    return result.item || [];
  } catch (error) {
    console.error("알라딘 검색 에러:", error);
    return [];
  }
}

/**
 * 도서 상세 조회 및 목차(TOC) 추출 (ItemLookUp)
 */
export async function getBookDetail(itemId: string) {
  if (!TTB_KEY) throw new Error("알라딘 TTBKey가 설정되지 않았습니다.");
  
  const url = `/ttb/api/ItemLookUp.aspx?ttbkey=${TTB_KEY}&itemId=${itemId}&itemIdType=ItemId&output=js&Version=20131101&OptArgs=Full,Toc`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    const cleanJson = text.trim().replace(/;$/, "");
    const result = JSON.parse(cleanJson);
    
    return result.item?.[0] || null;
  } catch (error) {
    console.error("알라딘 상세조회 에러:", error);
    return null;
  }
}
