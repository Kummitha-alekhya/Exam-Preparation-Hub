import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  BookOpen,
  Calendar,
  Award,
  PieChart,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  studyPlanProgress: {
    completed: number;
    pending: number;
    total: number;
  };
  testHistory: Array<{
    id: string;
    title: string;
    subject: string;
    score: number;
    date: string;
  }>;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    testCount: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    testsCompleted: number;
    averageScore: number;
  }>;
  overallStats: {
    totalTests: number;
    averageScore: number;
    bestScore: number;
    improvementTrend: number;
  };
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    studyPlanProgress: { completed: 0, pending: 0, total: 0 },
    testHistory: [],
    subjectPerformance: [],
    monthlyProgress: [],
    overallStats: {
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      improvementTrend: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load study plans
      const { data: studyPlans, error: plansError } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user?.id);

      if (plansError) throw plansError;

      // Load mock tests with scores and subjects
      const { data: mockTests, error: testsError } = await supabase
        .from('mock_tests')
        .select('*, scores(*), subjects(name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      // Process study plan progress
      const studyPlanProgress = {
        completed: studyPlans?.filter(plan => plan.status === 'Completed').length || 0,
        pending: studyPlans?.filter(plan => plan.status === 'Pending').length || 0,
        total: studyPlans?.length || 0
      };

      // Process test history
      const testHistory = mockTests
        ?.filter(test => test.scores && test.scores.length > 0)
        .map(test => ({
          id: test.id,
          title: test.title,
          subject: test.subjects?.name || 'Unknown',
          score: test.scores[0].score_percent,
          date: test.date_taken || test.created_at
        })) || [];

      // Process subject performance
      const subjectMap = new Map();
      testHistory.forEach(test => {
        if (!subjectMap.has(test.subject)) {
          subjectMap.set(test.subject, { scores: [], count: 0 });
        }
        const subjectData = subjectMap.get(test.subject);
        subjectData.scores.push(test.score);
        subjectData.count++;
      });

      const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length,
        testCount: data.count
      }));

      // Process monthly progress (last 6 months)
      const monthlyMap = new Map();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      testHistory
        .filter(test => new Date(test.date) >= sixMonthsAgo)
        .forEach(test => {
          const monthKey = new Date(test.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { scores: [], count: 0 });
          }
          const monthData = monthlyMap.get(monthKey);
          monthData.scores.push(test.score);
          monthData.count++;
        });

      const monthlyProgress = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        testsCompleted: data.count,
        averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length
      }));

      // Calculate overall stats
      const scores = testHistory.map(test => test.score);
      const totalTests = scores.length;
      const averageScore = totalTests > 0 ? scores.reduce((sum, score) => sum + score, 0) / totalTests : 0;
      const bestScore = totalTests > 0 ? Math.max(...scores) : 0;
      
      // Calculate improvement trend (comparing last 3 tests with previous 3)
      let improvementTrend = 0;
      if (totalTests >= 6) {
        const recentScores = scores.slice(0, 3);
        const previousScores = scores.slice(3, 6);
        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / 3;
        const previousAvg = previousScores.reduce((sum, score) => sum + score, 0) / 3;
        improvementTrend = recentAvg - previousAvg;
      }

      const overallStats = {
        totalTests,
        averageScore,
        bestScore,
        improvementTrend
      };

      setAnalyticsData({
        studyPlanProgress,
        testHistory,
        subjectPerformance,
        monthlyProgress,
        overallStats
      });

    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-success text-success-foreground">Excellent</Badge>;
    if (score >= 60) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend < 0) return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const studyPlanPercentage = analyticsData.studyPlanProgress.total > 0 
    ? (analyticsData.studyPlanProgress.completed / analyticsData.studyPlanProgress.total) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and performance insights
          </p>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="1month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.overallStats.totalTests}</p>
                <p className="text-xs text-primary">Tests completed</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.overallStats.averageScore.toFixed(1)}%</p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(analyticsData.overallStats.improvementTrend)}
                  <span className="text-xs text-muted-foreground">
                    {Math.abs(analyticsData.overallStats.improvementTrend).toFixed(1)}% trend
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                <p className="text-3xl font-bold text-foreground">{analyticsData.overallStats.bestScore.toFixed(1)}%</p>
                <p className="text-xs text-warning">Personal best</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Progress</p>
                <p className="text-3xl font-bold text-foreground">{studyPlanPercentage.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.studyPlanProgress.completed}/{analyticsData.studyPlanProgress.total} plans
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Plan Progress Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Study Plan Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${studyPlanPercentage * 2.51} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{studyPlanPercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span>Completed</span>
                  </div>
                  <span className="font-medium">{analyticsData.studyPlanProgress.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted"></div>
                    <span>Pending</span>
                  </div>
                  <span className="font-medium">{analyticsData.studyPlanProgress.pending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-success" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <div className="flex items-center gap-2">
                        <span>{subject.averageScore.toFixed(1)}%</span>
                        {getScoreBadge(subject.averageScore)}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subject.averageScore}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {subject.testCount} test{subject.testCount !== 1 ? 's' : ''} completed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No subject data available</p>
                <p className="text-xs">Complete some tests to see subject performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Test History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-warning" />
            Recent Test History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.testHistory.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.testHistory.slice(0, 10).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{test.title}</h4>
                    <p className="text-xs text-muted-foreground">{test.subject}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {getScoreBadge(test.score)}
                    <p className="text-xs text-muted-foreground">
                      {new Date(test.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No test history available</p>
              <p className="text-xs">Take some mock tests to see your progress here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;