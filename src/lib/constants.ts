/**
 * Application Constants
 * 
 * Centralized configuration and constant values
 */

// App metadata
export const APP_NAME = 'Brototype Resolve';
export const APP_DESCRIPTION = 'Minimalist complaint management system';

// File upload constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILES_PER_COMPLAINT = 3;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Timeouts and intervals
export const API_TIMEOUT = 30000; // 30 seconds
export const REFETCH_INTERVAL = 30000; // 30 seconds
export const TOAST_DURATION = 5000; // 5 seconds

// Security
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Complaint severity levels
export const SEVERITY_LEVELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
} as const;

// Complaint status values
export const STATUS_VALUES = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
} as const;

// Color mappings for severity (for badges, not backgrounds)
export const SEVERITY_VARIANTS = {
  low: 'secondary',
  medium: 'default',
  high: 'default',
  urgent: 'destructive',
} as const;

// Status color mappings
export const STATUS_VARIANTS = {
  pending: 'secondary',
  in_progress: 'default',
  resolved: 'default',
  closed: 'secondary',
} as const;

// Routes
export const ROUTES = {
  home: '/',
  studentAuth: '/student-auth',
  adminAuth: '/admin-auth',
  dashboard: '/dashboard',
  notFound: '*',
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  attachments: 'complaint-attachments',
} as const;

// Edge function names
export const EDGE_FUNCTIONS = {
  classifyComplaint: 'classify-complaint',
  generateReply: 'generate-reply',
  validateRole: 'validate-role',
} as const;

// Analytics
export const ANALYTICS_EVENTS = {
  complaintSubmitted: 'complaint_submitted',
  complaintResolved: 'complaint_resolved',
  commentAdded: 'comment_added',
  ratingSubmitted: 'rating_submitted',
  suspiciousActivityDetected: 'suspicious_activity_detected',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  generic: 'An unexpected error occurred. Please try again.',
  network: 'Network error. Please check your connection.',
  authentication: 'Authentication failed. Please try logging in again.',
  authorization: 'You do not have permission to perform this action.',
  validation: 'Please check your input and try again.',
  fileUpload: 'File upload failed. Please try again.',
  fileSizeExceeded: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  fileTypeNotAllowed: 'File type not allowed. Only images and PDFs are supported.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  complaintSubmitted: 'Complaint submitted successfully!',
  complaintUpdated: 'Complaint updated successfully!',
  complaintResolved: 'Complaint marked as resolved!',
  commentAdded: 'Comment added successfully!',
  ratingSubmitted: 'Thank you for your feedback!',
  login: 'Logged in successfully!',
  logout: 'Logged out successfully!',
  signup: 'Account created successfully!',
} as const;
