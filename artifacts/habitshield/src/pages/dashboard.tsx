import { useGetScanStats, getGetScanStatsQueryKey, useGetScanHistory, getGetScanHistoryQueryKey } from "@workspace/api-client-react";
import { Shield, Image, FileText, MessageSquare, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof Shield;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div className={`bg-card border border-card-border rounded-xl p-5 relative overflow-hidden group transition-all duration-200 hover:border-primary/40`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${color === "blue" ? "bg-primary/5" : color === "red" ? "bg-destructive/5" : color === "green" ? "bg-green-500/5" : "bg-accent/5"}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            color === "blue" ? "bg-primary/20 text-primary" :
            color === "red" ? "bg-destructive/20 text-destructive" :
            color === "green" ? "bg-green-500/20 text-green-400" :
            "bg-accent/20 text-accent"
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground tabular-nums">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ScanTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    screenshot: { label: "Screenshot", className: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    file: { label: "File Hash", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    sms: { label: "SMS", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  };
  const c = config[type] ?? { label: type, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${c.className}`}>
      {c.label}
    </span>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetScanStats({
    query: { queryKey: getGetScanStatsQueryKey() },
  });
  const { data: history, isLoading: histLoading } = useGetScanHistory({ limit: 8 }, {
    query: { queryKey: getGetScanHistoryQueryKey({ limit: 8 }) },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Overview</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Security Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time threat monitoring and scan analytics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5 h-28 animate-pulse">
              <div className="h-3 bg-muted rounded w-20 mb-4" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard icon={TrendingUp} label="Total Scans" value={stats.totalScans} color="blue" sub="All time" />
            <StatCard icon={AlertTriangle} label="Threats Found" value={stats.threatsFound} color="red" sub={`${stats.totalScans > 0 ? Math.round((stats.threatsFound / stats.totalScans) * 100) : 0}% of all scans`} />
            <StatCard icon={CheckCircle} label="Clean Scans" value={stats.cleanScans} color="green" sub="No threats detected" />
            <StatCard icon={Image} label="Screenshots" value={stats.screenshotScans} color="purple" sub="PII scans" />
            <StatCard icon={FileText} label="File Hashes" value={stats.fileScans} color="blue" sub="SHA-256 computed" />
            <StatCard icon={MessageSquare} label="SMS Analyzed" value={stats.smsScans} color="amber" sub="Phishing checks" />
          </>
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-8">No data available</div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <span className="text-xs text-muted-foreground">Last 8 scans</span>
        </div>

        {histLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-16 h-5 bg-muted rounded" />
                <div className="flex-1 h-4 bg-muted rounded w-3/4" />
                <div className="w-12 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="divide-y divide-border">
            {history.map((event) => (
              <div key={event.id} data-testid={`activity-row-${event.id}`} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <ScanTypeBadge type={event.scanType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{event.summary}</p>
                  {event.filename && (
                    <p className="text-xs text-muted-foreground truncate font-mono">{event.filename}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {event.threatDetected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-destructive">
                      <AlertTriangle className="w-3 h-3" /> Threat
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-400">
                      <CheckCircle className="w-3 h-3" /> Clean
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.scannedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No scans yet. Start scanning to see activity here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
