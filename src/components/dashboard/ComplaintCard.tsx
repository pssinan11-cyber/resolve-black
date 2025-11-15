import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import ComplaintDetails from "./ComplaintDetails";

interface ComplaintCardProps {
  complaint: any;
}

const statusProgress: Record<string, number> = {
  pending: 25,
  in_progress: 50,
  resolved: 75,
  closed: 100,
};

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const ComplaintCard = ({ complaint }: ComplaintCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getSeverityClass = (severity: string) => {
    const classes: Record<string, string> = {
      low: "bg-severity-low",
      medium: "bg-severity-medium",
      high: "bg-severity-high",
      urgent: "bg-severity-urgent text-white",
    };
    return classes[severity] || classes.medium;
  };

  if (showDetails) {
    return <ComplaintDetails complaint={complaint} onBack={() => setShowDetails(false)} />;
  }

  return (
    <Card className="border-2 border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{complaint.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {complaint.description}
            </p>
          </div>
          <Badge className={getSeverityClass(complaint.severity)}>
            {complaint.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Status: {statusLabels[complaint.status]}</span>
            <span className="text-muted-foreground">{statusProgress[complaint.status]}%</span>
          </div>
          <Progress value={statusProgress[complaint.status]} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
          </div>
          {complaint.comments && complaint.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{complaint.comments[0].count} comments</span>
            </div>
          )}
          {complaint.ai_category && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>{complaint.ai_category}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => setShowDetails(true)} 
          variant="outline" 
          className="w-full border-2"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComplaintCard;