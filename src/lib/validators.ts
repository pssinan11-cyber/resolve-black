/**
 * Input Validation Utilities
 * 
 * Centralized validation functions for form inputs
 */

import { z } from 'zod';
import { 
  MAX_FILE_SIZE, 
  ALLOWED_FILE_TYPES, 
  MAX_FILES_PER_COMPLAINT,
  MIN_PASSWORD_LENGTH 
} from './constants';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  .max(100, { message: 'Password must be less than 100 characters' });

/**
 * Full name validation schema
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Name must be at least 2 characters' })
  .max(100, { message: 'Name must be less than 100 characters' });

/**
 * Complaint title validation schema
 */
export const complaintTitleSchema = z
  .string()
  .trim()
  .min(5, { message: 'Title must be at least 5 characters' })
  .max(200, { message: 'Title must be less than 200 characters' });

/**
 * Complaint description validation schema
 */
export const complaintDescriptionSchema = z
  .string()
  .trim()
  .min(10, { message: 'Description must be at least 10 characters' })
  .max(2000, { message: 'Description must be less than 2000 characters' });

/**
 * Comment content validation schema
 */
export const commentContentSchema = z
  .string()
  .trim()
  .min(1, { message: 'Comment cannot be empty' })
  .max(1000, { message: 'Comment must be less than 1000 characters' });

/**
 * Rating validation schema
 */
export const ratingSchema = z
  .number()
  .int()
  .min(1, { message: 'Rating must be between 1 and 5' })
  .max(5, { message: 'Rating must be between 1 and 5' });

/**
 * Feedback validation schema
 */
export const feedbackSchema = z
  .string()
  .trim()
  .max(500, { message: 'Feedback must be less than 500 characters' })
  .optional();

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validate file type
 */
export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length > MAX_FILES_PER_COMPLAINT) {
    return {
      valid: false,
      error: `Maximum ${MAX_FILES_PER_COMPLAINT} files allowed`,
    };
  }

  for (const file of files) {
    if (!validateFileSize(file)) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    if (!validateFileType(file)) {
      return {
        valid: false,
        error: `File "${file.name}" has an unsupported type. Only images and PDFs are allowed.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize HTML content (prevent XSS)
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
