import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-6 shadow-soft sticky top-0 z-10">
            <SidebarTrigger className="mr-4 rounded-xl hover:bg-muted/50 transition-colors" />
            <h1 className="text-xl font-semibold text-foreground">ExamPrep Hub</h1>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-primary/5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;