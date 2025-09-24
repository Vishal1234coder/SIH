import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RoleBasedLogin, { type UserRole } from "./RoleBasedLogin";
import AppSidebar from "./AppSidebar";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";
import AIAssistantChat from "./AIAssistantChat";
import ThemeToggle from "./ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hospital, Users, Stethoscope, BarChart3, UserPlus, Building } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function HealthcareApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogin = (role: UserRole, credentials: { email: string; password: string }) => {
    // todo: remove mock functionality
    const mockUsers: Record<UserRole, User> = {
      super_admin: {
        id: "1",
        name: "Admin User",
        email: credentials.email,
        role: "super_admin"
      },
      hospital_admin: {
        id: "2", 
        name: "Hospital Admin",
        email: credentials.email,
        role: "hospital_admin"
      },
      doctor: {
        id: "3",
        name: "Dr. Sarah Wilson",
        email: credentials.email,
        role: "doctor"
      },
      patient: {
        id: "4",
        name: "John Smith", 
        email: credentials.email,
        role: "patient"
      }
    };

    console.log("Logging in user:", role);
    setCurrentUser(mockUsers[role]);
    setCurrentPath("/dashboard");
  };

  const handleLogout = () => {
    console.log("User logging out");
    setCurrentUser(null);
    setCurrentPath("/dashboard");
    setIsChatOpen(false);
  };

  const handleNavigate = (path: string) => {
    console.log("Navigating to:", path);
    setCurrentPath(path);
    
    if (path === "/chat") {
      setIsChatOpen(true);
    }
  };

  // Admin dashboards content
  const renderAdminDashboard = () => {
    if (currentUser?.role === "super_admin") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage hospitals and system-wide analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+2 this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,847</div>
                <p className="text-xs text-muted-foreground">Across all hospitals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">Using the platform</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Compliance</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Average across platform</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Hospital Registrations</CardTitle>
              <CardDescription>New hospitals added to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "City General Hospital", location: "Mumbai", doctors: 45, patients: 2847 },
                  { name: "Metro Medical Center", location: "Delhi", doctors: 32, patients: 1923 },
                  { name: "Regional Health Institute", location: "Bangalore", doctors: 28, patients: 1456 }
                ].map((hospital, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{hospital.name}</h3>
                      <p className="text-sm text-muted-foreground">{hospital.location}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{hospital.doctors} doctors</p>
                      <p className="text-muted-foreground">{hospital.patients} patients</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentUser?.role === "hospital_admin") {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Hospital Administration</h1>
              <p className="text-muted-foreground">Manage doctors and patients for your hospital</p>
            </div>
            <div className="flex gap-2">
              <Button data-testid="button-add-doctor">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Doctor
              </Button>
              <Button variant="outline" data-testid="button-add-patient">
                <Users className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>City General Hospital</CardTitle>
                <CardDescription>Your hospital overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Doctors</span>
                  <Badge>45</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Registered Patients</span>
                  <Badge>2,847</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compliance Rate</span>
                  <Badge className="bg-green-100 text-green-800">89%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doctor Management</CardTitle>
                <CardDescription>Oversee medical staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    View All Doctors
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Doctor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Monitor patient registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View All Patients
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Patient
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCurrentPage = () => {
    if (!currentUser) return null;

    if (currentPath === "/dashboard") {
      if (currentUser.role === "patient") {
        return (
          <PatientDashboard
            patientName={currentUser.name}
            onOpenChat={() => setIsChatOpen(true)}
          />
        );
      } else if (currentUser.role === "doctor") {
        return (
          <DoctorDashboard
            doctorName={currentUser.name}
            onCreatePrescription={() => console.log("Creating prescription")}
            onViewPatient={(id) => console.log("Viewing patient:", id)}
          />
        );
      } else {
        return renderAdminDashboard();
      }
    }

    // Placeholder for other pages
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          {currentPath.replace("/", "").charAt(0).toUpperCase() + currentPath.slice(2)}
        </h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              This page is under development. The current prototype focuses on the dashboard functionality.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Login screen
  if (!currentUser) {
    return <RoleBasedLogin onLogin={handleLogin} />;
  }

  // Main application with sidebar
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={currentUser.role}
          userName={currentUser.name}
          userEmail={currentUser.email}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {renderCurrentPage()}
          </main>
        </div>
      </div>

      <AIAssistantChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        patientName={currentUser.role === "patient" ? currentUser.name : undefined}
      />
    </SidebarProvider>
  );
}