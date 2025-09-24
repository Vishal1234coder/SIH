// Using blueprint javascript_log_in_with_replit integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole, requireHospitalScope, requireOwnPatientData } from "./middleware/auth";

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

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ message: "This is a protected route", userId });
  });

  const httpServer = createServer(app);

  return httpServer;
}
