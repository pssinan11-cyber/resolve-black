import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";

const VerifyEmail = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/student-auth");
        return;
      }

      // If email is already confirmed, redirect to dashboard
      if (user.email_confirmed_at) {
        navigate("/dashboard");
        return;
      }

      setEmail(user.email || null);
      
      // Set expiry time to 24 hours from user creation
      if (user.created_at) {
        const createdAt = new Date(user.created_at);
        const expiry = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        setExpiryTime(expiry);
      }
    };

    checkUser();

    // Listen for auth state changes (e.g., when email is verified)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success("Email verified successfully!");
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (!expiryTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  const handleResendEmail = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/student-auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background animate-gradient-shift bg-[length:200%_200%]" />
      <Card className="w-full max-w-md border-2 border-border animate-scale-in relative z-10">
        <CardHeader className="space-y-1 animate-fade-in text-center">
          <div className="flex justify-center mb-2">
            <Mail className="h-12 w-12 animate-pulse-scale" />
          </div>
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to
          </CardDescription>
          <p className="text-sm font-medium text-foreground">{email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Please check your inbox and click the verification link to activate your account.
            </p>
            {timeRemaining && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Link expires in:</p>
                <p className={`text-lg font-mono font-semibold ${
                  timeRemaining === "Expired" ? "text-destructive" : "text-foreground"
                }`}>
                  {timeRemaining}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResendEmail}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-4 border-t">
            <p>Didn't receive the email? Check your spam folder.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
