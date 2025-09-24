import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (IMPORTANT: mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums for user roles and status
export const userRoleEnum = pgEnum("user_role", ["super_admin", "hospital_admin", "doctor", "patient"]);
export const prescriptionStatusEnum = pgEnum("prescription_status", ["active", "completed", "cancelled"]);
export const medicineStatusEnum = pgEnum("medicine_status", ["pending", "taken", "overdue", "skipped"]);
export const reminderTypeEnum = pgEnum("reminder_type", ["sms", "whatsapp", "ivr", "app"]);

// User storage table (IMPORTANT: mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("patient"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country").default("India"),
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  licenseNumber: varchar("license_number"),
  adminId: varchar("admin_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hospitalId: varchar("hospital_id").references(() => hospitals.id).notNull(),
  specialization: varchar("specialization"),
  licenseNumber: varchar("license_number").notNull(),
  experience: integer("experience"), // years of experience
  qualification: text("qualification"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hospitalId: varchar("hospital_id").references(() => hospitals.id).notNull(),
  primaryDoctorId: varchar("primary_doctor_id").references(() => doctors.id),
  patientId: varchar("patient_id").unique(), // hospital-specific patient ID
  age: integer("age"),
  gender: varchar("gender"),
  bloodGroup: varchar("blood_group"),
  emergencyContact: varchar("emergency_contact"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  doctorId: varchar("doctor_id").references(() => doctors.id).notNull(),
  hospitalId: varchar("hospital_id").references(() => hospitals.id).notNull(),
  prescriptionNumber: varchar("prescription_number").unique().notNull(),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  status: prescriptionStatusEnum("status").default("active"),
  prescribedAt: timestamp("prescribed_at").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medicines table
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id).notNull(),
  name: varchar("name").notNull(),
  genericName: varchar("generic_name"),
  dosage: varchar("dosage").notNull(), // e.g., "500mg", "1 tablet"
  frequency: varchar("frequency").notNull(), // e.g., "twice daily", "every 8 hours"
  timing: varchar("timing"), // e.g., "after breakfast", "before sleep"
  duration: varchar("duration"), // e.g., "7 days", "2 weeks"
  instructions: text("instructions"),
  sideEffects: text("side_effects"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medicine schedule table (for individual doses)
export const medicineSchedule = pgTable("medicine_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicineId: varchar("medicine_id").references(() => medicines.id).notNull(),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: medicineStatusEnum("status").default("pending"),
  takenAt: timestamp("taken_at"),
  skippedReason: text("skipped_reason"),
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminders configuration table
export const reminderSettings = pgTable("reminder_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  reminderType: reminderTypeEnum("reminder_type").notNull(),
  enabled: boolean("enabled").default(true),
  minutesBefore: integer("minutes_before").default(30), // remind X minutes before
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI chat history table
export const chatHistory = pgTable("chat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  messageType: varchar("message_type").default("medication_query"), // medication_query, side_effect, general
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance tracking table
export const complianceTracking = pgTable("compliance_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id).notNull(),
  date: timestamp("date").notNull(),
  totalDoses: integer("total_doses").notNull(),
  takenDoses: integer("taken_doses").notNull(),
  skippedDoses: integer("skipped_doses").notNull(),
  compliancePercentage: decimal("compliance_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = typeof hospitals.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = typeof medicines.$inferInsert;

export type MedicineSchedule = typeof medicineSchedule.$inferSelect;
export type InsertMedicineSchedule = typeof medicineSchedule.$inferInsert;

export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = typeof reminderSettings.$inferInsert;

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

export type ComplianceTracking = typeof complianceTracking.$inferSelect;
export type InsertComplianceTracking = typeof complianceTracking.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  phoneNumber: true,
  dateOfBirth: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicineScheduleSchema = createInsertSchema(medicineSchedule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatHistorySchema = createInsertSchema(chatHistory).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSettingsSchema = createInsertSchema(reminderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceTrackingSchema = createInsertSchema(complianceTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Composite types for API responses
export type UserWithRole = User & {
  hospitalId?: string;
  hospitalName?: string;
  doctorId?: string;
  patientId?: string;
};

export type PrescriptionWithDetails = Prescription & {
  doctorName: string;
  patientName: string;
  hospitalName: string;
  medicines: Medicine[];
};

export type MedicineWithSchedule = Medicine & {
  nextDose?: MedicineSchedule;
  todaysSchedule: MedicineSchedule[];
  complianceRate: number;
};

export type PatientWithCompliance = Patient & {
  user: User;
  doctor?: Doctor & { user: User };
  hospital: Hospital;
  complianceRate: number;
  lastMedicineTaken?: string;
  nextDue?: string;
};