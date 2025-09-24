import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bell, MessageCircle, Calendar, TrendingUp, Pill, AlertCircle } from "lucide-react";
import MedicineCard, { type Medicine } from "./MedicineCard";

interface PatientDashboardProps {
  patientName: string;
  onOpenChat: () => void;
}

export default function PatientDashboard({ patientName, onOpenChat }: PatientDashboardProps) {
  // todo: remove mock functionality
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: "1",
      name: "Metformin",
      dosage: "500mg",
      timing: "After breakfast", 
      nextDose: "Today 9:00 AM",
      status: "pending",
      instructions: "Take with food to reduce stomach upset"
    },
    {
      id: "2",
      name: "Lisinopril", 
      dosage: "10mg",
      timing: "Morning",
      nextDose: "Today 7:00 AM",
      status: "overdue",
      instructions: "Take on empty stomach"
    },
    {
      id: "3",
      name: "Vitamin D",
      dosage: "1000 IU",
      timing: "Evening",
      nextDose: "Today 8:00 PM", 
      status: "pending",
      instructions: "Take with dinner"
    }
  ]);

  const handleMarkTaken = (medicineId: string) => {
    setMedicines(prev => prev.map(med => 
      med.id === medicineId 
        ? { ...med, status: "taken" as const }
        : med
    ));
  };

  const handleSkip = (medicineId: string) => {
    setMedicines(prev => prev.map(med => 
      med.id === medicineId 
        ? { ...med, status: "skipped" as const }
        : med
    ));
  };

  const todaysMedicines = medicines.filter(med => med.status !== "taken");
  const overdueMedicines = medicines.filter(med => med.status === "overdue");
  const completionRate = Math.round((medicines.filter(med => med.status === "taken").length / medicines.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Good morning, {patientName}</h1>
          <p className="text-muted-foreground">Here's your medication schedule for today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button onClick={onOpenChat} data-testid="button-ai-chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask AI Assistant
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {overdueMedicines.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Overdue Medications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have {overdueMedicines.length} overdue medication{overdueMedicines.length > 1 ? 's' : ''}. 
              Please take them as soon as possible.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {medicines.filter(med => med.status === "taken").length} of {medicines.length} taken
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Medicine</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysMedicines.length > 0 ? todaysMedicines[0].nextDose : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysMedicines.length > 0 ? todaysMedicines[0].name : "All done for now"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Medications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Medications</h2>
          <Badge variant="secondary">
            {todaysMedicines.length} remaining
          </Badge>
        </div>
        
        <div className="grid gap-4">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onMarkTaken={handleMarkTaken}
              onSkip={handleSkip}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" data-testid="button-view-prescriptions">
              <Pill className="h-4 w-4 mr-2" />
              View All Prescriptions
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-contact-doctor">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Doctor
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-medication-history">
              <Calendar className="h-4 w-4 mr-2" />
              Medication History
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-side-effects">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Side Effects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}