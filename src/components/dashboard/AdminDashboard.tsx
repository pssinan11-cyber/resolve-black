import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import AdminComplaintCard from "./AdminComplaintCard";
import AdminAnalytics from "./AdminAnalytics";
import { SecurityLogs } from "./SecurityLogs";
import SuspiciousActivities from "./SuspiciousActivities";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch all complaints
      const { data: complaintsData, error } = await supabase
        .from("complaints")
        .select(`
          *,
          profiles:student_id(full_name),
          comments(count)
        `)
        .order("priority_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(complaintsData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const urgentComplaints = complaints.filter(c => c.severity === 'urgent' && c.status !== 'resolved' && c.status !== 'closed');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Brototype Resolve Admin</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AdminAnalytics complaints={complaints} />

        <div className="my-8">
          <SecurityLogs />
        </div>

        <div className="my-8">
          <SuspiciousActivities />
        </div>

        {urgentComplaints.length > 0 && (
          <Card className="mb-8 border-2 border-foreground bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Urgent Complaints ({urgentComplaints.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentComplaints.map((complaint) => (
                <AdminComplaintCard 
                  key={complaint.id} 
                  complaint={complaint}
                  onUpdate={fetchData}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <h2 className="text-3xl font-bold mb-6">All Complaints</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No complaints to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <AdminComplaintCard 
                key={complaint.id} 
                complaint={complaint}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;