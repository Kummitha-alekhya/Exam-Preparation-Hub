import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search,
  Filter,
  BookOpen,
  Target,
  CheckCircle2,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StudyPlanModal from "@/components/StudyPlanModal";
import StudyPlanCard from "@/components/StudyPlanCard";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

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
        .order('name');

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

  const handleCreatePlan = async (planData: { topic: string; subject_id: string; target_date: string }) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .insert([{
          ...planData,
          user_id: user?.id,
          status: 'Pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Study plan created successfully!",
        variant: "default"
      });

      setIsModalOpen(false);
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

  const pendingPlans = filteredPlans.filter(plan => plan.status === 'Pending');
  const completedPlans = filteredPlans.filter(plan => plan.status === 'Completed');

  if (loading) {
    return (
      <motion.div 
        className="p-6 space-y-6 max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded-xl w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded-xl w-1/2 mb-4"></div>
                  <div className="h-6 bg-muted rounded-xl w-1/3"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Study Plans</h1>
          <p className="text-muted-foreground mt-1">
            Organize your learning journey with personalized study plans
          </p>
        </div>
        
        <Button 
          variant="gradient" 
          className="flex items-center gap-2 rounded-xl px-6 hover:scale-[1.02] transition-transform shadow-soft"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search study plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
      </motion.div>

      {/* Study Plans Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl p-1 bg-muted/50">
            <TabsTrigger value="pending" className="flex items-center gap-2 rounded-lg font-medium">
              <Clock className="w-4 h-4" />
              Pending ({pendingPlans.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedPlans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <AnimatePresence mode="wait">
              {pendingPlans.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {pendingPlans.map((plan, index) => (
                    <StudyPlanCard
                      key={plan.id}
                      plan={plan}
                      onStatusUpdate={handleUpdateStatus}
                      onDelete={handleDeletePlan}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-soft">
                    <BookOpen className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No pending study plans</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first study plan to start organizing your learning journey and track your progress
                  </p>
                  <Button 
                    variant="gradient" 
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-xl px-6 hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Study Plan
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="completed">
            <AnimatePresence mode="wait">
              {completedPlans.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {completedPlans.map((plan, index) => (
                    <StudyPlanCard
                      key={plan.id}
                      plan={plan}
                      onStatusUpdate={handleUpdateStatus}
                      onDelete={handleDeletePlan}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-success rounded-2xl flex items-center justify-center shadow-soft">
                    <Target className="w-10 h-10 text-success-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No completed plans yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Complete some study plans to see them here and track your achievements
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Study Plan Modal */}
      <StudyPlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleCreatePlan}
        subjects={subjects}
        editingPlan={editingPlan}
      />
    </motion.div>
  );
};

export default StudyPlans;