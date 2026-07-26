import { Shield, LayoutDashboard, Image as ImageIcon, FileText, MessageSquare, History } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/scan/screenshot", label: "Screenshot Intel", icon: ImageIcon },
    { href: "/scan/file", label: "File Hash Analysis", icon: FileText },
    { href: "/scan/sms", label: "SMS Phishing", icon: MessageSquare },
    { href: "/history", label: "Activity Log", icon: History },
  ];

  return (
    <div className="flex h-screen bg-noise bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col z-10 shadow-[1px_0_15px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer" data-testid="link-home">
            <div className="relative">
              <Shield className="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
            </div>
            <span className="font-bold text-lg tracking-wider text-white">HABIT<span className="text-primary">SHIELD</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="text-xs font-mono text-muted-foreground px-3 mb-2 uppercase tracking-widest">
            Modules
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 font-medium text-sm group relative overflow-hidden",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                  )}
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" : "group-hover:text-foreground")} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border bg-sidebar/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            <span className="text-xs font-mono text-muted-foreground">SYSTEM_ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
