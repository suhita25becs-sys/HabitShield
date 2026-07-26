import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scanEventsTable = pgTable("scan_events", {
  id: serial("id").primaryKey(),
  scanType: text("scan_type").notNull(), // "screenshot" | "file" | "sms"
  filename: text("filename"),
  threatDetected: boolean("threat_detected").notNull().default(false),
  summary: text("summary").notNull(),
  // Screenshot-specific
  findings: text("findings"), // JSON array of { type, value }
  // File-specific
  sha256: text("sha256"),
  fileSize: integer("file_size"),
  // SMS-specific
  verdict: text("verdict"), // "safe" | "scam" | "suspicious"
  triggers: text("triggers"), // JSON array of strings
  messagePreview: text("message_preview"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScanEventSchema = createInsertSchema(scanEventsTable).omit({ id: true, scannedAt: true });
export type InsertScanEvent = z.infer<typeof insertScanEventSchema>;
export type ScanEvent = typeof scanEventsTable.$inferSelect;
