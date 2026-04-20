import { z } from "zod";
import { insertDevotionalSchema } from "./schema";

const notFound = z.object({ message: z.string() });
const validation = z.object({ message: z.string(), field: z.string().optional() });

export const api = {
  devotionals: {
    getToday: {
      method: "GET" as const,
      path: "/api/devotionals/today",
      responses: { 200: z.custom<any>(), 404: notFound },
    },
    getByDate: {
      method: "GET" as const,
      path: "/api/devotionals/date/:date",
      responses: { 200: z.custom<any>(), 404: notFound },
    },
    list: {
      method: "GET" as const,
      path: "/api/devotionals",
      responses: { 200: z.array(z.custom<any>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/devotionals",
      input: insertDevotionalSchema,
      responses: { 201: z.custom<any>(), 400: validation },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/devotionals/:id",
      responses: { 204: z.void(), 404: notFound },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/devotionals/:id",
      input: insertDevotionalSchema.partial(),
      responses: { 200: z.custom<any>(), 400: validation, 403: z.object({ message: z.string() }), 404: notFound },
    },
  },
  prayerRequests: {
    create: {
      method: "POST" as const,
      path: "/api/prayer-requests",
      responses: { 201: z.custom<any>(), 400: validation },
    },
    list: {
      method: "GET" as const,
      path: "/api/prayer-requests",
      responses: { 200: z.array(z.custom<any>()) },
    },
    getReplies: {
      method: "GET" as const,
      path: "/api/prayer-requests/:id/replies",
      responses: { 200: z.array(z.custom<any>()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/prayer-requests/:id",
      responses: { 200: z.custom<any>(), 404: notFound },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/prayer-requests/:id/status",
      responses: { 200: z.custom<any>(), 404: notFound },
    },
    getThread: {
      method: "GET" as const,
      path: "/api/prayer-requests/:id/thread",
      responses: { 200: z.array(z.custom<any>()) },
    },
    addThreadMessage: {
      method: "POST" as const,
      path: "/api/prayer-requests/:id/thread",
      responses: { 201: z.custom<any>(), 400: validation },
    },
  },
  autoReplyTemplates: {
    list: { method: "GET" as const, path: "/api/auto-reply-templates", responses: { 200: z.array(z.custom<any>()) } },
    get: { method: "GET" as const, path: "/api/auto-reply-templates/:type", responses: { 200: z.custom<any>(), 404: notFound } },
    upsert: { method: "POST" as const, path: "/api/auto-reply-templates", responses: { 200: z.custom<any>(), 400: validation } },
  },
  scripture: {
    get: {
      method: "GET" as const,
      path: "/api/scripture",
      input: z.object({ reference: z.string(), translation: z.string().optional().default("KJV") }),
      responses: { 200: z.custom<any>(), 404: notFound },
    },
  },
  sundaySchool: {
    list: { method: "GET" as const, path: "/api/sunday-school", responses: { 200: z.array(z.custom<any>()) } },
    get: { method: "GET" as const, path: "/api/sunday-school/:id", responses: { 200: z.custom<any>(), 404: notFound } },
    create: { method: "POST" as const, path: "/api/sunday-school", responses: { 201: z.custom<any>(), 400: validation } },
    update: { method: "PATCH" as const, path: "/api/sunday-school/:id", responses: { 200: z.custom<any>(), 404: notFound } },
    delete: { method: "DELETE" as const, path: "/api/sunday-school/:id", responses: { 204: z.void(), 404: notFound } },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
