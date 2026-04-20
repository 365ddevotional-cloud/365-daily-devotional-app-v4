import { z } from "zod";

export const BIBLE_TRANSLATIONS = ["KJV", "WEB", "ASV", "DRB"] as const;
export type BibleTranslation = typeof BIBLE_TRANSLATIONS[number];
export const bibleTranslationSchema = z.enum(BIBLE_TRANSLATIONS);

export interface BiblePassage {
  id?: number;
  reference: string;
  translation: string;
  content: string;
  createdAt?: string | Date | null;
}

export const insertBiblePassageSchema = z.object({
  reference: z.string(),
  translation: bibleTranslationSchema,
  content: z.string(),
});
export type InsertBiblePassage = z.infer<typeof insertBiblePassageSchema>;

export interface Devotional {
  id?: number;
  date: string;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  content: string;
  prayerPoints: string[];
  faithDeclarations: string[];
  author?: string | null;
  createdAt?: string | Date | null;
  isDeleted?: boolean | null;
  deletedAt?: string | Date | null;
  redLetterEnabled?: boolean | null;
  seasonalOverride?: boolean | null;
  christianQuotes?: string | null;
  propheticDeclaration?: string | null;
}

export const insertDevotionalSchema = z.object({
  date: z.string(),
  title: z.string(),
  scriptureReference: z.string(),
  scriptureText: z.string(),
  content: z.string(),
  prayerPoints: z.array(z.string()),
  faithDeclarations: z.array(z.string()),
  author: z.string().optional().default("Moses Afolabi"),
  redLetterEnabled: z.boolean().optional().default(true),
  seasonalOverride: z.boolean().optional().default(false),
  christianQuotes: z.string().nullable().optional(),
  propheticDeclaration: z.string().nullable().optional(),
});
export type InsertDevotional = z.infer<typeof insertDevotionalSchema>;
export type DevotionalResponse = Devotional;

export interface PrayerRequest {
  id?: number;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  smsEnabled?: boolean | null;
  subject?: string | null;
  message: string;
  isAnonymous?: boolean | null;
  priority?: string | null;
  category?: string | null;
  status?: string | null;
  isRead?: boolean | null;
  createdAt?: string | Date | null;
}

export interface ThreadMessage {
  id?: number;
  requestId: number;
  message: string;
  senderType: string;
  isRead?: boolean | null;
  readAt?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface PrayerAttachment {
  id?: number;
  requestId: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  objectPath: string;
  createdAt?: string | Date | null;
}

export interface AutoReplyTemplate {
  id?: number;
  templateType: string;
  encouragement: string;
  scriptureReference: string;
  scriptureText: string;
  prayer: string;
  updatedAt?: string | Date | null;
}

export interface SundaySchoolLesson {
  id?: number;
  title: string;
  date: string;
  scriptureReferences: string;
  scriptureText: string;
  lessonContent: string;
  discussionQuestions: string[];
  prayerFocus: string;
  weeklyAssignment: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Testimony {
  id?: number;
  requestId?: number | null;
  name?: string | null;
  country?: string | null;
  message: string;
  photoUrl?: string | null;
  isApproved?: boolean | null;
  createdAt?: string | Date | null;
}

export const INBOX_CATEGORIES = ["Prayer", "Counseling", "Scripture Question", "Support", "General"] as const;
export type InboxCategory = typeof INBOX_CATEGORIES[number];

export interface InboxThread {
  id?: number;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  status?: string;
  hasUnreadAdmin?: boolean;
  hasUnreadUser?: boolean;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InboxMessage {
  id?: number;
  threadId: number;
  senderType: string;
  message: string;
  deletedByUser?: boolean;
  deletedByAdmin?: boolean;
  createdAt?: string | Date | null;
}
