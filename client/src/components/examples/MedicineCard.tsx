import MedicineCard from '../MedicineCard';

export default function MedicineCardExample() {
  const sampleMedicine = {
    id: "med-1",
    name: "Metformin",
    dosage: "500mg",
    timing: "After breakfast",
    nextDose: "Today 9:00 AM",
    status: "pending" as const,
    instructions: "Take with food to reduce stomach upset",
    sideEffects: ["Nausea", "Stomach upset"]
  };

  const overdueMedicine = {
    id: "med-2", 
    name: "Lisinopril",
    dosage: "10mg",
    timing: "Morning",
    nextDose: "Today 7:00 AM",
    status: "overdue" as const,
    instructions: "Take on empty stomach"
  };

  return (
    <div className="space-y-4 p-4">
      <MedicineCard 
        medicine={sampleMedicine}
        onMarkTaken={(id) => console.log('Marked as taken:', id)}
        onSkip={(id) => console.log('Skipped:', id)}
      />
      <MedicineCard 
        medicine={overdueMedicine}
        onMarkTaken={(id) => console.log('Marked as taken:', id)}
        onSkip={(id) => console.log('Skipped:', id)}
      />
    </div>
  );
}