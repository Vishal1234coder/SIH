import type { RequestHandler } from "express";
import { storage } from "../storage";

export type UserRole = "super_admin" | "hospital_admin" | "doctor" | "patient";

// Role-based authorization middleware
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: No user ID" });
      }

      const user = await storage.getUserWithRole(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({ 
          message: `Forbidden: Requires role ${allowedRoles.join(" or ")}` 
        });
      }

      // Attach user info to request for downstream use
      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
}

// Middleware to ensure doctor can only access their own patients
export const requireDoctorOfPatient: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const patientId = req.params.patientId || req.body.patientId;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID required" });
    }

    const doctor = await storage.getDoctorByUserId(userId);
    if (!doctor) {
      return res.status(403).json({ message: "Forbidden: Doctor profile not found" });
    }

    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if this doctor is the primary doctor or in the same hospital
    if (patient.primaryDoctorId !== doctor.id && patient.hospitalId !== doctor.hospitalId) {
      return res.status(403).json({ 
        message: "Forbidden: Not authorized to access this patient" 
      });
    }

    req.currentDoctor = doctor;
    req.currentPatient = patient;
    next();
  } catch (error) {
    console.error("Doctor authorization error:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};

// Middleware to ensure patient can only access their own data
export const requireOwnPatientData: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const requestedPatientId = req.params.patientId || req.body.patientId;

    const patient = await storage.getPatientByUserId(userId);
    if (!patient) {
      return res.status(403).json({ message: "Forbidden: Patient profile not found" });
    }

    // If a specific patient ID is requested, ensure it matches the current user
    if (requestedPatientId && requestedPatientId !== patient.id) {
      return res.status(403).json({ 
        message: "Forbidden: Can only access your own data" 
      });
    }

    req.currentPatient = patient;
    next();
  } catch (error) {
    console.error("Patient authorization error:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};

// Middleware to ensure hospital admin can only access their hospital
export const requireHospitalScope: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const requestedHospitalId = req.params.hospitalId || req.body.hospitalId;

    const user = await storage.getUserWithRole(userId);
    if (!user) {
      return res.status(403).json({ message: "Forbidden: User not found" });
    }

    let userHospitalId: string | undefined;

    if (user.role === "hospital_admin") {
      userHospitalId = user.hospitalId;
    } else if (user.role === "doctor") {
      const doctor = await storage.getDoctorByUserId(userId);
      userHospitalId = doctor?.hospitalId;
    } else if (user.role === "patient") {
      const patient = await storage.getPatientByUserId(userId);
      userHospitalId = patient?.hospitalId;
    }

    if (!userHospitalId) {
      return res.status(403).json({ message: "Forbidden: No hospital association" });
    }

    // If a specific hospital ID is requested, ensure it matches the user's hospital
    if (requestedHospitalId && requestedHospitalId !== userHospitalId) {
      return res.status(403).json({ 
        message: "Forbidden: Can only access your own hospital" 
      });
    }

    req.currentHospitalId = userHospitalId;
    next();
  } catch (error) {
    console.error("Hospital scope authorization error:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};

// Middleware to validate resource ownership for prescriptions
export const requirePrescriptionAccess: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const prescriptionId = req.params.prescriptionId || req.body.prescriptionId;

    if (!prescriptionId) {
      return res.status(400).json({ message: "Prescription ID required" });
    }

    const user = await storage.getUserWithRole(userId);
    if (!user) {
      return res.status(403).json({ message: "Forbidden: User not found" });
    }

    const prescription = await storage.getPrescription(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    let hasAccess = false;

    if (user.role === "super_admin") {
      hasAccess = true;
    } else if (user.role === "doctor") {
      const doctor = await storage.getDoctorByUserId(userId);
      hasAccess = !!(doctor && prescription.doctorId === doctor.id);
    } else if (user.role === "patient") {
      const patient = await storage.getPatientByUserId(userId);
      hasAccess = !!(patient && prescription.patientId === patient.id);
    } else if (user.role === "hospital_admin") {
      hasAccess = user.hospitalId === prescription.hospitalId;
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Forbidden: Not authorized to access this prescription" 
      });
    }

    req.currentPrescription = prescription;
    next();
  } catch (error) {
    console.error("Prescription authorization error:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};