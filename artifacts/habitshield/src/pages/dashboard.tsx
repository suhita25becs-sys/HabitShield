import { useGetScanStats, useGetScanHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, Activity, Search, Server } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetScanStats();
  const { data: history, isLoading: historyLoading } = useGetScanHistory({ limit: 5 });

  const chartData = stats ? [
    { name: "Screenshot", scans: stats.screenshotScans, color: "hsl(var(--primary))" },
    { name: "File Hash", scans: stats.fileScans, color: "hsl(var(--chart-2, 280 65% 60%))" },
    { name: "SMS", scans: stats.smsScans, color: "hsl(var(--chart-3, 340 65% 60%))" }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
          <Server className="w-8 h-8 text-primary" />
          Command Center
        </h1>
        <p className="text-muted-foreground font-mono">Real-time threat detection metrics and system status.</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase">Total Scans</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white font-mono">{stats.totalScans.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/20 blur-xl rounded-full"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive font-mono uppercase">Threats Detected</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive font-mono">{stats.threatsFound.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-success/20 blur-xl rounded-full"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-success font-mono uppercase">Clean Scans</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success font-mono">{stats.cleanScans.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase">Detection Rate</CardTitle>
              <Search className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white font-mono">
                {stats.totalScans > 0 ? ((stats.threatsFound / stats.totalScans) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Scan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {statsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--secondary))' }} 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="scans" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
            <CardDescription>Latest telemetry data from sensors</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${event.threatDetected ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                        {event.threatDetected ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[200px]" title={event.summary}>
                          {event.summary}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(event.scannedAt), 'MMM dd, HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {event.scanType}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
