import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
  AlertCircle,
  Play,
  Code,
  Database,
  Cpu
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

const PROGRAMMING_TESTS = [
  {
    title: "Python Fundamentals",
    subject: "Python",
    icon: Code,
    color: "from-blue-500 to-blue-600",
    questions: [
      {
        question_text: "What will be the output of the following code?\n\nx = [1, 2, 3]\nprint(x[::-1])",
        options: ["[1, 2, 3]", "[3, 2, 1]", "[2, 1, 3]", "Error"],
        correct_option: 1,
        explanation: "List slicing with [::-1] reverses the list, so [1, 2, 3] becomes [3, 2, 1]."
      },
      {
        question_text: "Which of the following is the correct way to define a function in Python?",
        options: ["function myFunc():", "def myFunc():", "define myFunc():", "func myFunc():"],
        correct_option: 1,
        explanation: "Functions in Python are defined using the 'def' keyword."
      },
      {
        question_text: "What is the output of:\n\nfor i in range(3):\n    print(i)",
        options: ["1 2 3", "0 1 2", "1 2", "0 1 2 3"],
        correct_option: 1,
        explanation: "range(3) generates numbers from 0 to 2 (excluding 3)."
      },
      {
        question_text: "What data type is the result of: type(3.14)?",
        options: ["int", "float", "str", "double"],
        correct_option: 1,
        explanation: "3.14 is a floating-point number, so type() returns <class 'float'>."
      },
      {
        question_text: "Which method adds an element to the end of a list?",
        options: ["add()", "append()", "insert()", "extend()"],
        correct_option: 1,
        explanation: "The append() method adds a single element to the end of a list."
      }
    ]
  },
  {
    title: "SQL Essentials",
    subject: "SQL",
    icon: Database,
    color: "from-green-500 to-green-600",
    questions: [
      {
        question_text: "Which SQL clause is used to filter rows in a query?",
        options: ["ORDER BY", "GROUP BY", "WHERE", "HAVING"],
        correct_option: 2,
        explanation: "WHERE clause is used to filter rows based on specified conditions."
      },
      {
        question_text: "What does the following SQL query do?\n\nSELECT COUNT(*) FROM users WHERE age > 18;",
        options: [
          "Returns all users older than 18",
          "Returns the number of users older than 18", 
          "Returns the average age of users",
          "Returns users with age exactly 18"
        ],
        correct_option: 1,
        explanation: "COUNT(*) returns the number of rows that match the WHERE condition."
      },
      {
        question_text: "Which JOIN returns only matching records from both tables?",
        options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN"],
        correct_option: 2,
        explanation: "INNER JOIN returns only rows that have matching values in both tables."
      },
      {
        question_text: "What is the purpose of GROUP BY in SQL?",
        options: [
          "To sort the results",
          "To filter the results", 
          "To group rows with same values",
          "To join multiple tables"
        ],
        correct_option: 2,
        explanation: "GROUP BY groups rows that have the same values in specified columns."
      },
      {
        question_text: "Which SQL command is used to create a new table?",
        options: ["MAKE TABLE", "CREATE TABLE", "NEW TABLE", "ADD TABLE"],
        correct_option: 1,
        explanation: "CREATE TABLE is the standard SQL command to create a new table."
      }
    ]
  },
  {
    title: "Data Structures & Algorithms",
    subject: "Data Structures",
    icon: Cpu,
    color: "from-purple-500 to-purple-600",
    questions: [
      {
        question_text: "What is the time complexity of accessing an element in an array by index?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
        correct_option: 2,
        explanation: "Array access by index is O(1) - constant time operation."
      },
      {
        question_text: "Which data structure follows LIFO (Last In, First Out) principle?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correct_option: 1,
        explanation: "Stack follows LIFO principle - the last element added is the first one to be removed."
      },
      {
        question_text: "What is the best case time complexity of Quick Sort?",
        options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
        correct_option: 1,
        explanation: "Quick Sort has O(n log n) best and average case time complexity."
      },
      {
        question_text: "In a binary search tree, what is true about the left subtree?",
        options: [
          "All values are greater than root",
          "All values are less than root",
          "Values are randomly placed",
          "It's always empty"
        ],
        correct_option: 1,
        explanation: "In a BST, all values in the left subtree are less than the root value."
      },
      {
        question_text: "What happens when you try to dequeue from an empty queue?",
        options: [
          "Returns null",
          "Returns 0", 
          "Throws an exception/error",
          "Returns the last element"
        ],
        correct_option: 2,
        explanation: "Attempting to dequeue from an empty queue typically results in an underflow error."
      }
    ]
  }
];

const MockTests = () => {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");
  
  // Test taking state
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

  const createProgrammingTest = async (testTemplate: typeof PROGRAMMING_TESTS[0]) => {
    try {
      // Find or create subject
      let subjectId = subjects.find(s => s.name === testTemplate.subject)?.id;
      
      if (!subjectId) {
        const { data: newSubject, error: subjectError } = await supabase
          .from('subjects')
          .insert([{ name: testTemplate.subject, created_by: user?.id }])
          .select()
          .single();

        if (subjectError) throw subjectError;
        subjectId = newSubject.id;
        setSubjects([...subjects, newSubject]);
      }

      // Create mock test
      const { data: mockTest, error: testError } = await supabase
        .from('mock_tests')
        .insert([{
          title: testTemplate.title,
          user_id: user?.id,
          subject_id: subjectId,
          date_taken: new Date().toISOString()
        }])
        .select()
        .single();

      if (testError) throw testError;

      // Create questions
      const questionsToInsert = testTemplate.questions.map(q => ({
        ...q,
        mock_test_id: mockTest.id
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: `${testTemplate.title} test created!`,
        variant: "default"
      });

      loadMockTests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create ${testTemplate.title} test`,
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

  const CodeBlock = ({ code, language = "python" }: { code: string; language?: string }) => {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-border/50">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'hsl(var(--muted))',
            fontSize: '0.875rem'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  const renderQuestionText = (questionText: string) => {
    const parts = questionText.split('\n\n');
    if (parts.length > 1 && (parts[1].includes('=') || parts[1].includes('SELECT'))) {
      return (
        <div>
          <p className="mb-2">{parts[0]}</p>
          <CodeBlock 
            code={parts[1]} 
            language={parts[1].includes('SELECT') ? 'sql' : 'python'} 
          />
        </div>
      );
    }
    return <p>{questionText}</p>;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const submitTest = async () => {
    try {
      let correct = 0;
      const total = currentQuestions.length;

      // Calculate score
      currentQuestions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer === question.correct_option) {
          correct++;
        }
      });

      const scorePercent = (correct / total) * 100;

      // Save score to database
      const { error } = await supabase
        .from('scores')
        .insert([{
          mock_test_id: takingTest,
          user_id: user?.id,
          score_percent: scorePercent,
          correct_answers: correct,
          total_questions: total
        }]);

      if (error) throw error;

      // Update questions with user answers
      for (const question of currentQuestions) {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined) {
          await supabase
            .from('questions')
            .update({ user_selected_option: userAnswer })
            .eq('id', question.id);
        }
      }

      setTestResults({
        score: scorePercent,
        correct,
        total
      });
      setTestCompleted(true);

      toast({
        title: "Test Completed!",
        description: `You scored ${scorePercent.toFixed(1)}% (${correct}/${total})`,
        variant: "default"
      });

      loadMockTests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit test",
        variant: "destructive"
      });
    }
  };

  const filteredTests = selectedSubject === "all" 
    ? mockTests 
    : mockTests.filter(test => test.subjects?.name === selectedSubject);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const progress = currentQuestions.length > 0 ? ((currentQuestionIndex + 1) / currentQuestions.length) * 100 : 0;

  return (
    <motion.div 
      className="p-6 space-y-6 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programming Mock Tests</h1>
          <p className="text-muted-foreground mt-1">
            Practice coding concepts with interactive MCQ tests
          </p>
        </div>
        
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="Python">Python</SelectItem>
            <SelectItem value="SQL">SQL</SelectItem>
            <SelectItem value="Data Structures">Data Structures</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Create Programming Tests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Create Programming Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROGRAMMING_TESTS.map((test, index) => (
                <motion.div
                  key={test.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`hover:shadow-hover transition-all duration-300 border-0 bg-gradient-to-br ${test.color} text-white hover:scale-[1.02]`}>
                    <CardContent className="p-6 text-center">
                      <test.icon className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{test.title}</h3>
                      <p className="text-sm opacity-90 mb-4">{test.questions.length} Questions</p>
                      <Button
                        variant="secondary"
                        className="w-full rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30"
                        onClick={() => createProgrammingTest(test)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Existing Tests */}
      {filteredTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Your Programming Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-card hover:shadow-hover transition-all duration-300 border-0 hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {test.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Code className="w-4 h-4" />
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
                    
                    {test.scores && test.scores.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Last Score:</p>
                        <Badge 
                          variant={test.scores[0].score_percent >= 80 ? "default" : 
                                 test.scores[0].score_percent >= 60 ? "secondary" : "destructive"}
                          className="font-medium"
                        >
                          {test.scores[0].score_percent.toFixed(1)}% 
                          ({test.scores[0].correct_answers}/{test.scores[0].total_questions})
                        </Badge>
                      </div>
                    )}
                    
                    <Button
                      variant="gradient"
                      onClick={() => startTest(test.id)}
                      className="w-full rounded-xl hover:scale-[1.02] transition-transform"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {test.scores && test.scores.length > 0 ? "Retake Test" : "Start Test"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Test Taking Dialog */}
      {takingTest && (
        <Dialog open={true} onOpenChange={() => setTakingTest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Programming Test</span>
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {currentQuestions.length}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {!testCompleted ? (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Current Question */}
                {currentQuestion && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <Card className="border-0 bg-muted/30">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="text-lg font-medium">
                              {renderQuestionText(currentQuestion.question_text)}
                            </div>
                            
                            <RadioGroup
                              value={userAnswers[currentQuestion.id]?.toString() || ""}
                              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                              className="space-y-3"
                            >
                              {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Navigation */}
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          {userAnswers[currentQuestion.id] !== undefined ? (
                            <span className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Answered
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-amber-600">
                              <AlertCircle className="w-4 h-4" />
                              Not answered
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {currentQuestionIndex < currentQuestions.length - 1 ? (
                            <Button onClick={nextQuestion} className="rounded-xl">
                              Next Question
                            </Button>
                          ) : (
                            <Button 
                              onClick={submitTest}
                              variant="gradient"
                              className="rounded-xl"
                            >
                              Submit Test
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ) : (
              /* Test Results */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                  <h3 className="text-2xl font-bold">Test Completed!</h3>
                  {testResults && (
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-primary">
                        {testResults.score.toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground">
                        {testResults.correct} out of {testResults.total} questions correct
                      </p>
                    </div>
                  )}
                </div>

                {/* Detailed Results */}
                <Card className="border-0 bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Detailed Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentQuestions.map((question, index) => {
                      const userAnswer = userAnswers[question.id];
                      const isCorrect = userAnswer === question.correct_option;
                      
                      return (
                        <div key={question.id} className="space-y-3 p-4 rounded-lg border border-border/50">
                          <div className="flex items-start gap-3">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 space-y-2">
                              <p className="font-medium">Question {index + 1}</p>
                              <div className="text-sm">
                                {renderQuestionText(question.question_text)}
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Your answer:</span>{" "}
                                  <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                    {userAnswer !== undefined ? question.options[userAnswer] : "Not answered"}
                                  </span>
                                </p>
                                {!isCorrect && (
                                  <p>
                                    <span className="font-medium">Correct answer:</span>{" "}
                                    <span className="text-green-600">
                                      {question.options[question.correct_option]}
                                    </span>
                                  </p>
                                )}
                                {question.explanation && (
                                  <p className="text-muted-foreground italic">
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Button 
                  onClick={() => setTakingTest(null)}
                  className="w-full rounded-xl"
                  variant="gradient"
                >
                  Close Results
                </Button>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default MockTests;
