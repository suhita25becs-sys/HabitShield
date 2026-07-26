import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useScanSms, getGetScanHistoryQueryKey, getGetScanStatsQueryKey } from "@workspace/api-client-react";
import { MessageSquare, AlertTriangle, CheckCircle, AlertCircle, Tag, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_MESSAGES = [
  "Your account has been blocked. Verify your OTP immediately to avoid suspension.",
  "Congratulations! You have won a prize. Click here to claim now.",
  "Hey, are you coming to the meeting tomorrow at 3pm?",
  "URGENT: Your bank account has been suspended. Update your details at this link.",
];

export default function SmsScanner() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scanMutation = useScanSms();

  const handleScan = () => {
    if (!message.trim()) return;
    scanMutation.mutate(
      { data: { message } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetScanHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetScanStatsQueryKey() });
        },
      }
    );
  };

  const result = scanMutation.data;
  const loading = scanMutation.isPending;
  const error = scanMutation.error;

  const verdictConfig = {
    safe: {
      icon: CheckCircle,
      label: "Message Appears Safe",
      className: "bg-green-500/10 border-green-500/30 text-green-400",
      badge: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    suspicious: {
      icon: AlertCircle,
      label: "Suspicious Content Detected",
      className: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    scam: {
      icon: AlertTriangle,
      label: "Potential Scam Detected",
      className: "bg-destructive/10 border-destructive/30 text-destructive",
      badge: "bg-destructive/20 text-red-300 border-destructive/30",
    },
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">SMS Phishing Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste any SMS or text message to detect phishing attempts, scam patterns, and suspicious keywords</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Message Input</span>
              </div>
              <span className="text-xs text-muted-foreground">{message.length} chars</span>
            </div>
            <div className="p-4">
              <Textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); scanMutation.reset(); }}
                placeholder="Paste an SMS message here to analyze it for phishing patterns, scam keywords, and suspicious content..."
                className="min-h-[180px] bg-transparent border-0 focus-visible:ring-0 resize-none text-sm font-mono p-0"
                data-testid="sms-input"
              />
            </div>
          </div>

          <Button
            onClick={handleScan}
            disabled={!message.trim() || loading}
            className="w-full h-11 font-semibold"
            data-testid="sms-scan-btn"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><MessageSquare className="w-4 h-4 mr-2" /> Analyze Message</>
            )}
          </Button>

          {message && (
            <button
              onClick={() => { setMessage(""); scanMutation.reset(); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="sms-clear-btn"
            >
              <RotateCcw className="w-3 h-3" /> Clear message
            </button>
          )}

          {/* Examples */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Try an example</h3>
            <div className="space-y-2">
              {EXAMPLE_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  data-testid={`example-msg-${i}`}
                  onClick={() => { setMessage(msg); scanMutation.reset(); }}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border rounded-lg px-3 py-2 transition-all truncate"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Analysis Result</h2>
          </div>

          <div className="flex-1 p-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">Analysis failed. Please try again.</p>
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
                <p className="text-sm text-muted-foreground">Analyzing message patterns...</p>
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">Paste a message and click Analyze</p>
              </div>
            )}

            {result && !loading && (() => {
              const verdict = result.verdict as "safe" | "scam" | "suspicious";
              const cfg = verdictConfig[verdict] ?? verdictConfig.safe;
              const Icon = cfg.icon;
              return (
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${cfg.className}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold">{cfg.label}</p>
                      <p className="text-xs opacity-70 mt-0.5 capitalize">{verdict} verdict</p>
                    </div>
                  </div>

                  {result.triggers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Triggered Keywords ({result.triggers.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.triggers.map((t, i) => (
                          <span
                            key={i}
                            data-testid={`trigger-${i}`}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.badge}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message Preview</p>
                    <div className="bg-muted/30 border border-border rounded-lg p-3">
                      <p data-testid="message-preview" className="text-xs font-mono text-foreground leading-relaxed break-words">{result.messagePreview}</p>
                    </div>
                  </div>

                  {/* Risk legend */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {(["safe", "suspicious", "scam"] as const).map((v) => (
                      <div key={v} className={`rounded-lg p-2 text-center border ${verdict === v ? verdictConfig[v].badge : "bg-muted/20 border-border"}`}>
                        <p className={`text-[10px] font-bold uppercase ${verdict === v ? "" : "text-muted-foreground"}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
