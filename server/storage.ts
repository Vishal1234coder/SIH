// Using blueprint javascript_log_in_with_replit integration
import {
  users,
  hospitals,
  doctors,
  patients,
  prescriptions,
  medicines,
  medicineSchedule,
  reminderSettings,
  chatHistory,
  complianceTracking,
  type User,
  type UpsertUser,
  type Hospital,
  type InsertHospital,
  type Doctor,
  type InsertDoctor,
  type Patient,
  type InsertPatient,
  type Prescription,
  type InsertPrescription,
  type Medicine,
  type InsertMedicine,
  type MedicineSchedule,
  type InsertMedicineSchedule,
  type ReminderSettings,
  type InsertReminderSettings,
  type ChatHistory,
  type InsertChatHistory,
  type ComplianceTracking,
  type InsertComplianceTracking,
  type UserWithRole,
  type PrescriptionWithDetails,
  type MedicineWithSchedule,
  type PatientWithCompliance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, avg } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithRole(id: string): Promise<UserWithRole | undefined>;
  
  // Hospital operations
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getHospital(id: string): Promise<Hospital | undefined>;
  getHospitalsByAdmin(adminId: string): Promise<Hospital[]>;
  getAllHospitals(): Promise<Hospital[]>;
  updateHospital(id: string, updates: Partial<InsertHospital>): Promise<Hospital | undefined>;
  
  // Doctor operations
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: string): Promise<Doctor | undefined>;
  getDoctorsByHospital(hospitalId: string): Promise<Doctor[]>;
  updateDoctor(id: string, updates: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  
  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  getPatientsByDoctor(doctorId: string): Promise<PatientWithCompliance[]>;
  getPatientsByHospital(hospitalId: string): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Prescription operations
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: string): Promise<PrescriptionWithDetails | undefined>;
  getPrescriptionsByPatient(patientId: string): Promise<PrescriptionWithDetails[]>;
  getPrescriptionsByDoctor(doctorId: string): Promise<PrescriptionWithDetails[]>;
  updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Medicine operations
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicinesByPrescription(prescriptionId: string): Promise<Medicine[]>;
  getMedicinesForPatient(patientId: string): Promise<MedicineWithSchedule[]>;
  updateMedicine(id: string, updates: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  
  // Medicine schedule operations
  createMedicineSchedule(schedule: InsertMedicineSchedule): Promise<MedicineSchedule>;
  getMedicineSchedule(id: string): Promise<MedicineSchedule | undefined>;
  getTodaysMedicineSchedule(patientId: string): Promise<MedicineSchedule[]>;
  getOverdueMedicines(patientId: string): Promise<MedicineSchedule[]>;
  updateMedicineSchedule(id: string, updates: Partial<InsertMedicineSchedule>): Promise<MedicineSchedule | undefined>;
  markMedicineAsTaken(scheduleId: string): Promise<MedicineSchedule | undefined>;
  markMedicineAsSkipped(scheduleId: string, reason?: string): Promise<MedicineSchedule | undefined>;
  
  // Reminder operations
  createReminderSettings(settings: InsertReminderSettings): Promise<ReminderSettings>;
  getReminderSettings(patientId: string): Promise<ReminderSettings[]>;
  updateReminderSettings(id: string, updates: Partial<InsertReminderSettings>): Promise<ReminderSettings | undefined>;
  
  // Chat operations
  saveChatHistory(chat: InsertChatHistory): Promise<ChatHistory>;
  getChatHistory(userId: string, limit?: number): Promise<ChatHistory[]>;
  
  // Compliance tracking
  getComplianceRate(patientId: string, days?: number): Promise<number>;
  updateDailyCompliance(patientId: string, prescriptionId: string, date: Date): Promise<void>;
  getComplianceTracking(patientId: string, startDate: Date, endDate: Date): Promise<ComplianceTracking[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithRole(id: string): Promise<UserWithRole | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    let additionalData = {};

    if (user.role === "doctor") {
      const doctor = await this.getDoctorByUserId(id);
      if (doctor) {
        const hospital = await this.getHospital(doctor.hospitalId);
        additionalData = {
          doctorId: doctor.id,
          hospitalId: doctor.hospitalId,
          hospitalName: hospital?.name,
        };
      }
    } else if (user.role === "patient") {
      const patient = await this.getPatientByUserId(id);
      if (patient) {
        const hospital = await this.getHospital(patient.hospitalId);
        additionalData = {
          patientId: patient.id,
          hospitalId: patient.hospitalId,
          hospitalName: hospital?.name,
        };
      }
    } else if (user.role === "hospital_admin") {
      const [hospital] = await db.select().from(hospitals).where(eq(hospitals.adminId, id));
      if (hospital) {
        additionalData = {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
        };
      }
    }

    return { ...user, ...additionalData };
  }

  // Hospital operations
  async createHospital(hospitalData: InsertHospital): Promise<Hospital> {
    const [hospital] = await db.insert(hospitals).values(hospitalData).returning();
    return hospital;
  }

  async getHospital(id: string): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async getHospitalsByAdmin(adminId: string): Promise<Hospital[]> {
    return await db.select().from(hospitals).where(eq(hospitals.adminId, adminId));
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals).where(eq(hospitals.isActive, true));
  }

  async updateHospital(id: string, updates: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const [hospital] = await db
      .update(hospitals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    return hospital;
  }

  // Doctor operations
  async createDoctor(doctorData: InsertDoctor): Promise<Doctor> {
    const [doctor] = await db.insert(doctors).values(doctorData).returning();
    return doctor;
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  }

  async getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
    return await db.select().from(doctors).where(and(
      eq(doctors.hospitalId, hospitalId),
      eq(doctors.isActive, true)
    ));
  }

  async updateDoctor(id: string, updates: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const [doctor] = await db
      .update(doctors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor;
  }

  // Patient operations
  async createPatient(patientData: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(patientData).returning();
    return patient;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async getPatientsByDoctor(doctorId: string): Promise<PatientWithCompliance[]> {
    const patientList = await db
      .select({
        patient: patients,
        user: users,
        hospital: hospitals,
      })
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id))
      .leftJoin(hospitals, eq(patients.hospitalId, hospitals.id))
      .where(and(
        eq(patients.primaryDoctorId, doctorId),
        eq(patients.isActive, true)
      ));

    const result: PatientWithCompliance[] = [];
    
    for (const row of patientList) {
      if (row.patient && row.user && row.hospital) {
        const complianceRate = await this.getComplianceRate(row.patient.id);
        
        // Get latest medicine schedule for this patient
        const [latestSchedule] = await db
          .select()
          .from(medicineSchedule)
          .where(and(
            eq(medicineSchedule.patientId, row.patient.id),
            eq(medicineSchedule.status, "taken")
          ))
          .orderBy(desc(medicineSchedule.takenAt))
          .limit(1);

        // Get next due medicine
        const [nextDue] = await db
          .select()
          .from(medicineSchedule)
          .where(and(
            eq(medicineSchedule.patientId, row.patient.id),
            eq(medicineSchedule.status, "pending"),
            gte(medicineSchedule.scheduledAt, new Date())
          ))
          .orderBy(medicineSchedule.scheduledAt)
          .limit(1);

        result.push({
          ...row.patient,
          user: row.user,
          hospital: row.hospital,
          complianceRate,
          lastMedicineTaken: latestSchedule?.takenAt?.toISOString(),
          nextDue: nextDue?.scheduledAt?.toISOString(),
        });
      }
    }

    return result;
  }

  async getPatientsByHospital(hospitalId: string): Promise<Patient[]> {
    return await db.select().from(patients).where(and(
      eq(patients.hospitalId, hospitalId),
      eq(patients.isActive, true)
    ));
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  // Medicine schedule operations
  async createMedicineSchedule(scheduleData: InsertMedicineSchedule): Promise<MedicineSchedule> {
    const [schedule] = await db.insert(medicineSchedule).values(scheduleData).returning();
    return schedule;
  }

  async getMedicineSchedule(id: string): Promise<MedicineSchedule | undefined> {
    const [schedule] = await db.select().from(medicineSchedule).where(eq(medicineSchedule.id, id));
    return schedule;
  }

  async getTodaysMedicineSchedule(patientId: string): Promise<MedicineSchedule[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(medicineSchedule)
      .where(and(
        eq(medicineSchedule.patientId, patientId),
        gte(medicineSchedule.scheduledAt, startOfDay),
        lte(medicineSchedule.scheduledAt, endOfDay)
      ))
      .orderBy(medicineSchedule.scheduledAt);
  }

  async getOverdueMedicines(patientId: string): Promise<MedicineSchedule[]> {
    const now = new Date();
    return await db
      .select()
      .from(medicineSchedule)
      .where(and(
        eq(medicineSchedule.patientId, patientId),
        eq(medicineSchedule.status, "pending"),
        lte(medicineSchedule.scheduledAt, now)
      ))
      .orderBy(medicineSchedule.scheduledAt);
  }

  async updateMedicineSchedule(id: string, updates: Partial<InsertMedicineSchedule>): Promise<MedicineSchedule | undefined> {
    const [schedule] = await db
      .update(medicineSchedule)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicineSchedule.id, id))
      .returning();
    return schedule;
  }

  async markMedicineAsTaken(scheduleId: string): Promise<MedicineSchedule | undefined> {
    return await this.updateMedicineSchedule(scheduleId, {
      status: "taken",
      takenAt: new Date(),
    });
  }

  async markMedicineAsSkipped(scheduleId: string, reason?: string): Promise<MedicineSchedule | undefined> {
    return await this.updateMedicineSchedule(scheduleId, {
      status: "skipped",
      skippedReason: reason,
    });
  }

  // Compliance tracking
  async getComplianceRate(patientId: string, days: number = 7): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        total: sql<number>`count(*)`,
        taken: sql<number>`count(case when status = 'taken' then 1 end)`,
      })
      .from(medicineSchedule)
      .where(and(
        eq(medicineSchedule.patientId, patientId),
        gte(medicineSchedule.scheduledAt, startDate)
      ));

    const stats = result[0];
    if (!stats || stats.total === 0) return 0;
    
    return Math.round((stats.taken / stats.total) * 100);
  }

  async updateDailyCompliance(patientId: string, prescriptionId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        total: sql<number>`count(*)`,
        taken: sql<number>`count(case when status = 'taken' then 1 end)`,
        skipped: sql<number>`count(case when status = 'skipped' then 1 end)`,
      })
      .from(medicineSchedule)
      .where(and(
        eq(medicineSchedule.patientId, patientId),
        gte(medicineSchedule.scheduledAt, startOfDay),
        lte(medicineSchedule.scheduledAt, endOfDay)
      ));

    const stats = result[0];
    if (stats && stats.total > 0) {
      const compliancePercentage = (stats.taken / stats.total) * 100;

      await db
        .insert(complianceTracking)
        .values({
          patientId,
          prescriptionId,
          date: startOfDay,
          totalDoses: stats.total,
          takenDoses: stats.taken,
          skippedDoses: stats.skipped,
          compliancePercentage: compliancePercentage.toString(),
        })
        .onConflictDoUpdate({
          target: [complianceTracking.patientId, complianceTracking.date],
          set: {
            totalDoses: stats.total,
            takenDoses: stats.taken,
            skippedDoses: stats.skipped,
            compliancePercentage: compliancePercentage.toString(),
            updatedAt: new Date(),
          },
        });
    }
  }

  async getComplianceTracking(patientId: string, startDate: Date, endDate: Date): Promise<ComplianceTracking[]> {
    return await db
      .select()
      .from(complianceTracking)
      .where(and(
        eq(complianceTracking.patientId, patientId),
        gte(complianceTracking.date, startDate),
        lte(complianceTracking.date, endDate)
      ))
      .orderBy(complianceTracking.date);
  }

  // Placeholder implementations for remaining methods
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [result] = await db.insert(prescriptions).values(prescription).returning();
    return result;
  }

  async getPrescription(id: string): Promise<PrescriptionWithDetails | undefined> {
    // Implementation placeholder - would join with doctors, patients, hospitals, medicines
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription as any; // TODO: implement proper join
  }

  async getPrescriptionsByPatient(patientId: string): Promise<PrescriptionWithDetails[]> {
    return []; // TODO: implement
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<PrescriptionWithDetails[]> {
    return []; // TODO: implement
  }

  async updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [prescription] = await db
      .update(prescriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return prescription;
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const [result] = await db.insert(medicines).values(medicine).returning();
    return result;
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine;
  }

  async getMedicinesByPrescription(prescriptionId: string): Promise<Medicine[]> {
    return await db.select().from(medicines).where(eq(medicines.prescriptionId, prescriptionId));
  }

  async getMedicinesForPatient(patientId: string): Promise<MedicineWithSchedule[]> {
    return []; // TODO: implement with proper joins
  }

  async updateMedicine(id: string, updates: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const [medicine] = await db
      .update(medicines)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicines.id, id))
      .returning();
    return medicine;
  }

  async createReminderSettings(settings: InsertReminderSettings): Promise<ReminderSettings> {
    const [result] = await db.insert(reminderSettings).values(settings).returning();
    return result;
  }

  async getReminderSettings(patientId: string): Promise<ReminderSettings[]> {
    return await db.select().from(reminderSettings).where(eq(reminderSettings.patientId, patientId));
  }

  async updateReminderSettings(id: string, updates: Partial<InsertReminderSettings>): Promise<ReminderSettings | undefined> {
    const [settings] = await db
      .update(reminderSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reminderSettings.id, id))
      .returning();
    return settings;
  }

  async saveChatHistory(chat: InsertChatHistory): Promise<ChatHistory> {
    const [result] = await db.insert(chatHistory).values(chat).returning();
    return result;
  }

  async getChatHistory(userId: string, limit: number = 50): Promise<ChatHistory[]> {
    return await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      .orderBy(desc(chatHistory.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();