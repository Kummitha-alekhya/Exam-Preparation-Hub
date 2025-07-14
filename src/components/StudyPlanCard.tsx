import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Trash2, Target, Code2, Database, Globe, Coffee, Zap, Layers, Server, Wrench, GitBranch, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyPlan {
  id: string;
  topic: string;
  target_date: string;
  status: string;
  created_at: string;
  subject_id: string;
  subjects: { name: string } | null;
}

interface StudyPlanCardProps {
  plan: StudyPlan;
  onStatusUpdate: (planId: string, newStatus: string) => void;
  onDelete: (planId: string) => void;
  index: number;
}

const StudyPlanCard = ({ plan, onStatusUpdate, onDelete, index }: StudyPlanCardProps) => {
  const isCompleted = plan.status === 'Completed';
  const targetDate = new Date(plan.target_date);
  const isOverdue = !isCompleted && targetDate < new Date();
  const daysUntilTarget = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Programming language icons and colors
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

  const getSubjectColor = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'python': return 'from-blue-500/10 to-blue-600/5 border-l-blue-500';
      case 'javascript': return 'from-yellow-500/10 to-yellow-600/5 border-l-yellow-500';
      case 'sql': return 'from-green-500/10 to-green-600/5 border-l-green-500';
      case 'java': return 'from-orange-500/10 to-orange-600/5 border-l-orange-500';
      case 'c++': return 'from-purple-500/10 to-purple-600/5 border-l-purple-500';
      case 'html/css': return 'from-pink-500/10 to-pink-600/5 border-l-pink-500';
      case 'react': return 'from-cyan-500/10 to-cyan-600/5 border-l-cyan-500';
      case 'node.js': return 'from-green-600/10 to-green-700/5 border-l-green-600';
      case 'data structures': return 'from-indigo-500/10 to-indigo-600/5 border-l-indigo-500';
      case 'algorithms': return 'from-red-500/10 to-red-600/5 border-l-red-500';
      default: return 'from-gray-500/10 to-gray-600/5 border-l-gray-500';
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-success/10 text-success border-success/20 font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="font-medium">
          <Clock className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 font-medium">
        <Target className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getTimeText = () => {
    if (isCompleted) return "Completed";
    if (isOverdue) return `${Math.abs(daysUntilTarget)} days overdue`;
    if (daysUntilTarget === 0) return "Due today";
    if (daysUntilTarget === 1) return "Due tomorrow";
    return `${daysUntilTarget} days left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className={cn(
        "relative overflow-hidden border-0 shadow-card hover:shadow-hover transition-all duration-300 border-l-4",
        isCompleted && "opacity-90 bg-gradient-to-br from-success/5 to-success/10 border-l-success",
        isOverdue && `bg-gradient-to-br from-destructive/5 to-destructive/10 border-l-destructive`,
        !isCompleted && !isOverdue && `bg-gradient-to-br ${getSubjectColor(plan.subjects?.name || '')}`
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {plan.topic}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getSubjectIcon(plan.subjects?.name || '')}
                <p className="text-sm text-muted-foreground font-medium">
                  {plan.subjects?.name || 'Unknown Subject'}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Target: {targetDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className={cn(
              "w-4 h-4",
              isOverdue ? "text-destructive" : isCompleted ? "text-success" : "text-primary"
            )} />
            <span className={cn(
              "font-medium",
              isOverdue ? "text-destructive" : isCompleted ? "text-success" : "text-primary"
            )}>
              {getTimeText()}
            </span>
          </div>
          
          <motion.div 
            className="flex gap-2 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {!isCompleted ? (
              <Button
                size="sm"
                variant="success"
                onClick={() => onStatusUpdate(plan.id, 'Completed')}
                className="flex-1 rounded-xl font-medium hover:scale-[1.02] transition-transform"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complete
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(plan.id, 'Pending')}
                className="flex-1 rounded-xl font-medium hover:scale-[1.02] transition-transform"
              >
                <Clock className="w-4 h-4 mr-1" />
                Reopen
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(plan.id)}
              className="w-10 h-10 p-0 rounded-xl hover:bg-destructive/10 hover:border-destructive/20 hover:scale-[1.02] transition-all"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </motion.div>
        </CardContent>
        
        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
};

export default StudyPlanCard;