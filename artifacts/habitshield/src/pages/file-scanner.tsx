import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetScanHistoryQueryKey, getGetScanStatsQueryKey } from "@workspace/api-client-react";
import { FileText, Upload, CheckCircle, Copy, Check, X, Loader2, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileScanResult = {
  id: string; scanType: string; filename: string;
  sha256: string; fileSize: number; scannedAt: string;
};

export default function FileScanner() {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FileScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
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
      const res = await fetch(`${BASE}/api/scan/file`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || "Scan failed");
      }
      const data: FileScanResult = await res.json();
      setResult(data);
      queryClient.invalidateQueries({ queryKey: getGetScanHistoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetScanStatsQueryKey() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const copyHash = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">File Hash Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">Compute the SHA-256 cryptographic hash of any file to verify integrity and detect tampering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <div
            data-testid="file-dropzone"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer min-h-[200px] flex items-center justify-center
              ${dragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}
              ${file ? "cursor-default" : ""}`}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={onInputChange} data-testid="file-input" />

            {file ? (
              <div className="w-full px-6 py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    data-testid="file-remove"
                  >
                    <X className="w-3 h-3" /> Remove file
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <HardDrive className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Drop any file here</p>
                <p className="text-xs text-muted-foreground">or click to browse — up to 10 MB</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleScan}
            disabled={!file || loading}
            className="w-full h-11 font-semibold"
            data-testid="file-scan-btn"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Computing Hash...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Compute SHA-256 Hash</>
            )}
          </Button>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">About SHA-256</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SHA-256 is a cryptographic hash function that produces a unique 256-bit fingerprint for any file.
              Even a single changed byte produces a completely different hash — making it ideal for verifying
              file integrity and detecting tampering.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Hash Result</h2>
          </div>

          <div className="flex-1 p-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <Upload className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Computing SHA-256...</p>
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-3">
                  <HardDrive className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">Upload a file to compute its hash</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-400">Hash Computed Successfully</p>
                    <p className="text-xs text-muted-foreground">{result.filename} — {formatBytes(result.fileSize)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SHA-256 Hash</p>
                    <button
                      onClick={copyHash}
                      data-testid="copy-hash-btn"
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {copied ? (
                        <><Check className="w-3 h-3" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3">
                    <p data-testid="sha256-value" className="text-xs font-mono text-foreground break-all leading-relaxed">{result.sha256}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">File Size</p>
                    <p className="text-sm font-semibold text-foreground">{formatBytes(result.fileSize)}</p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Algorithm</p>
                    <p className="text-sm font-semibold text-foreground">SHA-256</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
