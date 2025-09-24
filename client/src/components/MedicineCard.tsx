import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Pill, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  nextDose: string;
  status: "pending" | "taken" | "overdue" | "skipped";
  instructions?: string;
  sideEffects?: string[];
}

interface MedicineCardProps {
  medicine: Medicine;
  onMarkTaken?: (medicineId: string) => void;
  onSkip?: (medicineId: string) => void;
  showActions?: boolean;
}

export default function MedicineCard({ 
  medicine, 
  onMarkTaken, 
  onSkip, 
  showActions = true 
}: MedicineCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const statusConfig = {
    pending: { color: "bg-blue-100 text-blue-800", icon: Clock },
    taken: { color: "bg-green-100 text-green-800", icon: Check },
    overdue: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
    skipped: { color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
  };

  const { color, icon: StatusIcon } = statusConfig[medicine.status];

  const handleMarkTaken = async () => {
    setIsLoading(true);
    console.log("Marking medicine as taken:", medicine.id);
    onMarkTaken?.(medicine.id);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleSkip = () => {
    console.log("Skipping medicine:", medicine.id);
    onSkip?.(medicine.id);
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{medicine.name}</CardTitle>
          </div>
          <Badge className={`${color} border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {medicine.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Dosage</p>
            <p className="font-medium">{medicine.dosage}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Timing</p>
            <p className="font-medium">{medicine.timing}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Next Dose</p>
            <p className="font-medium">{medicine.nextDose}</p>
          </div>
        </div>

        {medicine.instructions && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Instructions</p>
            <p className="text-sm text-muted-foreground">{medicine.instructions}</p>
          </div>
        )}

        {showActions && medicine.status === "pending" && (
          <div className="flex gap-2">
            <Button 
              onClick={handleMarkTaken}
              disabled={isLoading}
              className="flex-1"
              data-testid={`button-taken-${medicine.id}`}
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "Marking..." : "Mark as Taken"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkip}
              data-testid={`button-skip-${medicine.id}`}
            >
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}