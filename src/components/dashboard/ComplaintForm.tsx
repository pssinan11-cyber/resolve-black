import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description too long"),
  severity: z.enum(["low", "medium", "high", "urgent"]),
});

interface ComplaintFormProps {
  onSuccess: () => void;
}

const ComplaintForm = ({ onSuccess }: ComplaintFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILES = 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFileError("");

    if (selectedFiles.length + files.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP, and PDF allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFileError("");
  };

  const uploadFiles = async (complaintId: string, userId: string) => {
    const uploadPromises = selectedFiles.map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${complaintId}/${fileName}`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from("complaint-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store file path (not URL) for signed URL generation
      // Create attachment record
      const { error: dbError } = await supabase
        .from("attachments")
        .insert({
          complaint_id: complaintId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: filePath, // Store path instead of URL
          uploaded_by: userId,
        });

      if (dbError) throw dbError;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      complaintSchema.parse({ title, description, severity });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call AI classification function
      const { data: aiData } = await supabase.functions.invoke("classify-complaint", {
        body: { title, description, severity },
      });

      // Insert complaint
      const { data: complaintData, error } = await supabase
        .from("complaints")
        .insert([{
          student_id: user.id,
          title,
          description,
          severity: severity as "low" | "medium" | "high" | "urgent",
          ai_category: aiData?.category,
          ai_confidence: aiData?.confidence,
          ai_tags: aiData?.tags,
          priority_score: aiData?.priority_score || 0,
          predicted_hours: aiData?.predicted_hours,
        }])
        .select()
        .single();

      if (error) throw error;

      // Upload files if any
      if (selectedFiles.length > 0 && complaintData) {
        try {
          await uploadFiles(complaintData.id, user.id);
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          toast.error("Complaint created but some files failed to upload");
        }
      }

      toast.success("Complaint submitted successfully!");
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setSelectedFiles([]);
      setFileError("");
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to submit complaint");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide detailed information about your complaint..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="border-2 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="severity">Severity</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Minor inconvenience</SelectItem>
            <SelectItem value="medium">Medium - Notable issue</SelectItem>
            <SelectItem value="high">High - Significant problem</SelectItem>
            <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">Attachments (Optional)</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              id="attachments"
              type="file"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("attachments")?.click()}
              disabled={selectedFiles.length >= MAX_FILES}
              className="border-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length}/{MAX_FILES} files • Max 5MB each
            </span>
          </div>
          
          {fileError && (
            <p className="text-sm text-destructive">{fileError}</p>
          )}

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, WEBP, PDF
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full font-semibold">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyzing & Submitting...
          </>
        ) : (
          "Submit Complaint"
        )}
      </Button>
    </form>
  );
};

export default ComplaintForm;