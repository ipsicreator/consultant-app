import PocketBase from 'pocketbase';

// PocketBase 서버 주소 (환경 변수 사용)
const configuredUrl = import.meta.env.VITE_POCKETBASE_URL?.trim();
export const pocketbaseConfigured = Boolean(configuredUrl) || import.meta.env.DEV;
const pb = new PocketBase(configuredUrl || (import.meta.env.DEV ? 'http://127.0.0.1:8090' : '/'));

export { pb };
