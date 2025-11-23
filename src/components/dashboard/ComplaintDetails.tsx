import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import AttachmentsList from "./AttachmentsList";
import confetti from "canvas-confetti";

interface ComplaintDetailsProps {
  complaint: any;
  onBack: () => void;
}

const statusProgress: Record<string, number> = {
  pending: 25,
  in_progress: 50,
  resolved: 100,
};

const ComplaintDetails = ({ complaint, onBack }: ComplaintDetailsProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    fetchComments();
    checkRating();
  }, []);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(full_name)")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    setComments(data || []);
  };

  const checkRating = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("ratings")
      .select("*")
      .eq("complaint_id", complaint.id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (data) {
      setHasRated(true);
      setRating(data.rating);
      setFeedback(data.feedback || "");
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("comments")
        .insert({
          complaint_id: complaint.id,
          user_id: user.id,
          content: newComment,
        });

      if (error) throw error;

      toast.success("Comment sent");
      setNewComment("");
      fetchComments();
    } catch (error: any) {
      toast.error("Failed to send comment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ratings")
        .insert({
          complaint_id: complaint.id,
          student_id: user.id,
          rating,
          feedback,
        });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setHasRated(true);
    } catch (error: any) {
      toast.error("Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="border-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="border-2 border-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{complaint.title}</CardTitle>
            <Badge className={`bg-severity-${complaint.severity}`}>
              {complaint.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created {format(new Date(complaint.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{statusProgress[complaint.status]}%</span>
            </div>
            <Progress value={statusProgress[complaint.status]} className="h-2" />
          </div>

          {complaint.ai_category && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{complaint.ai_category}</Badge>
              {complaint.ai_tags?.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          <AttachmentsList complaintId={complaint.id} />
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Comments & Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border-2 ${
                  comment.is_admin_reply
                    ? "bg-muted border-foreground ml-4"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm">
                    {comment.profiles?.full_name || "User"}
                    {comment.is_admin_reply && " (Admin)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border-2 resize-none"
              rows={3}
            />
            <Button
              onClick={handleSendComment}
              disabled={loading || !newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {(complaint.status === "resolved") && !hasRated && (
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle>Rate Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "fill-foreground" : "fill-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Optional feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="border-2 resize-none"
              rows={3}
            />
            <Button onClick={handleSubmitRating} disabled={loading} className="w-full">
              Submit Rating
            </Button>
          </CardContent>
        </Card>
      )}

      {hasRated && (
        <Card className="border-2 border-border bg-muted">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Thank you for rating this complaint!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplaintDetails;