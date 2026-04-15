
-- 합격자 탐구 우수 사례 라이브러리 (누계형)
create table public.exploration_library (
  id uuid default gen_random_uuid() primary key,
  book_title text,
  author text,
  inquiry_title text,
  inquiry_content text,
  category text,
  tags text[],
  source_type text, -- " excel\ or \pdf\
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 설정
alter table public.exploration_library enable row level security;
create policy \Allow all admins to manage library\ on public.exploration_library for all using (true);
