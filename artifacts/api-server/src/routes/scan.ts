import { Router, type IRouter } from "express";
import multer from "multer";
import crypto from "crypto";
import {
  ScanSmsBody,
  GetScanHistoryQueryParams,
  GetScanHistoryResponse,
  GetScanStatsResponse,
} from "@workspace/api-zod";
import { db, scanEventsTable } from "@workspace/db";
import { desc, eq, count, and, sql } from "drizzle-orm";

const router: IRouter = Router();

// Store uploads in memory (no disk I/O needed)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Patterns for PII detection ───────────────────────────────────────────────
const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: "Email", pattern: /[\w.+\-]+@[\w.\-]+\.\w{2,}/g },
  { type: "Phone (IN)", pattern: /\b[6-9]\d{9}\b/g },
  { type: "Phone (US)", pattern: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g },
  { type: "Credit Card", pattern: /\b(?:\d[ -]?){13,19}\b/g },
];

const SMS_SCAM_KEYWORDS = [
  "otp", "verify", "urgent", "blocked", "click here", "claim now",
  "won", "prize", "lottery", "account suspended", "confirm your",
  "update your", "verify your", "bank", "credit card", "password",
  "pin", "cvv", "aadhar", "pan", "ssn", "social security",
];

const SMS_SUSPICIOUS_KEYWORDS = [
  "free", "offer", "limited", "hurry", "act now", "deal",
  "discount", "coupon", "cash", "reward", "gift",
];

// ─── POST /scan/screenshot ─────────────────────────────────────────────────────
router.post("/scan/screenshot", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const filename = req.file.originalname || "upload.png";

  // Run regex-based PII detection on any text we can extract from the buffer.
  // For a production app this would use Tesseract OCR; here we detect patterns
  // in any embedded ASCII/UTF-8 text within the binary (covers text-layer PDFs,
  // screenshots with embedded metadata, etc.).
  const text = req.file.buffer.toString("latin1");
  const findings: { type: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const { type, pattern } of PII_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      const key = `${type}:${match}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({ type, value: match });
      }
    }
  }

  const threatDetected = findings.length > 0;
  const summary = threatDetected
    ? `Detected ${findings.length} sensitive item(s): ${[...new Set(findings.map((f) => f.type))].join(", ")}`
    : "No sensitive data detected";

  const [event] = await db
    .insert(scanEventsTable)
    .values({
      scanType: "screenshot",
      filename,
      threatDetected,
      summary,
      findings: JSON.stringify(findings),
    })
    .returning();

  res.json({
    id: String(event.id),
    scanType: event.scanType,
    filename: event.filename ?? filename,
    findings,
    threatDetected,
    scannedAt: event.scannedAt.toISOString(),
  });
});

// ─── POST /scan/file ───────────────────────────────────────────────────────────
router.post("/scan/file", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const filename = req.file.originalname || "upload";
  const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const fileSize = req.file.size;

  const [event] = await db
    .insert(scanEventsTable)
    .values({
      scanType: "file",
      filename,
      threatDetected: false,
      summary: `SHA-256: ${hash.slice(0, 16)}…`,
      sha256: hash,
      fileSize,
    })
    .returning();

  res.json({
    id: String(event.id),
    scanType: event.scanType,
    filename: event.filename ?? filename,
    sha256: hash,
    fileSize,
    scannedAt: event.scannedAt.toISOString(),
  });
});

// ─── POST /scan/sms ────────────────────────────────────────────────────────────
router.post("/scan/sms", async (req, res): Promise<void> => {
  const parsed = ScanSmsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message } = parsed.data;
  const lower = message.toLowerCase();

  const triggeredScam = SMS_SCAM_KEYWORDS.filter((k) => lower.includes(k));
  const triggeredSuspicious = SMS_SUSPICIOUS_KEYWORDS.filter((k) => lower.includes(k));

  let verdict: "safe" | "scam" | "suspicious";
  let threatDetected: boolean;
  let triggers: string[];

  if (triggeredScam.length > 0) {
    verdict = "scam";
    threatDetected = true;
    triggers = triggeredScam;
  } else if (triggeredSuspicious.length > 0) {
    verdict = "suspicious";
    threatDetected = false;
    triggers = triggeredSuspicious;
  } else {
    verdict = "safe";
    threatDetected = false;
    triggers = [];
  }

  const messagePreview = message.length > 120 ? message.slice(0, 120) + "…" : message;
  const summary = `${verdict.charAt(0).toUpperCase() + verdict.slice(1)}: ${
    triggers.length > 0 ? `triggered on "${triggers.slice(0, 3).join('", "')}"` : "no threats detected"
  }`;

  const [event] = await db
    .insert(scanEventsTable)
    .values({
      scanType: "sms",
      filename: null,
      threatDetected,
      summary,
      verdict,
      triggers: JSON.stringify(triggers),
      messagePreview,
    })
    .returning();

  res.json({
    id: String(event.id),
    scanType: event.scanType,
    threatDetected,
    verdict,
    triggers,
    messagePreview,
    scannedAt: event.scannedAt.toISOString(),
  });
});

// ─── GET /scan/history ─────────────────────────────────────────────────────────
router.get("/scan/history", async (req, res): Promise<void> => {
  const params = GetScanHistoryQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const events = await db
    .select()
    .from(scanEventsTable)
    .orderBy(desc(scanEventsTable.scannedAt))
    .limit(limit);

  const result = events.map((e) => ({
    id: String(e.id),
    scanType: e.scanType,
    filename: e.filename ?? null,
    threatDetected: e.threatDetected,
    summary: e.summary,
    scannedAt: e.scannedAt.toISOString(),
  }));

  res.json(GetScanHistoryResponse.parse(result));
});

// ─── GET /scan/stats ───────────────────────────────────────────────────────────
router.get("/scan/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      scanType: scanEventsTable.scanType,
      total: count(),
      threats: sql<number>`sum(case when ${scanEventsTable.threatDetected} then 1 else 0 end)`,
    })
    .from(scanEventsTable)
    .groupBy(scanEventsTable.scanType);

  let totalScans = 0;
  let threatsFound = 0;
  let screenshotScans = 0;
  let fileScans = 0;
  let smsScans = 0;

  for (const row of rows) {
    totalScans += Number(row.total);
    threatsFound += Number(row.threats);
    if (row.scanType === "screenshot") screenshotScans = Number(row.total);
    if (row.scanType === "file") fileScans = Number(row.total);
    if (row.scanType === "sms") smsScans = Number(row.total);
  }

  const cleanScans = totalScans - threatsFound;

  res.json(
    GetScanStatsResponse.parse({
      totalScans,
      threatsFound,
      screenshotScans,
      fileScans,
      smsScans,
      cleanScans,
    })
  );
});

export default router;
