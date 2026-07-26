import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetScanHistoryQueryKey, getGetScanStatsQueryKey } from "@workspace/api-client-react";
import { Image, Upload, AlertTriangle, CheckCircle, Mail, Phone, CreditCard, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Finding = { type: string; value: string };
type ScanResult = {
  id: string; scanType: string; filename: string;
  findings: Finding[]; threatDetected: boolean; scannedAt: string;
};

const FINDING_ICONS: Record<string, typeof Mail> = {
  Email: Mail,
  "Phone (IN)": Phone,
  "Phone (US)": Phone,
  "Credit Card": CreditCard,
};

export default function ScreenshotScanner() {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE}/api/scan/screenshot`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || "Scan failed");
      }
      const data: ScanResult = await res.json();
      setResult(data);
      queryClient.invalidateQueries({ queryKey: getGetScanHistoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetScanStatsQueryKey() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Screenshot Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload an image to detect sensitive data — emails, phone numbers, and credit card patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <div className="space-y-4">
          <div
            data-testid="screenshot-dropzone"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
              ${dragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}
              ${file ? "cursor-default" : ""}`}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} data-testid="screenshot-input" />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full rounded-xl object-contain max-h-64" />
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  data-testid="screenshot-remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <Image className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Drop your screenshot here</p>
                <p className="text-xs text-muted-foreground">or click to browse — PNG, JPG, BMP supported</p>
              </div>
            )}
          </div>

          {file && (
            <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Image className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={!file || loading}
            className="w-full h-11 font-semibold"
            data-testid="screenshot-scan-btn"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Scan for Sensitive Data</>
            )}
          </Button>

          {/* How it works */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Detected Patterns</h3>
            <div className="space-y-2">
              {[
                { icon: Mail, label: "Email addresses" },
                { icon: Phone, label: "Phone numbers (IN & US)" },
                { icon: CreditCard, label: "Credit card numbers" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Scan Results</h2>
          </div>

          <div className="flex-1 p-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDelay: "0.2s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Scanning for sensitive data...</p>
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-3">
                  <Image className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">Upload and scan an image to see results</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Verdict */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  result.threatDetected
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-green-500/10 border-green-500/30"
                }`}>
                  {result.threatDetected ? (
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${result.threatDetected ? "text-destructive" : "text-green-400"}`}>
                      {result.threatDetected ? "Sensitive Data Detected" : "No Sensitive Data Found"}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.filename}</p>
                  </div>
                </div>

                {/* Findings */}
                {result.findings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {result.findings.length} finding{result.findings.length !== 1 ? "s" : ""}
                    </p>
                    {result.findings.map((f, i) => {
                      const Icon = FINDING_ICONS[f.type] ?? AlertTriangle;
                      return (
                        <div key={i} data-testid={`finding-${i}`} className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <Icon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/70">{f.type}</p>
                            <p className="text-xs font-mono text-foreground break-all">{f.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
