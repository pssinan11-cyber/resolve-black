import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
});

const StudentAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
    if (/\d/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    
    if (score < 40) return { strength: 'weak', score };
    if (score < 75) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

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
      const validationData = isLogin 
        ? { email, password }
        : { email, password, fullName };
      
      authSchema.parse(validationData);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully!");
        }
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
          <CardTitle className="text-3xl font-bold text-center">Student Portal</CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Sign in to your student account" : "Create a new student account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0ms" }}>
                <Label htmlFor="fullName" className="transition-all duration-200">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="border-2 transition-all duration-200 focus:scale-[1.02] focus:border-primary"
                />
              </div>
            )}
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isLogin ? "0ms" : "100ms" }}>
              <Label htmlFor="email" className="transition-all duration-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 transition-all duration-200 focus:scale-[1.02] focus:border-primary"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isLogin ? "100ms" : "200ms" }}>
              <Label htmlFor="password" className="transition-all duration-200">Password</Label>
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
              {!isLogin && password && passwordStrength && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium transition-all duration-300 ${
                      passwordStrength.strength === 'weak' ? 'text-muted-foreground' :
                      passwordStrength.strength === 'medium' ? 'text-foreground/70' :
                      'text-foreground'
                    }`}>
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${
                        passwordStrength.strength === 'weak' ? 'bg-foreground/30' :
                        passwordStrength.strength === 'medium' ? 'bg-foreground/60' :
                        'bg-foreground'
                      }`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  {passwordStrength.strength === 'weak' && (
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with mixed case, numbers & symbols
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 animate-slide-up" 
              style={{ animationDelay: isLogin ? "200ms" : "300ms" }}
              disabled={loading}
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>
          <div className="mt-4 text-center animate-fade-in" style={{ animationDelay: isLogin ? "300ms" : "400ms" }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 underline hover:scale-105 inline-block"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAuth;
