import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Users, 
  Pill, 
  BarChart3, 
  Settings, 
  LogOut,
  Hospital,
  UserCheck,
  MessageCircle,
  Calendar,
  Bell
} from "lucide-react";

export type UserRole = "super_admin" | "hospital_admin" | "doctor" | "patient";

interface AppSidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function AppSidebar({ 
  userRole, 
  userName, 
  userEmail, 
  currentPath, 
  onNavigate, 
  onLogout 
}: AppSidebarProps) {
  
  const getMenuItems = () => {
    const commonItems = [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ];

    switch (userRole) {
      case "super_admin":
        return [
          { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
          { title: "Hospitals", url: "/hospitals", icon: Hospital },
          { title: "System Analytics", url: "/analytics", icon: BarChart3 },
          { title: "User Management", url: "/users", icon: Users },
          { title: "Settings", url: "/settings", icon: Settings },
        ];
      
      case "hospital_admin":
        return [
          { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
          { title: "Doctors", url: "/doctors", icon: Stethoscope },
          { title: "Patients", url: "/patients", icon: Users },
          { title: "Hospital Analytics", url: "/analytics", icon: BarChart3 },
          { title: "Settings", url: "/settings", icon: Settings },
        ];
      
      case "doctor":
        return [
          { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
          { title: "My Patients", url: "/patients", icon: Users },
          { title: "Prescriptions", url: "/prescriptions", icon: Pill },
          { title: "Compliance Reports", url: "/compliance", icon: BarChart3 },
          { title: "Messages", url: "/messages", icon: MessageCircle },
          { title: "Settings", url: "/settings", icon: Settings },
        ];
      
      case "patient":
        return [
          { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
          { title: "My Medications", url: "/medications", icon: Pill },
          { title: "Schedule", url: "/schedule", icon: Calendar },
          { title: "Chat with AI", url: "/chat", icon: MessageCircle },
          { title: "Notifications", url: "/notifications", icon: Bell },
          { title: "Settings", url: "/settings", icon: Settings },
        ];
      
      default:
        return commonItems;
    }
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case "super_admin":
        return { label: "Super Admin", icon: UserCheck, color: "bg-purple-100 text-purple-800" };
      case "hospital_admin":
        return { label: "Hospital Admin", icon: Hospital, color: "bg-blue-100 text-blue-800" };
      case "doctor":
        return { label: "Doctor", icon: Stethoscope, color: "bg-green-100 text-green-800" };
      case "patient":
        return { label: "Patient", icon: Users, color: "bg-orange-100 text-orange-800" };
      default:
        return { label: "User", icon: Users, color: "bg-gray-100 text-gray-800" };
    }
  };

  const menuItems = getMenuItems();
  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">MediCare Reminder</h2>
            <p className="text-xs text-sidebar-foreground/70">Healthcare Compliance System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentPath === item.url}
                    onClick={() => onNavigate(item.url)}
                    data-testid={`nav-${item.url.replace('/', '')}`}
                  >
                    <button className="w-full flex items-center gap-3 text-left">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role-specific quick actions */}
        {userRole === "patient" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium mb-2">Today's Progress</p>
                <div className="flex items-center justify-between text-xs">
                  <span>3 of 4 taken</span>
                  <Badge variant="secondary" className="text-xs">75%</Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userRole === "doctor" && (
          <SidebarGroup>
            <SidebarGroupLabel>Alerts</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">2 patients</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">Need attention</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">1 critical</p>
                  <p className="text-xs text-red-600 dark:text-red-300">Overdue medications</p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{userEmail}</p>
            </div>
          </div>
          
          <Badge className={`${roleInfo.color} border-0 w-full justify-start`}>
            <RoleIcon className="h-3 w-3 mr-1" />
            {roleInfo.label}
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}