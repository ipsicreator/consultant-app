-- 이미 만들어진 students 테이블 필드 확장 (상태 및 학년 추가)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS enrollment_status text DEFAULT '미등록';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade text;

-- (선택) 만약 상태별로 필터링을 자주 한다면 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(enrollment_status);
