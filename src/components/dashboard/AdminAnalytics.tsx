import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, TrendingUp, Star } from "lucide-react";

interface AdminAnalyticsProps {
  complaints: any[];
}

const AdminAnalytics = ({ complaints }: AdminAnalyticsProps) => {
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === "resolved"
  ).length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const inProgressComplaints = complaints.filter((c) => c.status === "in_progress").length;

  const resolvedWithTime = complaints.filter(
    (c) => c.status === "resolved" && c.resolved_at
  );

  const avgResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, c) => {
          const created = new Date(c.created_at).getTime();
          const resolved = new Date(c.resolved_at).getTime();
          return acc + (resolved - created) / (1000 * 60 * 60);
        }, 0) / resolvedWithTime.length
      : 0;

  const categoryCounts = complaints.reduce((acc, c) => {
    if (c.ai_category) {
      acc[c.ai_category] = (acc[c.ai_category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalComplaints}</div>
          <p className="text-xs text-muted-foreground">
            {pendingComplaints} pending, {inProgressComplaints} in progress
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resolvedComplaints}</div>
          <p className="text-xs text-muted-foreground">
            {totalComplaints > 0
              ? Math.round((resolvedComplaints / totalComplaints) * 100)
              : 0}
            % resolution rate
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgResolutionTime > 0 ? Math.round(avgResolutionTime) : "N/A"}
            {avgResolutionTime > 0 && "h"}
          </div>
          <p className="text-xs text-muted-foreground">Average time to resolve</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topCategory ? String(topCategory[1]) : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCategory ? String(topCategory[0]) : "No categories yet"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;