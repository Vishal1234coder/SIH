import PatientDashboard from '../PatientDashboard';

export default function PatientDashboardExample() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PatientDashboard 
        patientName="John Smith"
        onOpenChat={() => console.log('Opening AI chat assistant')}
      />
    </div>
  );
}