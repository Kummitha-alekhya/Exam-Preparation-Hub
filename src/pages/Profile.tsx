import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  BookOpen, 
  FileText,
  TrendingUp,
  Settings,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfileStats {
  totalStudyPlans: number;
  completedStudyPlans: number;
  totalTests: number;
  averageScore: number;
  bestScore: number;
  joinDate: string;
  streak: number;
  level: string;
}

const Profile = () => {
  const [stats, setStats] = useState<ProfileStats>({
    totalStudyPlans: 0,
    completedStudyPlans: 0,
    totalTests: 0,
    averageScore: 0,
    bestScore: 0,
    joinDate: '',
    streak: 0,
    level: 'Beginner'
  });
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfileStats();
    }
  }, [user]);

  const loadProfileStats = async () => {
    try {
      setLoading(true);

      // Load study plans
      const { data: studyPlans, error: plansError } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user?.id);

      if (plansError) throw plansError;

      // Load mock tests with scores
      const { data: mockTests, error: testsError } = await supabase
        .from('mock_tests')
        .select('*, scores(*)')
        .eq('user_id', user?.id);

      if (testsError) throw testsError;

      // Calculate stats
      const totalStudyPlans = studyPlans?.length || 0;
      const completedStudyPlans = studyPlans?.filter(plan => plan.status === 'Completed').length || 0;
      const totalTests = mockTests?.length || 0;

      // Calculate scores
      const testsWithScores = mockTests?.filter(test => test.scores && test.scores.length > 0) || [];
      const scores = testsWithScores.map(test => test.scores[0].score_percent);
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Calculate level based on completed activities
      const totalActivity = completedStudyPlans + testsWithScores.length;
      let level = 'Beginner';
      if (totalActivity >= 20) level = 'Expert';
      else if (totalActivity >= 10) level = 'Advanced';
      else if (totalActivity >= 5) level = 'Intermediate';

      // Calculate streak (simplified - consecutive days with activity)
      const streak = Math.min(totalActivity, 30); // Cap at 30 days

      setStats({
        totalStudyPlans,
        completedStudyPlans,
        totalTests,
        averageScore,
        bestScore,
        joinDate: user?.created_at || '',
        streak,
        level
      });

    } catch (error: any) {
      console.error('Error loading profile stats:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Expert':
        return <Badge variant="default" className="bg-gradient-primary text-primary-foreground">Expert</Badge>;
      case 'Advanced':
        return <Badge variant="default" className="bg-success text-success-foreground">Advanced</Badge>;
      case 'Intermediate':
        return <Badge variant="secondary">Intermediate</Badge>;
      default:
        return <Badge variant="outline">Beginner</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (stats.totalStudyPlans === 0) return 0;
    return (stats.completedStudyPlans / stats.totalStudyPlans) * 100;
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || "U";

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded w-20 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and view your learning statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="shadow-card lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold">{user?.email}</h2>
                  {getLevelBadge(stats.level)}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(stats.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                <span className="font-medium">Learning Streak</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.streak} days</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Study Progress</span>
                <span className="font-medium">{getProgressPercentage().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.completedStudyPlans} of {stats.totalStudyPlans} study plans completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="text-3xl font-bold text-foreground">{stats.totalTests}</p>
                  <p className="text-xs text-primary">
                    Tests completed
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
                    Overall performance
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
                  <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                  <p className="text-3xl font-bold text-foreground">{stats.bestScore.toFixed(1)}%</p>
                  <p className="text-xs text-warning">
                    Personal record
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border text-center ${stats.totalTests >= 1 ? 'bg-primary/5 border-primary' : 'bg-muted/30'}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${stats.totalTests >= 1 ? 'bg-primary/10' : 'bg-muted'}`}>
                <FileText className={`w-6 h-6 ${stats.totalTests >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-medium text-sm">First Test</h4>
              <p className="text-xs text-muted-foreground">Complete your first mock test</p>
              {stats.totalTests >= 1 && <Badge variant="default" className="mt-2">Achieved</Badge>}
            </div>

            <div className={`p-4 rounded-lg border text-center ${stats.completedStudyPlans >= 1 ? 'bg-success/5 border-success' : 'bg-muted/30'}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${stats.completedStudyPlans >= 1 ? 'bg-success/10' : 'bg-muted'}`}>
                <BookOpen className={`w-6 h-6 ${stats.completedStudyPlans >= 1 ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-medium text-sm">Study Master</h4>
              <p className="text-xs text-muted-foreground">Complete your first study plan</p>
              {stats.completedStudyPlans >= 1 && <Badge variant="default" className="bg-success text-success-foreground mt-2">Achieved</Badge>}
            </div>

            <div className={`p-4 rounded-lg border text-center ${stats.averageScore >= 80 ? 'bg-warning/5 border-warning' : 'bg-muted/30'}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${stats.averageScore >= 80 ? 'bg-warning/10' : 'bg-muted'}`}>
                <TrendingUp className={`w-6 h-6 ${stats.averageScore >= 80 ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-medium text-sm">High Achiever</h4>
              <p className="text-xs text-muted-foreground">Maintain 80%+ average score</p>
              {stats.averageScore >= 80 && <Badge variant="default" className="bg-warning text-warning-foreground mt-2">Achieved</Badge>}
            </div>

            <div className={`p-4 rounded-lg border text-center ${stats.level === 'Expert' ? 'bg-primary/5 border-primary' : 'bg-muted/30'}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${stats.level === 'Expert' ? 'bg-primary/10' : 'bg-muted'}`}>
                <Trophy className={`w-6 h-6 ${stats.level === 'Expert' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <h4 className="font-medium text-sm">Expert Level</h4>
              <p className="text-xs text-muted-foreground">Reach expert learning level</p>
              {stats.level === 'Expert' && <Badge variant="default" className="mt-2">Achieved</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Badge variant="outline">Verified</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Account Security</p>
                <p className="text-sm text-muted-foreground">Password protected</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={signOut}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;