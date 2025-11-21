import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

interface AdminAnalyticsEnhancedProps {
  complaints: any[];
}

const COLORS = {
  primary: "#0A0A0A",
  secondary: "#404040",
  tertiary: "#808080",
  quaternary: "#BFBFBF",
  quinary: "#E0E0E0",
};

const AdminAnalyticsEnhanced = ({ complaints }: AdminAnalyticsEnhancedProps) => {
  // Calculate basic metrics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;

  // Calculate average resolution time
  const resolvedWithTime = complaints.filter(c => c.resolved_at && c.created_at);
  const avgResolutionHours = resolvedWithTime.length > 0
    ? resolvedWithTime.reduce((acc, c) => {
        const created = new Date(c.created_at).getTime();
        const resolved = new Date(c.resolved_at).getTime();
        return acc + (resolved - created) / (1000 * 60 * 60);
      }, 0) / resolvedWithTime.length
    : 0;

  // Complaints trend over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const count = complaints.filter(c => {
      const complaintDate = startOfDay(new Date(c.created_at));
      return complaintDate.getTime() === date.getTime();
    }).length;
    
    return {
      date: format(date, 'MMM dd'),
      complaints: count,
    };
  });

  // Complaints by severity
  const severityData = [
    { name: 'Low', value: complaints.filter(c => c.severity === 'low').length },
    { name: 'Medium', value: complaints.filter(c => c.severity === 'medium').length },
    { name: 'High', value: complaints.filter(c => c.severity === 'high').length },
    { name: 'Urgent', value: complaints.filter(c => c.severity === 'urgent').length },
  ].filter(item => item.value > 0);

  // Complaints by status
  const statusData = [
    { name: 'Pending', value: pendingComplaints },
    { name: 'In Progress', value: inProgressComplaints },
    { name: 'Resolved', value: resolvedComplaints },
  ].filter(item => item.value > 0);

  // Resolution time by category
  const categoryResolutionTime = complaints
    .filter(c => c.ai_category && c.resolved_at && c.created_at)
    .reduce((acc: any, c) => {
      const category = c.ai_category || 'Uncategorized';
      const hours = (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
      
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += hours;
      acc[category].count += 1;
      return acc;
    }, {});

  const categoryData = Object.keys(categoryResolutionTime).map(category => ({
    category: category.length > 15 ? category.substring(0, 15) + '...' : category,
    hours: Math.round(categoryResolutionTime[category].total / categoryResolutionTime[category].count),
  })).sort((a, b) => b.hours - a.hours).slice(0, 5);

  // Satisfaction scores (mock data - replace with real ratings when available)
  const satisfactionTrend = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'MMM dd'),
    score: 3.5 + Math.random() * 1.5, // Mock data
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              {resolvedComplaints} resolved ({Math.round((resolvedComplaints / totalComplaints) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgResolutionHours)}h</div>
            <p className="text-xs text-muted-foreground">
              Based on {resolvedWithTime.length} resolved complaints
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressComplaints} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              All time success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Complaints Trend */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Complaints Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="date" stroke="#404040" />
                <YAxis stroke="#404040" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFF', 
                    border: '2px solid #0A0A0A',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="complaints" 
                  stroke="#0A0A0A" 
                  strokeWidth={2}
                  dot={{ fill: '#0A0A0A', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Complaints by Severity */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Complaints by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFF', 
                    border: '2px solid #0A0A0A',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Time by Category */}
        {categoryData.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Avg Resolution Time by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="category" stroke="#404040" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#404040" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFF', 
                      border: '2px solid #0A0A0A',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="hours" fill="#0A0A0A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Current Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" stroke="#404040" />
                <YAxis dataKey="name" type="category" stroke="#404040" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFF', 
                    border: '2px solid #0A0A0A',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="#0A0A0A" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsEnhanced;
