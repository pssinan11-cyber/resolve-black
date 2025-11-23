import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BatchCreateUsers } from "@/components/dashboard/BatchCreateUsers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Users, BarChart3, Settings2, Shield, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "admin";
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalAdmins: number;
  totalStudents: number;
}

const AdminSettings = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin-auth");
      return;
    }

    // Validate admin role
    const { data, error } = await supabase.functions.invoke('validate-role');
    
    if (error || data?.role !== 'admin') {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    setUserRole(data.role);
    await Promise.all([fetchUsers(), fetchStats()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      // Get all profiles with their auth emails
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch auth users to get emails (admin only operation)
      const authUsersResponse = await supabase.auth.admin.listUsers();
      const authUsers = authUsersResponse.data.users || [];

      // Combine the data
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const authUser = authUsers?.find(u => u.id === profile.id);
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: authUser?.email || 'Unknown',
          role: userRole?.role || 'student',
          created_at: profile.created_at
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    }
  };

  const fetchStats = async () => {
    try {
      const [usersCount, complaintsCount, pendingCount, resolvedCount, adminsCount, studentsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'student'),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalComplaints: complaintsCount.count || 0,
        pendingComplaints: pendingCount.count || 0,
        resolvedComplaints: resolvedCount.count || 0,
        totalAdmins: adminsCount.count || 0,
        totalStudents: studentsCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error("Failed to load statistics");
    }
  };

  const handleRoleChange = async (userId: string, newRole: "student" | "admin") => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Admin Settings</h1>
              <p className="text-muted-foreground mt-1">Manage users, view statistics, and configure system settings</p>
            </div>
          </div>
          <Badge variant="outline" className="h-8">
            <Shield className="h-3 w-3 mr-1" />
            Administrator
          </Badge>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                  View all users and manage their roles. Changes take effect immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Member Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {user.full_name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : null}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: "student" | "admin") => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalAdmins || 0} admins, {stats?.totalStudents || 0} students
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalComplaints || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.pendingComplaints || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.resolvedComplaints || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalAdmins || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">System administrators</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats?.totalComplaints 
                      ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Complaints resolved</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <BatchCreateUsers />
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Configuration Options</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Additional configuration options will be available here. This section can be expanded to include
                    email templates, notification settings, security policies, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;
