import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description too long"),
  severity: z.enum(["low", "medium", "high", "urgent"]),
});

interface ComplaintFormProps {
  onSuccess: () => void;
}

const ComplaintForm = ({ onSuccess }: ComplaintFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      complaintSchema.parse({ title, description, severity });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call AI classification function
      const { data: aiData } = await supabase.functions.invoke("classify-complaint", {
        body: { title, description, severity },
      });

      // Insert complaint
      const { error } = await supabase
        .from("complaints")
        .insert([{
          student_id: user.id,
          title,
          description,
          severity: severity as "low" | "medium" | "high" | "urgent",
          ai_category: aiData?.category,
          ai_confidence: aiData?.confidence,
          ai_tags: aiData?.tags,
          priority_score: aiData?.priority_score || 0,
          predicted_hours: aiData?.predicted_hours,
        }]);

      if (error) throw error;

      toast.success("Complaint submitted successfully!");
      setTitle("");
      setDescription("");
      setSeverity("medium");
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to submit complaint");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide detailed information about your complaint..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="border-2 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="severity">Severity</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Minor inconvenience</SelectItem>
            <SelectItem value="medium">Medium - Notable issue</SelectItem>
            <SelectItem value="high">High - Significant problem</SelectItem>
            <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full font-semibold">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyzing & Submitting...
          </>
        ) : (
          "Submit Complaint"
        )}
      </Button>
    </form>
  );
};

export default ComplaintForm;