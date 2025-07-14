-- Create predefined programming language subjects
INSERT INTO public.subjects (name, created_by) 
SELECT name, null 
FROM (VALUES 
  ('Python'),
  ('JavaScript'),
  ('SQL'),
  ('Java'),
  ('C++'),
  ('HTML/CSS'),
  ('React'),
  ('Node.js'),
  ('Data Structures'),
  ('Algorithms')
) AS subjects(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects s WHERE s.name = subjects.name
);

-- Update the existing SELECT policy to allow viewing all subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;

CREATE POLICY "Users can view all subjects" 
ON public.subjects 
FOR SELECT 
USING (true);