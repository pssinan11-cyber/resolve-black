import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Sparkles, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Brototype Resolve</h1>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/student-auth")} variant="outline" size="lg" className="font-semibold border-2">
              Student Login
            </Button>
            <Button onClick={() => navigate("/admin-auth")} size="lg" className="font-semibold">
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold tracking-tight">
              Minimalist Complaint Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A clean, efficient system for students and administrators to manage complaints
              with AI-powered insights. Inspired by the best of Slack, Trello, and Zendesk.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={() => navigate("/student-auth")} size="lg" className="text-lg px-8 font-semibold">
                Student Sign In
              </Button>
              <Button
                onClick={() => navigate("/admin-auth")}
                variant="outline"
                size="lg"
                className="text-lg px-8 border-2"
              >
                Admin Sign In
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-12">
            <Card className="border-2 border-border text-left">
              <CardContent className="pt-6 space-y-4">
                <MessageSquare className="h-10 w-10" />
                <h3 className="text-xl font-bold">Real-Time Updates</h3>
                <p className="text-muted-foreground">
                  Stay informed with instant notifications and smooth, Slack-inspired
                  communication between students and admins.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border text-left">
              <CardContent className="pt-6 space-y-4">
                <TrendingUp className="h-10 w-10" />
                <h3 className="text-xl font-bold">Visual Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Clear status indicators and progress bars show exactly where your
                  complaint stands, inspired by Trello's visual clarity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border text-left">
              <CardContent className="pt-6 space-y-4">
                <Sparkles className="h-10 w-10" />
                <h3 className="text-xl font-bold">AI-Powered Intelligence</h3>
                <p className="text-muted-foreground">
                  Automatic categorization, priority scoring, and smart reply suggestions
                  help resolve complaints faster and more effectively.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border text-left">
              <CardContent className="pt-6 space-y-4">
                <Shield className="h-10 w-10" />
                <h3 className="text-xl font-bold">Smart Triage</h3>
                <p className="text-muted-foreground">
                  Zendesk-inspired prioritization ensures urgent issues get immediate
                  attention while maintaining efficient workflow management.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-12 space-y-4">
            <h3 className="text-2xl font-bold">Ready to streamline your complaint management?</h3>
            <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8 font-semibold">
              Get Started Now
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Brototype Resolve. A minimalist approach to complaint management.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;