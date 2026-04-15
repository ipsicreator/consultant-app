-- 1. 학생 기본 정보 테이블
create table public.students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  school text,
  grade integer,
  target_university text,
  target_major text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 생기부 AI 분석 누적 보관함 (덮어쓰기가 아닌, 시간순으로 여러 개 보관)
create table public.pdf_analyses (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  analysis_summary text,
  grades jsonb, -- 과목별 성적 및 세특 배열
  activities jsonb, -- 자율/동아리/봉사 활동 배열
  consultant_opinion text, -- 컨설턴트 추가 분석 의견 (월간 보고서용)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 보안을 위한 권한 열기 (개발용 임시 오픈)
alter table public.students enable row level security;
alter table public.pdf_analyses enable row level security;
create policy "Allow all admins" on public.students for all using (true);
create policy "Allow all admins" on public.pdf_analyses for all using (true);
