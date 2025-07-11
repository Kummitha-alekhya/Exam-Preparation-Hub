import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Save, X } from "lucide-react";

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: { topic: string; subject_id: string; target_date: string }) => void;
  subjects: Array<{ id: string; name: string }>;
  editingPlan?: {
    topic: string;
    subject_id: string;
    target_date: string;
  } | null;
}

const StudyPlanModal = ({ isOpen, onClose, onSubmit, subjects, editingPlan }: StudyPlanModalProps) => {
  const [formData, setFormData] = useState({
    topic: editingPlan?.topic || "",
    subject_id: editingPlan?.subject_id || "",
    target_date: editingPlan?.target_date || ""
  });

  const handleSubmit = () => {
    if (!formData.topic || !formData.subject_id || !formData.target_date) {
      return;
    }
    onSubmit(formData);
    setFormData({ topic: "", subject_id: "", target_date: "" });
  };

  const handleClose = () => {
    setFormData({ topic: "", subject_id: "", target_date: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-hover">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {editingPlan ? "Edit Study Plan" : "Create New Study Plan"}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="p-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="topic" className="text-sm font-medium">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="Enter study topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger className="rounded-xl border-border/50">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="target_date" className="text-sm font-medium">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3 pt-4"
                >
                  <Button 
                    onClick={handleClose} 
                    variant="outline" 
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    variant="gradient" 
                    className="flex-1 rounded-xl"
                    disabled={!formData.topic || !formData.subject_id || !formData.target_date}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPlan ? "Update" : "Create"}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default StudyPlanModal;