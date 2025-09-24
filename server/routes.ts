// Using blueprint javascript_log_in_with_replit integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole, requireHospitalScope, requireOwnPatientData, requirePrescriptionAccess, requireDoctorOfPatient } from "./middleware/auth";
import { insertPrescriptionSchema, insertMedicineSchema, insertMedicineScheduleSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithRole(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Healthcare API routes with proper authorization
  
  // Super admin routes
  app.get("/api/admin/hospitals", isAuthenticated, requireRole("super_admin"), async (req: any, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  // Hospital admin routes
  app.get("/api/hospitals/:hospitalId/doctors", isAuthenticated, requireRole("hospital_admin", "super_admin"), requireHospitalScope, async (req: any, res) => {
    try {
      const { hospitalId } = req.params;
      const doctors = await storage.getDoctorsByHospital(hospitalId);
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Doctor routes
  app.get("/api/doctor/patients", isAuthenticated, requireRole("doctor"), async (req: any, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.claims.sub);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      const patients = await storage.getPatientsByDoctor(doctor.id);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Patient routes
  app.get("/api/patient/medicines", isAuthenticated, requireRole("patient"), requireOwnPatientData, async (req: any, res) => {
    try {
      const patient = req.currentPatient;
      const todaysSchedule = await storage.getTodaysMedicineSchedule(patient.id);
      const overdueMedicines = await storage.getOverdueMedicines(patient.id);
      const complianceRate = await storage.getComplianceRate(patient.id);
      
      res.json({
        todaysSchedule,
        overdueMedicines,
        complianceRate,
      });
    } catch (error) {
      console.error("Error fetching patient medicines:", error);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  // Prescription Management APIs

  // Create prescription (doctors only)
  app.post("/api/prescriptions", isAuthenticated, requireRole("doctor"), async (req: any, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.claims.sub);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      // Validate request body
      const validatedData = insertPrescriptionSchema.parse({
        ...req.body,
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
      });

      // Verify patient exists and belongs to the same hospital
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient || patient.hospitalId !== doctor.hospitalId) {
        return res.status(403).json({ message: "Patient not found in your hospital" });
      }

      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  // Get prescriptions for a patient
  app.get("/api/patients/:patientId/prescriptions", isAuthenticated, requireDoctorOfPatient, async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const prescriptions = await storage.getPrescriptionsByPatient(patientId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  // Get patient's own prescriptions
  app.get("/api/patient/prescriptions", isAuthenticated, requireRole("patient"), requireOwnPatientData, async (req: any, res) => {
    try {
      const patient = req.currentPatient;
      const prescriptions = await storage.getPrescriptionsByPatient(patient.id);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  // Add medicine to prescription
  app.post("/api/prescriptions/:prescriptionId/medicines", isAuthenticated, requireRole("doctor"), requirePrescriptionAccess, async (req: any, res) => {
    try {
      const { prescriptionId } = req.params;
      
      // Validate request body
      const validatedData = insertMedicineSchema.parse({
        ...req.body,
        prescriptionId,
      });

      const medicine = await storage.addMedicineToPrescription(validatedData);
      res.status(201).json(medicine);
    } catch (error) {
      console.error("Error adding medicine:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid medicine data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add medicine" });
    }
  });

  // Create medicine schedule
  app.post("/api/medicines/:medicineId/schedule", isAuthenticated, requireRole("doctor"), async (req: any, res) => {
    try {
      const { medicineId } = req.params;
      
      // Verify doctor has access to this medicine's prescription
      const medicine = await storage.getMedicine(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      const doctor = await storage.getDoctorByUserId(req.user.claims.sub);
      const prescription = await storage.getPrescription(medicine.prescriptionId);
      
      if (!doctor || !prescription || prescription.doctorId !== doctor.id) {
        return res.status(403).json({ message: "Forbidden: Not your prescription" });
      }

      // Validate request body
      const validatedData = insertMedicineScheduleSchema.parse({
        ...req.body,
        medicineId,
        patientId: prescription.patientId,
      });

      const schedule = await storage.createMedicineSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Mark medicine as taken (patient only)
  app.post("/api/medicine-schedule/:scheduleId/taken", isAuthenticated, requireRole("patient"), async (req: any, res) => {
    try {
      const { scheduleId } = req.params;
      
      // Verify the schedule belongs to the current patient
      const schedule = await storage.getMedicineSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Medicine schedule not found" });
      }

      const patient = await storage.getPatientByUserId(req.user.claims.sub);
      if (!patient || schedule.patientId !== patient.id) {
        return res.status(403).json({ message: "Forbidden: Not your medicine" });
      }

      const updatedSchedule = await storage.markMedicineAsTaken(scheduleId);
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error marking medicine as taken:", error);
      res.status(500).json({ message: "Failed to mark medicine as taken" });
    }
  });

  // Mark medicine as missed
  app.post("/api/medicine-schedule/:scheduleId/missed", isAuthenticated, requireRole("patient"), async (req: any, res) => {
    try {
      const { scheduleId } = req.params;
      
      // Verify the schedule belongs to the current patient
      const schedule = await storage.getMedicineSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Medicine schedule not found" });
      }

      const patient = await storage.getPatientByUserId(req.user.claims.sub);
      if (!patient || schedule.patientId !== patient.id) {
        return res.status(403).json({ message: "Forbidden: Not your medicine" });
      }

      const updatedSchedule = await storage.markMedicineAsMissed(scheduleId);
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error marking medicine as missed:", error);
      res.status(500).json({ message: "Failed to mark medicine as missed" });
    }
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ message: "This is a protected route", userId });
  });

  const httpServer = createServer(app);

  return httpServer;
}
