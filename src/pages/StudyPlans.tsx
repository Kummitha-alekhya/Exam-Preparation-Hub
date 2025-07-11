import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Clock,
  Filter,
  Search,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StudyPlan {
  id: string;
  topic: string;
  target_date: string;
  status: string;
  created_at: string;
  subject_id: string;
  subjects: { name: string } | null;
}

interface Subject {
  id: string;
  name: string;
}

const StudyPlans = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [newPlan, setNewPlan] = useState({
    topic: "",
    subject_id: "",
    target_date: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadStudyPlans();
      loadSubjects();
    }
  }, [user]);

  useEffect(() => {
    filterPlans();
  }, [studyPlans, searchTerm, statusFilter, subjectFilter]);

  const loadStudyPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*, subjects(name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load study plans",
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

  const filterPlans = () => {
    let filtered = studyPlans;

    if (searchTerm) {
      filtered = filtered.filter(plan => 
        plan.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.subjects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter(plan => plan.subject_id === subjectFilter);
    }

    setFilteredPlans(filtered);
  };

  const createSubject = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ name, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      setSubjects([...subjects, data]);
      return data.id;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleCreatePlan = async () => {
    try {
      if (!newPlan.topic || !newPlan.subject_id || !newPlan.target_date) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('study_plans')
        .insert([{
          ...newPlan,
          user_id: user?.id,
          status: 'Pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Study plan created successfully!",
        variant: "default"
      });

      setNewPlan({ topic: "", subject_id: "", target_date: "" });
      setIsCreateOpen(false);
      loadStudyPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create study plan",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (planId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Study plan marked as ${newStatus.toLowerCase()}`,
        variant: "default"
      });

      loadStudyPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update study plan",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Study plan deleted successfully",
        variant: "default"
      });

      loadStudyPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete study plan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="default" className="bg-success text-success-foreground">Completed</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingPlans = filteredPlans.filter(plan => plan.status === 'Pending');
  const completedPlans = filteredPlans.filter(plan => plan.status === 'Completed');

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Plans</h1>
          <p className="text-muted-foreground">
            Organize your learning journey with personalized study plans
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="Enter study topic"
                  value={newPlan.topic}
                  onChange={(e) => setNewPlan({ ...newPlan, topic: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={newPlan.subject_id} 
                  onValueChange={(value) => setNewPlan({ ...newPlan, subject_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={newPlan.target_date}
                  onChange={(e) => setNewPlan({ ...newPlan, target_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <Button onClick={handleCreatePlan} className="w-full" variant="gradient">
                Create Study Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search study plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Study Plans Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingPlans.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed ({completedPlans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingPlans.map((plan) => (
                <Card key={plan.id} className="shadow-card hover:shadow-hover transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">
                          {plan.topic}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.subjects?.name}
                        </p>
                      </div>
                      {getStatusBadge(plan.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Target: {new Date(plan.target_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateStatus(plan.id, 'Completed')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No pending study plans</h3>
              <p className="text-muted-foreground mb-4">
                Create your first study plan to start organizing your learning journey
              </p>
              <Button variant="gradient" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Study Plan
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedPlans.map((plan) => (
                <Card key={plan.id} className="shadow-card opacity-90">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">
                          {plan.topic}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.subjects?.name}
                        </p>
                      </div>
                      {getStatusBadge(plan.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Target: {new Date(plan.target_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(plan.id, 'Pending')}
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Mark Pending
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No completed study plans yet</h3>
              <p className="text-muted-foreground">
                Complete your pending study plans to see them here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyPlans;