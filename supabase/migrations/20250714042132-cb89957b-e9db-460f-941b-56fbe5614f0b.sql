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
ON CONFLICT DO NOTHING;

-- Update RLS policies to allow public subjects (created_by = null)
DROP POLICY "Users can view their own subjects" ON public.subjects;

CREATE POLICY "Users can view all subjects" 
ON public.subjects 
FOR SELECT 
USING (true);

-- Keep other policies for user-created subjects only
CREATE POLICY "Users can create their own subjects" 
ON public.subjects 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own subjects" 
ON public.subjects 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own subjects" 
ON public.subjects 
FOR DELETE 
USING (auth.uid() = created_by);