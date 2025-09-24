import DoctorDashboard from '../DoctorDashboard';

export default function DoctorDashboardExample() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DoctorDashboard
        doctorName="Sarah Wilson"
        onCreatePrescription={() => console.log('Creating new prescription')}
        onViewPatient={(patientId) => console.log('Viewing patient:', patientId)}
      />
    </div>
  );
}