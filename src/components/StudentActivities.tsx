import { useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { SUPREMA_LAB_URL } from '../lib/lab';
import StaffActivityViewer from './StaffActivityViewer';
export default function StudentActivities({studentId}:{studentId:string}){
  const request=useCallback(async(url:string,init:RequestInit={})=>{
    const identity=pb.authStore.model?.id,token=pb.authStore.token;
    if(!pb.authStore.isValid||!identity||!token)throw new Error('학원 계정으로 다시 로그인해 주세요.');
    const response=await fetch(url,{...init,cache:'no-store',headers:{...Object.fromEntries(new Headers(init.headers).entries()),Authorization:'Bearer '+token}});
    const data=await response.json().catch(()=>null);
    if(pb.authStore.model?.id!==identity||!pb.authStore.isValid)throw new Error('로그인 계정이 변경되었습니다. 다시 확인해 주세요.');
    if(!response.ok)throw new Error(data?.error||'활동 기록을 확인하지 못했습니다.');
    return data;
  },[]);
  return <StaffActivityViewer key={studentId} studentId={studentId} endpoint={SUPREMA_LAB_URL+'/api/academy/activities'} request={request}/>;
}
