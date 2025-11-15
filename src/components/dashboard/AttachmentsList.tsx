import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Image as ImageIcon, ExternalLink, Paperclip } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { format } from "date-fns";

interface AttachmentsListProps {
  complaintId: string;
}

const AttachmentsList = ({ complaintId }: AttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, [complaintId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (fileUrl: string) => {
    return fileUrl;
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading attachments...</div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        <h3 className="font-semibold">Attachments ({attachments.length})</h3>
      </div>
      <div className="grid gap-3">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="border-2 hover:border-foreground transition-colors">
            <CardContent className="p-4">
              <a
                href={getFileUrl(attachment.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="flex-shrink-0">
                  {isImage(attachment.file_type) ? (
                    <div className="w-12 h-12 border-2 border-border rounded overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={getFileUrl(attachment.file_url)}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 border-2 border-border rounded flex items-center justify-center bg-muted">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:underline">
                    {attachment.file_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttachmentsList;
