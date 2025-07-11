import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MockTest {
  id: string;
  title: string;
  date_taken: string;
  created_at: string;
  subject_id: string;
  subjects: { name: string } | null;
  scores: Array<{
    score_percent: number;
    correct_answers: number;
    total_questions: number;
  }>;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  user_selected_option: number | null;
  explanation?: string;
}

interface Subject {
  id: string;
  name: string;
}

const MockTests = () => {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingTest, setTakingTest] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState<{
    score: number;
    correct: number;
    total: number;
  } | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadMockTests();
      loadSubjects();
    }
  }, [user]);

  const loadMockTests = async () => {
    try {
      const { data, error } = await supabase
        .from('mock_tests')
        .select('*, subjects(name), scores(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMockTests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load mock tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('created_by', user?.id);

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
    }
  };

  const createSampleTest = async () => {
    try {
      // Create a sample Math test
      let mathSubjectId = subjects.find(s => s.name.toLowerCase().includes('math'))?.id;
      
      if (!mathSubjectId) {
        const { data: newSubject, error: subjectError } = await supabase
          .from('subjects')
          .insert([{ name: 'Mathematics', created_by: user?.id }])
          .select()
          .single();

        if (subjectError) throw subjectError;
        mathSubjectId = newSubject.id;
        setSubjects([...subjects, newSubject]);
      }

      const { data: mockTest, error: testError } = await supabase
        .from('mock_tests')
        .insert([{
          title: 'Sample Mathematics Test',
          user_id: user?.id,
          subject_id: mathSubjectId,
          date_taken: new Date().toISOString()
        }])
        .select()
        .single();

      if (testError) throw testError;

      // Create sample questions
      const sampleQuestions = [
        {
          question_text: "What is 15 + 27?",
          options: ["42", "41", "43", "40"],
          correct_option: 0,
          explanation: "15 + 27 = 42"
        },
        {
          question_text: "What is the square root of 64?",
          options: ["6", "7", "8", "9"],
          correct_option: 2,
          explanation: "√64 = 8 because 8 × 8 = 64"
        },
        {
          question_text: "What is 12 × 8?",
          options: ["94", "95", "96", "97"],
          correct_option: 2,
          explanation: "12 × 8 = 96"
        },
        {
          question_text: "What is 144 ÷ 12?",
          options: ["11", "12", "13", "14"],
          correct_option: 1,
          explanation: "144 ÷ 12 = 12"
        },
        {
          question_text: "What is 25% of 80?",
          options: ["15", "20", "25", "30"],
          correct_option: 1,
          explanation: "25% of 80 = 0.25 × 80 = 20"
        }
      ];

      const questionsToInsert = sampleQuestions.map(q => ({
        ...q,
        mock_test_id: mockTest.id
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: "Sample test created! You can now take it.",
        variant: "default"
      });

      loadMockTests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create sample test",
        variant: "destructive"
      });
    }
  };

  const startTest = async (testId: string) => {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('mock_test_id', testId);

      if (error) throw error;

      setCurrentQuestions(questions || []);
      setTakingTest(testId);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTestCompleted(false);
      setTestResults(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start test",
        variant: "destructive"
      });
    }
  };

  const submitAnswer = (questionId: string, answerIndex: number) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answerIndex
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    try {
      // Update questions with user answers
      const updatePromises = currentQuestions.map(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined) {
          return supabase
            .from('questions')
            .update({ user_selected_option: userAnswer })
            .eq('id', question.id);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Calculate score
      const totalQuestions = currentQuestions.length;
      const correctAnswers = currentQuestions.reduce((count, question) => {
        const userAnswer = userAnswers[question.id];
        return userAnswer === question.correct_option ? count + 1 : count;
      }, 0);
      const scorePercent = (correctAnswers / totalQuestions) * 100;

      // Save score
      const { error: scoreError } = await supabase
        .from('scores')
        .insert([{
          mock_test_id: takingTest,
          user_id: user?.id,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          score_percent: scorePercent
        }]);

      if (scoreError) throw scoreError;

      setTestResults({
        score: scorePercent,
        correct: correctAnswers,
        total: totalQuestions
      });
      setTestCompleted(true);

      toast({
        title: "Test Completed!",
        description: `You scored ${scorePercent.toFixed(1)}% (${correctAnswers}/${totalQuestions})`,
        variant: "default"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit test",
        variant: "destructive"
      });
    }
  };

  const closeTest = () => {
    setTakingTest(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestCompleted(false);
    setTestResults(null);
    loadMockTests();
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-success text-success-foreground">Excellent</Badge>;
    if (score >= 60) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Test Taking Dialog
  if (takingTest) {
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

    if (testCompleted && testResults) {
      return (
        <Dialog open={true} onOpenChange={closeTest}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Test Completed! 🎉</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-foreground">{testResults.score.toFixed(1)}%</h3>
                  <p className="text-muted-foreground">
                    {testResults.correct} out of {testResults.total} correct
                  </p>
                </div>
                {getScoreBadge(testResults.score)}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Review Your Answers</h4>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {currentQuestions.map((question, index) => {
                    const userAnswer = userAnswers[question.id];
                    const isCorrect = userAnswer === question.correct_option;
                    
                    return (
                      <div key={question.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">Q{index + 1}: {question.question_text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your answer: {question.options[userAnswer]} 
                              {!isCorrect && (
                                <span className="text-success ml-2">
                                  (Correct: {question.options[question.correct_option]})
                                </span>
                              )}
                            </p>
                            {question.explanation && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button onClick={closeTest} className="w-full" variant="gradient">
                Close Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={true} onOpenChange={closeTest}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mock Test in Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {currentQuestions.length}</span>
                <span>{progress.toFixed(0)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{currentQuestion.question_text}</h3>
                
                <RadioGroup
                  value={userAnswers[currentQuestion.id]?.toString()}
                  onValueChange={(value) => submitAnswer(currentQuestion.id, parseInt(value))}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/30">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={closeTest}
                  >
                    Exit Test
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={userAnswers[currentQuestion.id] === undefined}
                    variant="gradient"
                  >
                    {currentQuestionIndex === currentQuestions.length - 1 ? 'Finish Test' : 'Next Question'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mock Tests</h1>
          <p className="text-muted-foreground">
            Practice with realistic exam simulations and track your progress
          </p>
        </div>
        
        <Button variant="gradient" onClick={createSampleTest} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Sample Test
        </Button>
      </div>

      {/* Mock Tests List */}
      {mockTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTests.map((test) => (
            <Card key={test.id} className="shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {test.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {test.subjects?.name}
                    </p>
                  </div>
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
                </div>
                
                {test.scores && test.scores.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Score:</span>
                      {getScoreBadge(test.scores[0].score_percent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {test.scores[0].correct_answers}/{test.scores[0].total_questions} correct
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>Not attempted yet</span>
                  </div>
                )}
                
                <Button
                  onClick={() => startTest(test.id)}
                  className="w-full"
                  variant={test.scores && test.scores.length > 0 ? "outline" : "gradient"}
                >
                  {test.scores && test.scores.length > 0 ? 'Retake Test' : 'Start Test'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No mock tests available</h3>
          <p className="text-muted-foreground mb-4">
            Create your first mock test to start practicing for your exams
          </p>
          <Button variant="gradient" onClick={createSampleTest}>
            <Plus className="w-4 h-4 mr-2" />
            Create Sample Test
          </Button>
        </div>
      )}
    </div>
  );
};

export default MockTests;