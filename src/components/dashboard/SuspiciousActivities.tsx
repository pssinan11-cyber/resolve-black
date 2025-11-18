import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

interface SuspiciousActivity {
  id: string;
  activity_type: string;
  severity: string;
  user_id: string | null;
  ip_address: string | null;
  event_count: number;
  time_window_start: string;
  time_window_end: string;
  detection_time: string;
  resolved: boolean;
  resolved_at: string | null;
  details: any;
}

const SuspiciousActivities = () => {
  const [detecting, setDetecting] = useState(false);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["suspicious-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suspicious_activities")
        .select("*")
        .order("detection_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SuspiciousActivity[];
    },
    refetchInterval: 30000,
  });

  const handleManualDetection = async () => {
    setDetecting(true);
    try {
      const { error } = await supabase.rpc("detect_suspicious_activity");
      
      if (error) throw error;
      
      toast.success("Detection completed");
      refetch();
    } catch (error: any) {
      console.error("Detection error:", error);
      toast.error("Failed to run detection: " + error.message);
    } finally {
      setDetecting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("suspicious_activities")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Activity marked as resolved");
      refetch();
    } catch (error: any) {
      console.error("Resolve error:", error);
      toast.error("Failed to resolve: " + error.message);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "brute_force_ip":
        return "Brute Force (IP)";
      case "brute_force_user":
        return "Brute Force (User)";
      case "privilege_escalation":
        return "Privilege Escalation";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Suspicious Activities</CardTitle>
        </div>
        <Button
          onClick={handleManualDetection}
          disabled={detecting}
          size="sm"
          variant="outline"
          className="border-2"
        >
          {detecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Detection
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No suspicious activities detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`border-2 rounded-lg p-4 space-y-3 ${
                  activity.resolved ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {getActivityTypeLabel(activity.activity_type)}
                        </span>
                        <Badge variant={getSeverityColor(activity.severity) as any}>
                          {activity.severity}
                        </Badge>
                        {activity.resolved && (
                          <Badge variant="secondary">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.event_count} events detected{" "}
                        {formatDistanceToNow(new Date(activity.detection_time), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {!activity.resolved && (
                    <Button
                      onClick={() => handleResolve(activity.id)}
                      size="sm"
                      variant="outline"
                      className="border-2"
                    >
                      Resolve
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {activity.ip_address && (
                    <div>
                      <span className="text-muted-foreground">IP Address:</span>
                      <p className="font-mono">{activity.ip_address}</p>
                    </div>
                  )}
                  {activity.user_id && (
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <p className="font-mono text-xs">{activity.user_id}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Time Window:</span>
                    <p>
                      {formatDistanceToNow(
                        new Date(activity.time_window_start)
                      )}{" "}
                      ago
                    </p>
                  </div>
                </div>

                {activity.details && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm font-mono overflow-x-auto">
                    <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuspiciousActivities;
