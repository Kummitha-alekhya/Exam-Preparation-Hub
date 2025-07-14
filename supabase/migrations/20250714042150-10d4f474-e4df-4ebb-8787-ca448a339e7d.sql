-- Create predefined programming language subjects
INSERT INTO public.subjects (name, created_by) VALUES
('Python', null),
('JavaScript', null),
('SQL', null),
('Java', null),
('C++', null),
('HTML/CSS', null),
('React', null),
('Node.js', null),
('Data Structures', null),
('Algorithms', null)
ON CONFLICT (name) DO NOTHING;

-- Update the existing SELECT policy to allow viewing all subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;

CREATE POLICY "Users can view all subjects" 
ON public.subjects 
FOR SELECT 
USING (true);