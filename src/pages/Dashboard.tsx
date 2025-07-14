import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target,
  CheckCircle2,
  Calendar,
  BarChart3,
  Code2,
  Database,
  Globe,
  Coffee,
  Zap,
  Layers,
  Server,
  Wrench,
  GitBranch,
  Cpu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudyPlans: number;
  completedStudyPlans: number;
  totalMockTests: number;
  averageScore: number;
  recentTests: Array<{
    id: string;
    title: string;
    score_percent: number;
    date_taken: string;
  }>;
  upcomingPlans: Array<{
    id: string;
    topic: string;
    target_date: string;
    subject_name: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudyPlans: 0,
    completedStudyPlans: 0,
    totalMockTests: 0,
    averageScore: 0,
    recentTests: [],
    upcomingPlans: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Programming language icons
  const getSubjectIcon = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'python': return <Code2 className="w-4 h-4 text-blue-500" />;
      case 'javascript': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'sql': return <Database className="w-4 h-4 text-green-500" />;
      case 'java': return <Coffee className="w-4 h-4 text-orange-500" />;
      case 'c++': return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'html/css': return <Globe className="w-4 h-4 text-pink-500" />;
      case 'react': return <Layers className="w-4 h-4 text-cyan-500" />;
      case 'node.js': return <Server className="w-4 h-4 text-green-600" />;
      case 'data structures': return <GitBranch className="w-4 h-4 text-indigo-500" />;
      case 'algorithms': return <Wrench className="w-4 h-4 text-red-500" />;
      default: return <Code2 className="w-4 h-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load study plans stats
      const { data: studyPlans, error: plansError } = await supabase
        .from('study_plans')
        .select('*, subjects(name)')
        .eq('user_id', user?.id);

      if (plansError) throw plansError;

      // Load mock tests and scores
      const { data: mockTests, error: testsError } = await supabase
        .from('mock_tests')
        .select('*, scores(*), subjects(name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      // Calculate stats
      const totalStudyPlans = studyPlans?.length || 0;
      const completedStudyPlans = studyPlans?.filter(plan => plan.status === 'Completed').length || 0;
      const totalMockTests = mockTests?.length || 0;
      
      // Calculate average score
      const testsWithScores = mockTests?.filter(test => test.scores && test.scores.length > 0) || [];
      const averageScore = testsWithScores.length > 0 
        ? testsWithScores.reduce((sum, test) => sum + (test.scores[0]?.score_percent || 0), 0) / testsWithScores.length
        : 0;

      // Recent tests (last 5)
      const recentTests = testsWithScores.slice(0, 5).map(test => ({
        id: test.id,
        title: test.title,
        score_percent: test.scores[0]?.score_percent || 0,
        date_taken: test.date_taken || test.created_at
      }));

      // Upcoming study plans (next 5 with target dates)
      const upcomingPlans = studyPlans
        ?.filter(plan => plan.status === 'Pending' && plan.target_date)
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 5)
        .map(plan => ({
          id: plan.id,
          topic: plan.topic,
          target_date: plan.target_date,
          subject_name: plan.subjects?.name || 'Unknown Subject'
        })) || [];

      setStats({
        totalStudyPlans,
        completedStudyPlans,
        totalMockTests,
        averageScore,
        recentTests,
        upcomingPlans
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const studyPlanProgress = stats.totalStudyPlans > 0 
    ? (stats.completedStudyPlans / stats.totalStudyPlans) * 100 
    : 0;

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's your learning progress overview. Keep up the great work! 🚀
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Plans</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalStudyPlans}</p>
                <p className="text-xs text-success">
                  {stats.completedStudyPlans} completed
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mock Tests</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalMockTests}</p>
                <p className="text-xs text-primary">
                  Tests taken
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-foreground">{stats.averageScore.toFixed(1)}%</p>
                <p className="text-xs text-success">
                  Keep improving!
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-3xl font-bold text-foreground">{studyPlanProgress.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  Study completion
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Study Plan Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Completion</span>
              <span className="font-medium">{stats.completedStudyPlans}/{stats.totalStudyPlans}</span>
            </div>
            <Progress value={studyPlanProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Keep going!</span>
              <span>{studyPlanProgress.toFixed(1)}% complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test Results */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-warning" />
                Recent Test Results
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/mock-tests')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentTests.length > 0 ? (
              <div className="space-y-4">
                {stats.recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{test.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.date_taken).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={test.score_percent >= 80 ? "default" : test.score_percent >= 60 ? "secondary" : "destructive"}
                      className="font-medium"
                    >
                      {test.score_percent.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No test results yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/mock-tests')}
                >
                  Take Your First Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Study Plans */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Study Plans
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/study-plans')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingPlans.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {getSubjectIcon(plan.subject_name)}
                      <div>
                        <p className="font-medium text-sm">{plan.topic}</p>
                        <p className="text-xs text-muted-foreground">{plan.subject_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {new Date(plan.target_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Target</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming plans</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/study-plans')}
                >
                  Create Study Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="gradient" 
              className="h-auto p-6 flex-col space-y-2"
              onClick={() => navigate('/study-plans')}
            >
              <BookOpen className="w-8 h-8" />
              <span>Create Study Plan</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex-col space-y-2 hover:bg-primary/5"
              onClick={() => navigate('/mock-tests')}
            >
              <FileText className="w-8 h-8" />
              <span>Take Mock Test</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex-col space-y-2 hover:bg-primary/5"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="w-8 h-8" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;