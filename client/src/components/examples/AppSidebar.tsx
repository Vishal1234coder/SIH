import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '../AppSidebar';

export default function AppSidebarExample() {
  const [currentPath, setCurrentPath] = useState("/dashboard");
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole="doctor"
          userName="Dr. Sarah Wilson"
          userEmail="sarah.wilson@hospital.com"
          currentPath={currentPath}
          onNavigate={(path) => {
            setCurrentPath(path);
            console.log('Navigating to:', path);
          }}
          onLogout={() => console.log('Logging out')}
        />
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold">Main Content Area</h1>
          <p className="text-muted-foreground">Current path: {currentPath}</p>
        </div>
      </div>
    </SidebarProvider>
  );
}