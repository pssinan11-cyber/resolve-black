import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, Eye, EyeOff } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid admin credentials");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Admin access granted");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background animate-gradient-shift bg-[length:200%_200%]" />
      <Card className="w-full max-w-md border-2 border-border animate-scale-in relative z-10 transition-transform duration-300">
        <CardHeader className="space-y-1 animate-fade-in">
          <div className="flex justify-center mb-2">
            <Shield className="h-12 w-12 animate-pulse-scale" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in with your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0ms" }}>
              <Label htmlFor="email" className="transition-all duration-200">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 transition-all duration-200 focus:scale-[1.02] focus:border-primary"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <Label htmlFor="password" className="transition-all duration-200">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2 transition-all duration-200 focus:scale-[1.02] focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 animate-slide-up" 
              style={{ animationDelay: "200ms" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Admin Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "300ms" }}>
            Admin accounts are created by system administrators
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
