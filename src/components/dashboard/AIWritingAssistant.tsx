import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, MessageSquare, Lightbulb, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AIWritingAssistantProps {
  onImprove: (text: string) => void;
  onSuggestTitle: (title: string) => void;
  currentDescription?: string;
}

const AIWritingAssistant = ({ onImprove, onSuggestTitle, currentDescription }: AIWritingAssistantProps) => {
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const callAI = async (action: string, text: string, description?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-writing-assistant', {
        body: { action, text, description }
      });

      if (error) throw error;
      return data.result;
    } catch (error: any) {
      if (error.message?.includes("429") || error.message?.includes("rate limit")) {
        toast.error("AI rate limit reached. Please try again in a moment.");
      } else if (error.message?.includes("402") || error.message?.includes("credits")) {
        toast.error("AI credits exhausted. Please contact support.");
      } else {
        toast.error("AI request failed. Please try again.");
      }
      throw error;
    }
  };

  const handleImprove = async () => {
    if (!currentDescription?.trim()) {
      toast.error("Please write a description first");
      return;
    }

    setLoading(true);
    try {
      const improved = await callAI('improve', currentDescription);
      onImprove(improved);
      toast.success("Description improved with AI!");
    } catch (error) {
      console.error('Error improving text:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTitle = async () => {
    if (!currentDescription?.trim()) {
      toast.error("Please write a description first");
      return;
    }

    setLoading(true);
    try {
      const title = await callAI('suggest_title', '', currentDescription);
      onSuggestTitle(title);
      toast.success("Title suggested by AI!");
    } catch (error) {
      console.error('Error suggesting title:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    setChatLoading(true);
    setChatResponse("");
    
    try {
      const response = await callAI('chat', chatMessage);
      setChatResponse(response);
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Writing Assistant</CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by AI
          </Badge>
        </div>
        <CardDescription>
          Get AI-powered help to write better complaints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleImprove}
            disabled={loading || !currentDescription}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Improve Description
          </Button>

          <Button
            variant="outline"
            onClick={handleSuggestTitle}
            disabled={loading || !currentDescription}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            Suggest Title
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with AI Helper
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Assistant Chat
              </DialogTitle>
              <DialogDescription>
                Ask anything about filing complaints or get writing help
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Ask me anything about complaints..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleChat}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="w-full gap-2"
                >
                  {chatLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Ask AI
                    </>
                  )}
                </Button>
              </div>

              {chatResponse && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-wrap">{chatResponse}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AIWritingAssistant;
