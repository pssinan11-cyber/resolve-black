import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminComplaintDetails from "./AdminComplaintDetails";
import confetti from "canvas-confetti";

interface AdminComplaintCardProps {
  complaint: any;
  onUpdate: () => void;
}

const AdminComplaintCard = ({ complaint, onUpdate }: AdminComplaintCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    if (newStatus === "resolved") {
      setIsResolving(true);
    }
    
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("complaints")
        .update(updates)
        .eq("id", complaint.id);

      if (error) throw error;

      if (newStatus === "resolved") {
        // Trigger monochrome confetti
        const count = 150;
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#000000', '#FFFFFF', '#666666'],
          shapes: ['circle', 'square'],
          scalar: 1.2,
        };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
        
        toast.success("Complaint resolved successfully! 🎉", {
          duration: 3000,
        });
        
        // Keep animation visible for a moment before updating
        setTimeout(() => {
          setIsResolving(false);
          onUpdate();
        }, 1000);
      } else {
        toast.success(`Status updated to ${newStatus}`);
        onUpdate();
      }
    } catch (error: any) {
      toast.error("Failed to update status");
      setIsResolving(false);
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityClass = (severity: string) => {
    const classes: Record<string, string> = {
      low: "bg-severity-low",
      medium: "bg-severity-medium",
      high: "bg-severity-high",
      urgent: "bg-severity-urgent text-white",
    };
    return classes[severity] || classes.medium;
  };

  if (showDetails) {
    return (
      <AdminComplaintDetails
        complaint={complaint}
        onBack={() => setShowDetails(false)}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <Card className={`border-2 border-border hover:shadow-lg transition-all duration-500 ${
      isResolving ? 'animate-pulse scale-[0.98] opacity-70' : ''
    }`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{complaint.title}</CardTitle>
              {complaint.priority_score > 70 && (
                <Badge variant="outline" className="border-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  High Priority
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              By {complaint.profiles?.full_name || "Student"}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {complaint.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getSeverityClass(complaint.severity)}>
              {complaint.severity.toUpperCase()}
            </Badge>
            {complaint.predicted_hours && (
              <Badge variant="outline">~{complaint.predicted_hours}h</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
          </div>
          {complaint.comments && complaint.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{complaint.comments[0].count} comments</span>
            </div>
          )}
          {complaint.ai_category && (
            <Badge variant="secondary">{complaint.ai_category}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={complaint.status}
            onValueChange={handleStatusChange}
            disabled={updating}
          >
            <SelectTrigger className="border-2 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          {complaint.status !== "resolved" && (
            <Button
              onClick={() => handleStatusChange("resolved")}
              disabled={updating}
              className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 active:scale-95 transition-transform"
            >
              <CheckCircle2 className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          )}

          <Button
            onClick={() => setShowDetails(true)}
            variant="outline"
            className="border-2"
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminComplaintCard;