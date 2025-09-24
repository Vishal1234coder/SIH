import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Hospital, UserCheck, User } from "lucide-react";

export type UserRole = "super_admin" | "hospital_admin" | "doctor" | "patient";

interface LoginProps {
  onLogin: (role: UserRole, credentials: { email: string; password: string }) => void;
}

export default function RoleBasedLogin({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const roleIcons = {
    super_admin: UserCheck,
    hospital_admin: Hospital,
    doctor: Stethoscope,
    patient: User,
  };

  const roleLabels = {
    super_admin: "Super Admin",
    hospital_admin: "Hospital Admin", 
    doctor: "Doctor",
    patient: "Patient",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { role: selectedRole, email });
    onLogin(selectedRole, { email, password });
  };

  const Icon = roleIcons[selectedRole];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">MediCare Reminder</CardTitle>
          <CardDescription>
            Smart medicine compliance system - Sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Login as</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" data-testid="button-login">
              Sign in as {roleLabels[selectedRole]}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground">
            Demo credentials: any email/password combination
          </div>
        </CardContent>
      </Card>
    </div>
  );
}