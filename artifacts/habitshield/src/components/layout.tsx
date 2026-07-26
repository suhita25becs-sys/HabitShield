import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Image, FileText, MessageSquare, History, Activity } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/scan/screenshot", icon: Image, label: "Screenshot Scan" },
  { href: "/scan/file", icon: FileText, label: "File Hash" },
  { href: "/scan/sms", icon: MessageSquare, label: "SMS Analyzer" },
  { href: "/history", icon: History, label: "Activity Log" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-wide">HABITSHIELD</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Cybersecurity Suite</p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
            <span className="text-xs text-green-400 font-medium">Systems Operational</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Navigation</p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">v1.0.0 — Final Year Project</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
