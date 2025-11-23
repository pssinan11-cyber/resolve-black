import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/student-auth");
        return;
      }

      // Check if email is verified
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.email_confirmed_at) {
        toast.info("Please verify your email", {
          description: "You need to verify your email address before accessing the dashboard."
        });
        navigate("/verify-email");
        return;
      }

      // Server-side role validation
      try {
        const { data, error } = await supabase.functions.invoke('validate-role');
        
        if (error) {
          console.error("Role validation error:", error);
          setLoading(false);
          return;
        }

        if (data?.role) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Failed to validate role:", error);
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/student-auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {userRole === "admin" ? <AdminDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default Dashboard;