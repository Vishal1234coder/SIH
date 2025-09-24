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
      
      // Update daily compliance after marking medicine status
      const medicine = await storage.getMedicine(schedule.medicineId);
      if (medicine) {
        await storage.updateDailyCompliance(patient.id, medicine.prescriptionId, new Date());
      }
      
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
      
      // Update daily compliance after marking medicine status
      const medicine = await storage.getMedicine(schedule.medicineId);
      if (medicine) {
        await storage.updateDailyCompliance(patient.id, medicine.prescriptionId, new Date());
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error marking medicine as missed:", error);
      res.status(500).json({ message: "Failed to mark medicine as missed" });
    }
  });

  // Enhanced Compliance Tracking APIs

  // Get detailed compliance statistics for a patient
  app.get("/api/patient/compliance", isAuthenticated, requireRole("patient"), requireOwnPatientData, async (req: any, res) => {
    try {
      const patient = req.currentPatient;
      
      // Parse and validate query parameters
      let days = parseInt(req.query.days as string) || 7;
      let weeks = parseInt(req.query.weeks as string) || 4;
      
      // Clamp to sane ranges
      days = Math.max(1, Math.min(days, 365));
      weeks = Math.max(1, Math.min(weeks, 52));

      const weeklyCompliance = await storage.getWeeklyComplianceStats(patient.id, weeks);
      const dailyCompliance = await storage.getDailyComplianceStats(patient.id, days);
      const medicineCompliance = await storage.getMedicineComplianceBreakdown(patient.id);
      const currentStreak = await storage.getComplianceStreak(patient.id);
      
      res.json({
        overview: {
          currentRate: await storage.getComplianceRate(patient.id, days),
          streak: currentStreak,
          totalMedicines: medicineCompliance.length,
        },
        trends: {
          weekly: weeklyCompliance,
          daily: dailyCompliance,
        },
        breakdown: medicineCompliance,
      });
    } catch (error) {
      console.error("Error fetching compliance stats:", error);
      res.status(500).json({ message: "Failed to fetch compliance statistics" });
    }
  });

  // Get compliance for doctor's patients
  app.get("/api/doctor/patients/compliance", isAuthenticated, requireRole("doctor"), async (req: any, res) => {
    try {
      const doctor = await storage.getDoctorByUserId(req.user.claims.sub);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const patientsCompliance = await storage.getPatientComplianceOverview(doctor.id);
      res.json(patientsCompliance);
    } catch (error) {
      console.error("Error fetching patients compliance:", error);
      res.status(500).json({ message: "Failed to fetch patients compliance" });
    }
  });

  // Get compliance alerts (overdue medicines, low compliance)
  app.get("/api/compliance/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithRole(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let alerts = [];

      if (user.role === "patient") {
        const patient = await storage.getPatientByUserId(userId);
        if (patient) {
          alerts = await storage.getComplianceAlerts(patient.id);
        }
      } else if (user.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(userId);
        if (doctor) {
          alerts = await storage.getDoctorComplianceAlerts(doctor.id);
        }
      }

      res.json(alerts);
    } catch (error) {
      console.error("Error fetching compliance alerts:", error);
      res.status(500).json({ message: "Failed to fetch compliance alerts" });
    }
  });

  // Update compliance after medicine action (with real-time tracking)
  app.post("/api/compliance/update", isAuthenticated, requireRole("patient"), async (req: any, res) => {
    try {
      const patient = await storage.getPatientByUserId(req.user.claims.sub);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const { scheduleId, action } = req.body; // action: 'taken', 'missed', 'skipped'
      
      const schedule = await storage.getMedicineSchedule(scheduleId);
      if (!schedule || schedule.patientId !== patient.id) {
        return res.status(404).json({ message: "Medicine schedule not found" });
      }

      let updatedSchedule;
      switch (action) {
        case 'taken':
          updatedSchedule = await storage.markMedicineAsTaken(scheduleId);
          break;
        case 'missed':
          updatedSchedule = await storage.markMedicineAsMissed(scheduleId);
          break;
        case 'skipped':
          updatedSchedule = await storage.markMedicineAsSkipped(scheduleId, req.body.reason);
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      // Real-time compliance update
      const medicine = await storage.getMedicine(schedule.medicineId);
      if (medicine) {
        await storage.updateDailyCompliance(patient.id, medicine.prescriptionId, new Date());
      }

      // Get updated compliance stats
      const complianceRate = await storage.getComplianceRate(patient.id);
      const todaysSchedule = await storage.getTodaysMedicineSchedule(patient.id);
      const overdueMedicines = await storage.getOverdueMedicines(patient.id);

      res.json({
        schedule: updatedSchedule,
        compliance: {
          rate: complianceRate,
          todaysSchedule,
          overdueMedicines,
        },
      });
    } catch (error) {
      console.error("Error updating compliance:", error);
      res.status(500).json({ message: "Failed to update compliance" });
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
