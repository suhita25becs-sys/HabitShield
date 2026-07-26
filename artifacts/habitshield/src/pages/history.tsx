import { useGetScanHistory, getGetScanHistoryQueryKey } from "@workspace/api-client-react";
import { History, AlertTriangle, CheckCircle, Image, FileText, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Image; className: string }> = {
  screenshot: { label: "Screenshot", icon: Image, className: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  file: { label: "File Hash", icon: FileText, className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  sms: { label: "SMS", icon: MessageSquare, className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

export default function HistoryPage() {
  const { data: history, isLoading } = useGetScanHistory({ limit: 50 }, {
    query: { queryKey: getGetScanHistoryQueryKey({ limit: 50 }) },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Logs</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete history of all security scans performed</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Scan History</h2>
          </div>
          {history && (
            <span className="text-xs text-muted-foreground">{history.length} total record{history.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[120px_1fr_100px_120px_140px] gap-4 px-6 py-3 border-b border-border bg-muted/20">
          {["Type", "Summary / File", "Status", "Date", "Time"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_100px_120px_140px] gap-4 px-6 py-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-5 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="divide-y divide-border">
            {history.map((event) => {
              const typeConf = TYPE_CONFIG[event.scanType] ?? TYPE_CONFIG.file;
              const Icon = typeConf.icon;
              return (
                <div
                  key={event.id}
                  data-testid={`history-row-${event.id}`}
                  className="grid grid-cols-[120px_1fr_100px_120px_140px] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors"
                >
                  {/* Type badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${typeConf.className}`}>
                      <Icon className="w-3 h-3" />
                      {typeConf.label}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{event.summary}</p>
                    {event.filename && (
                      <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{event.filename}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    {event.threatDetected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-destructive">
                        <AlertTriangle className="w-3 h-3" /> Threat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-green-400">
                        <CheckCircle className="w-3 h-3" /> Clean
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-foreground">{format(new Date(event.scannedAt), "MMM d, yyyy")}</p>
                  </div>

                  {/* Relative time */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.scannedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <History className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium text-foreground mb-1">No scan history yet</p>
            <p className="text-xs text-muted-foreground">Run your first scan to see it logged here</p>
          </div>
        )}
      </div>
    </div>
  );
}
