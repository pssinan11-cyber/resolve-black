import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttachmentsList from "./AttachmentsList";

interface AdminComplaintDetailsProps {
  complaint: any;
  onBack: () => void;
  onUpdate: () => void;
}

const AdminComplaintDetails = ({ complaint, onBack, onUpdate }: AdminComplaintDetailsProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to realtime updates for comments
    const channel = supabase
      .channel(`admin-complaint-comments-${complaint.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `complaint_id=eq.${complaint.id}`
        },
        (payload) => {
          const newComment = payload.new;
          
          // Show notification for student comments
          if (!newComment.is_admin_reply) {
            toast.info("💬 Student added a new comment", { duration: 3000 });
          }
          
          fetchComments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaint.id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(full_name)")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    setComments(data || []);
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
          is_admin_reply: true,
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

  const generateAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reply", {
        body: { complaint },
      });

      if (error) throw error;
      setAiSuggestions(data);
    } catch (error: any) {
      toast.error("Failed to generate AI suggestions");
    } finally {
      setLoadingAI(false);
    }
  };

  const useAISuggestion = (suggestion: string) => {
    setNewComment(suggestion);
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
            <div>
              <CardTitle className="text-2xl mb-2">{complaint.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                By {complaint.profiles?.full_name || "Student"}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={`bg-severity-${complaint.severity}`}>
                {complaint.severity.toUpperCase()}
              </Badge>
              {complaint.priority_score > 70 && (
                <Badge variant="outline" className="border-foreground">
                  High Priority ({complaint.priority_score})
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.ai_category && (
            <div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{complaint.ai_category}</Badge>
                {complaint.ai_tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
                {complaint.predicted_hours && (
                  <Badge variant="outline">Est. {complaint.predicted_hours}h</Badge>
                )}
              </div>
            </div>
          )}

          <AttachmentsList complaintId={complaint.id} />
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>AI Assistant</CardTitle>
            <Button
              onClick={generateAISuggestions}
              disabled={loadingAI}
              variant="outline"
              className="border-2"
            >
              {loadingAI ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Suggestions
            </Button>
          </div>
        </CardHeader>
        {aiSuggestions && (
          <CardContent>
            <Tabs defaultValue="formal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="formal">Formal</TabsTrigger>
                <TabsTrigger value="friendly">Friendly</TabsTrigger>
                <TabsTrigger value="empathetic">Empathetic</TabsTrigger>
              </TabsList>
              <TabsContent value="formal" className="space-y-2">
                <p className="text-sm p-4 bg-muted rounded-lg border-2 border-border">
                  {aiSuggestions.formal}
                </p>
                <Button
                  onClick={() => useAISuggestion(aiSuggestions.formal)}
                  variant="outline"
                  size="sm"
                  className="border-2"
                >
                  Use This Reply
                </Button>
              </TabsContent>
              <TabsContent value="friendly" className="space-y-2">
                <p className="text-sm p-4 bg-muted rounded-lg border-2 border-border">
                  {aiSuggestions.friendly}
                </p>
                <Button
                  onClick={() => useAISuggestion(aiSuggestions.friendly)}
                  variant="outline"
                  size="sm"
                  className="border-2"
                >
                  Use This Reply
                </Button>
              </TabsContent>
              <TabsContent value="empathetic" className="space-y-2">
                <p className="text-sm p-4 bg-muted rounded-lg border-2 border-border">
                  {aiSuggestions.empathetic}
                </p>
                <Button
                  onClick={() => useAISuggestion(aiSuggestions.empathetic)}
                  variant="outline"
                  size="sm"
                  className="border-2"
                >
                  Use This Reply
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
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
              placeholder="Add a comment or reply..."
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
    </div>
  );
};

export default AdminComplaintDetails;