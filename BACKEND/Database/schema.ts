import {
  pgTable,
  text,
  serial,
  integer,
  decimal,
  date,
  timestamp,
  check,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database tables schemas


// Activities table schema
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    equipmentId: integer("equipment_id").references(() => equipments.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    action: text("action").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  actionCheck: check("action_check", sql`action IN ('add', 'delete', 'update')`)
}));

export const insertActivitySchema = createInsertSchema(activities).omit({
    id: true,
    createdAt: true
});

// Documents table schema
export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull().default("pdf"),
    fileName: text("file_name"),
    category: text("category").notNull(),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    notes: text("notes")
}, (table) => ({
    categoryCheck: check("category_check", sql`category IN ('manual', 'maintenance', 'certificate', 'premob', 'fault', 'emergency', 'other')`)
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
    id: true,
    uploadedAt: true
});

// Equipment table schema
export const equipments = pgTable(
  "equipments",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    manufacturer: text("manufacturer").notNull(),
    model: text("model").notNull(),
    assetId: text("asset_id").notNull(),
    serialNumber: text("serial_number").notNull(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull().default("operational"),
    dateOfManufacturing: date("date_of_manufacturing").notNull(),
    inServiceDate: date("in_service_date").notNull(),
    usefulLifeSpan: integer("useful_life_span").notNull(),
    totalWorkingHours: integer("total_working_hours"),
    requirements: text("requirements").notNull(),
    location: text("location").notNull(),
    department: text("department"),
    equipmentImage: text("equipment_image").notNull(),
    healthIndex: decimal("health_index"),
    notes: text("notes"),
  },
  (table) => ({
    requirementsCheck: check(
      "requirements_check",
      sql`requirements IN ('calibration & testing', 'maintenance', 'both')`
    ),
    statusCheck: check(
      "status_check",
      sql`status IN ('operational', 'under repair', 'out of service')`
    ),
  })
);

export const insertEquipmentSchema = createInsertSchema(equipments).omit({
  id: true,
});

// Maintenance table schema
export const maintenances = pgTable("maintenances", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipments.id, { onDelete: "cascade" }),
  givenHealthIndex: integer("given_health_index").notNull().default(100),
  dailyWorkingHours: integer("daily_working_hours").notNull(),
  serviceStartDate: date("service_start_date").notNull().defaultNow(),
  serviceEndDate: date("service_end_date").notNull().defaultNow(),
  levelAHours: integer("level_a_hours"),
  levelADuration: integer("level_a_duration"),
  levelBDuration: integer("level_b_duration"),
  levelBHours: integer("level_b_hours"),
  levelCDuration: integer("level_c_duration"),
  levelCHours: integer("level_c_hours"),
  levelDDuration: integer("level_d_duration"),
  levelDHours: integer("level_d_hours"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertMaintenanceSchema = createInsertSchema(maintenances).omit({
  id: true,
  createdAt: true,
});

// Maintenance events table schema
export const maintenanceEvents = pgTable("maintenance_events", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
  maintenanceId: integer("maintenance_id").notNull().references(() => maintenances.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  color: text("color").notNull(),
  status: text("status").notNull(),
  start: date("start_date").notNull(),
  end: date("end_date").notNull(),
  scheduledAt: date("scheduledAt").notNull().defaultNow(),
  performedAt: date("performed_at")
}, (table) => ({
    levelCheck: check("level_check", sql`level IN ('A', 'B', 'C', 'D', 'E')`),
    statusCheck: check("status_check", sql`status IN ('upcoming', 'complete', 'overdue', 'incomplete)`),
    maintenanceIdIdx: index("idx_maintenance_events_maintenance_id").on(table.maintenanceId),
    startIdx: index("idx_maintenance_events_start_date").on(table.start),
    uniqueEquipmentStartLevel: unique("unique_equipment_start_level").on(table.equipmentId, table.start, table.level)
}));

export const insertMaintenanceEventSchema = createInsertSchema(maintenanceEvents).omit({
    id: true
});

// Photos table schema
export const photos = pgTable("photos", {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    imageUrl: text("image_url").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    notes: text("notes")
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
    id: true,
    uploadedAt: true
});

// User table scheme
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});


// Export types
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Maintenance = typeof maintenances.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type MaintenanceEvent = typeof maintenanceEvents.$inferSelect;
export type InsertMaintenanceEvent = z.infer<typeof insertMaintenanceEventSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;


// Define table relations
export const activitiesRelations = relations(activities, ({ one }) => ({
    user: one(users, {
        fields: [activities.userId],
        references: [users.id]
    })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
    equipment: one(equipments, {
        fields: [documents.equipmentId],
        references: [equipments.id]
    })
}));

export const equipmentRelations = relations(equipments, ({ many }) => ({
    maintenances: many(maintenances),
    maintenanceEvents: many(maintenanceEvents),
    activities: many(activities),
    document: many(documents),
    photos: many(photos)
}));

export const maintenanceRelations = relations(maintenances, ({ one, many }) => ({
    equipments: one(equipments, {
        fields: [maintenances.equipmentId],
        references: [equipments.id]
    }),
    events: many(maintenanceEvents),
    activities: many(activities)
}));

export const maintenanceEventsRelations = relations(maintenanceEvents, ({ one }) => ({
    equipment: one(equipments, {
        fields: [maintenanceEvents.equipmentId],
        references: [equipments.id]
    }),
    maintenance: one(maintenances, {
        fields: [maintenanceEvents.maintenanceId],
        references: [maintenances.id]
    })
}));

export const photosRelations = relations(photos, ({ one }) => ({
    equipment: one(equipments, {
        fields: [photos.equipmentId],
        references: [equipments.id]
    })
}));

export const userRelations = relations(users, ({ many }) => ({
    activities: many(activities),
}));