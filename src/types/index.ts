/**
 * Type Definitions
 * 
 * Centralized type definitions for the application
 */

import { Database } from '@/integrations/supabase/types';

// Database table types
export type Complaint = Database['public']['Tables']['complaints']['Row'];
export type ComplaintInsert = Database['public']['Tables']['complaints']['Insert'];
export type ComplaintUpdate = Database['public']['Tables']['complaints']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SecurityLog = Database['public']['Tables']['security_logs']['Row'];
export type SuspiciousActivity = Database['public']['Tables']['suspicious_activities']['Row'];

// Enum types
export type AppRole = Database['public']['Enums']['app_role'];
export type ComplaintSeverity = Database['public']['Enums']['complaint_severity'];
export type ComplaintStatus = Database['public']['Enums']['complaint_status'];

// Extended types with relations
export interface ComplaintWithRelations extends Complaint {
  profiles?: Profile;
  comments?: Comment[];
  attachments?: Attachment[];
  ratings?: Rating[];
}

// Form types
export interface ComplaintFormData {
  title: string;
  description: string;
  severity: ComplaintSeverity;
  category?: string;
  attachments?: File[];
}

export interface CommentFormData {
  content: string;
  complaintId: string;
}

export interface RatingFormData {
  rating: number;
  feedback?: string;
  complaintId: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: Error;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// AI Feature types
export interface ClassificationResult {
  category: string;
  confidence: number;
  tags: string[];
}

export interface ReplyDraft {
  tone: 'formal' | 'friendly' | 'empathetic';
  content: string;
}

export interface ResolutionPrediction {
  predictedHours: number;
  slaLabel: string;
}

export interface PriorityScore {
  score: number;
  urgent: boolean;
}
