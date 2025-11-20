import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import ComplaintForm from "./ComplaintForm";
import ComplaintCard from "./ComplaintCard";

const StudentDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('complaints-changes')
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

      // Fetch complaints
      const { data: complaintsData, error } = await supabase
        .from("complaints")
        .select(`
          *,
          profiles:student_id(full_name),
          comments(count)
        `)
        .eq("student_id", user.id)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Brototype Resolve</h1>
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">My Complaints</h2>
          <Button 
            onClick={() => setShowForm(!showForm)}
            size="lg"
            className="font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Complaint
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-2 border-border">
            <CardHeader>
              <CardTitle>Submit a Complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintForm 
                onSuccess={() => {
                  setShowForm(false);
                  fetchData();
                }} 
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No complaints yet</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;