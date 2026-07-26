import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import ScreenshotScanner from '@/pages/screenshot-scanner';
import FileScanner from '@/pages/file-scanner';
import SmsScanner from '@/pages/sms-scanner';
import HistoryPage from '@/pages/history';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/scan/screenshot" component={ScreenshotScanner} />
        <Route path="/scan/file" component={FileScanner} />
        <Route path="/scan/sms" component={SmsScanner} />
        <Route path="/history" component={HistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
