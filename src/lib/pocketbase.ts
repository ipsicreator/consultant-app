import PocketBase from 'pocketbase';

// PocketBase 서버 주소 (환경 변수 사용)
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

export { pb };
