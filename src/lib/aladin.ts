// Aladin OpenAPI ended in October 2026; no API key is shipped to the browser.
export function aladinSearchUrl(title: string) { return 'https://www.aladin.co.kr/search/wsearchresult.aspx?KeyWord=' + encodeURIComponent(title) + '&SearchTarget=Book'; }
export async function searchBooks(_query: string): Promise<any[]> { throw new Error('도서 API는 현재 연결되어 있지 않습니다. 도서명으로 직접 확인해 주세요.'); }
export async function getBookDetail(_itemId: string): Promise<any> { throw new Error('도서 상세 API는 현재 제공되지 않습니다.'); }
