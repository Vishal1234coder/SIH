import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  AlertTriangle, 
  Search,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  compliance: number;
  status: "good" | "warning" | "critical";
  lastTaken: string;
  nextDue: string;
}

interface DoctorDashboardProps {
  doctorName: string;
  onCreatePrescription: () => void;
  onViewPatient: (patientId: string) => void;
}

export default function DoctorDashboard({ 
  doctorName, 
  onCreatePrescription, 
  onViewPatient 
}: DoctorDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // todo: remove mock functionality
  const [patients] = useState<Patient[]>([
    {
      id: "1",
      name: "John Smith",
      age: 65,
      condition: "Diabetes Type 2",
      compliance: 95,
      status: "good",
      lastTaken: "Today 8:00 AM",
      nextDue: "Today 6:00 PM"
    },
    {
      id: "2", 
      name: "Sarah Johnson",
      age: 45,
      condition: "Hypertension",
      compliance: 78,
      status: "warning",
      lastTaken: "Yesterday 7:00 PM",
      nextDue: "Today 7:00 AM"
    },
    {
      id: "3",
      name: "Michael Brown",
      age: 55,
      condition: "Heart Disease", 
      compliance: 45,
      status: "critical",
      lastTaken: "2 days ago",
      nextDue: "Overdue by 6 hours"
    },
    {
      id: "4",
      name: "Emily Davis",
      age: 38,
      condition: "Asthma",
      compliance: 88,
      status: "good",
      lastTaken: "Today 9:30 AM",
      nextDue: "Today 9:30 PM"
    }
  ]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPatients: patients.length,
    compliantPatients: patients.filter(p => p.compliance >= 80).length,
    warningPatients: patients.filter(p => p.status === "warning").length,
    criticalPatients: patients.filter(p => p.status === "critical").length,
    averageCompliance: Math.round(patients.reduce((sum, p) => sum + p.compliance, 0) / patients.length)
  };

  const getStatusIcon = (status: Patient["status"]) => {
    switch (status) {
      case "good": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "critical": return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "good": return "bg-green-100 text-green-800 border-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical": return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, Dr. {doctorName}</h1>
          <p className="text-muted-foreground">Monitor patient compliance and manage prescriptions</p>
        </div>
        <Button onClick={onCreatePrescription} data-testid="button-create-prescription">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Prescription
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompliance}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.compliantPatients} of {stats.totalPatients} compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warningPatients}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalPatients}</div>
            <p className="text-xs text-muted-foreground">Urgent action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Patient Compliance Monitor</CardTitle>
              <CardDescription>Track medication adherence for all patients</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:w-64"
                data-testid="input-search-patients"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover-elevate"
              >
                <div className="flex-1 space-y-1 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{patient.name}</h3>
                    <Badge className={`${getStatusColor(patient.status)} border`}>
                      {getStatusIcon(patient.status)}
                      <span className="ml-1 capitalize">{patient.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Age {patient.age} • {patient.condition}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Last taken: {patient.lastTaken}</span>
                    <span>Next due: {patient.nextDue}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none sm:w-32">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Compliance</span>
                      <span className="font-medium">{patient.compliance}%</span>
                    </div>
                    <Progress value={patient.compliance} className="h-2" />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPatient(patient.id)}
                    data-testid={`button-view-patient-${patient.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}