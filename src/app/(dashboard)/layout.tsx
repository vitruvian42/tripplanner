import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import AuthGuard from '@/components/dashboard/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Mobile-first layout */}
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Sidebar - hidden on mobile */}
          <DashboardSidebar />
          
          {/* Main content area */}
          <div className="flex flex-col flex-1">
            <DashboardHeader />
            <main className="flex-1 mobile-padding py-6 bg-muted/30">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
