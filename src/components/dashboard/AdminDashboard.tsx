import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, AlertTriangle, Volume2, VolumeX, Settings2 } from "lucide-react";
import { toast } from "sonner";
import AdminComplaintCard from "./AdminComplaintCard";
import AdminAnalyticsEnhanced from "./AdminAnalyticsEnhanced";
import { SecurityLogs } from "./SecurityLogs";
import SuspiciousActivities from "./SuspiciousActivities";
import { useNotificationSound } from "@/hooks/useNotificationSound";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('adminSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { playSound } = useNotificationSound();

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates for complaints
    const complaintsChannel = supabase
      .channel('admin-complaints-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints'
        },
        async (payload) => {
          const newComplaint = payload.new;
          
          // Fetch student name for the notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newComplaint.student_id)
            .single();
          
          const severityEmoji = {
            urgent: '🚨',
            high: '⚠️',
            medium: '📋',
            low: 'ℹ️'
          };
          
          // Play sound based on severity
          if (soundEnabled) {
            if (newComplaint.severity === 'urgent') {
              playSound('urgent');
            } else if (newComplaint.severity === 'high') {
              playSound('high');
            } else {
              playSound('info');
            }
          }
          
          toast.info(
            `${severityEmoji[newComplaint.severity]} New ${newComplaint.severity} complaint from ${profile?.full_name || 'Student'}`,
            { duration: 5000 }
          );
          
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          const updatedComplaint = payload.new;
          const oldComplaint = payload.old;
          
          // Show notification for severity escalation
          if (updatedComplaint.severity === 'urgent' && oldComplaint.severity !== 'urgent') {
            if (soundEnabled) {
              playSound('urgent');
            }
            toast.warning(
              `🚨 Complaint escalated to URGENT: "${updatedComplaint.title}"`,
              { duration: 5000 }
            );
          }
          
          fetchData();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for comments
    const commentsChannel = supabase
      .channel('admin-comments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          const newComment = payload.new;
          
          // Only notify about student comments (not admin replies)
          if (!newComment.is_admin_reply) {
            const { data: complaint } = await supabase
              .from('complaints')
              .select('title, severity')
              .eq('id', newComment.complaint_id)
              .single();
            
            if (soundEnabled && complaint?.severity === 'urgent') {
              playSound('high');
            } else if (soundEnabled) {
              playSound('info');
            }
            
            toast.info(
              `💬 New student comment on: "${complaint?.title || 'a complaint'}"`,
              { duration: 5000 }
            );
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(commentsChannel);
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

      // Fetch all complaints with student profiles
      const { data: complaintsData, error } = await supabase
        .from("complaints")
        .select("*")
        .order("priority_score", { ascending: false })
        .order("created_at", { ascending: false });
      
      // Fetch student profiles separately
      if (complaintsData && complaintsData.length > 0) {
        const studentIds = [...new Set(complaintsData.map(c => c.student_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);
        
        // Merge profiles into complaints
        if (profiles) {
          complaintsData.forEach(complaint => {
            const profile = profiles.find(p => p.id === complaint.student_id);
            if (profile) {
              (complaint as any).student_name = profile.full_name;
            }
          });
        }
      }

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

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('adminSoundEnabled', JSON.stringify(newValue));
    toast.success(newValue ? "🔔 Sound notifications enabled" : "🔕 Sound notifications disabled");
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/settings'}
              className="border-2"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleSound}
              className="border-2"
              title={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AdminAnalyticsEnhanced complaints={complaints} />

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