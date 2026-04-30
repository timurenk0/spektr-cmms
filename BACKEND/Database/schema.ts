import {
  pgTable,
  text,
  serial,
  integer,
  date,
  timestamp,
  check,
  index,
  unique,
  doublePrecision,
  boolean,
  varchar,
  char
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


// Database tables schemas


// Activities table schema
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id),
    userId: integer("user_id").notNull().references(() => users.id),
    equipmentId: integer("equipment_id"),
    username: varchar("username", { length: 255 }).notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    description: varchar("description", { length: 511 }).notNull(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  check("action_check", sql`action IN ('add', 'delete', 'update')`)
]);

export const insertActivitySchema = createInsertSchema(activities).omit({
    id: true,
    createdAt: true
});

// Components table schema
export const components = pgTable("components", {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id").notNull().references(()=>equipments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
    partNumber: varchar("part_number", { length: 255 }).notNull(),
    stock: integer("recommended_stock").notNull(),
    failImpact: varchar("fail_impact", { length: 255 }).notNull(),
    notes: varchar("notes", { length: 511 })
}, (table) => ({
    uniqueNamePerEquipment: unique().on(table.equipmentId, table.name)
}));

export const insertComponentSchema = createInsertSchema(components).omit({
    id: true
});

// Documents table schema
export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    notes: varchar("notes", { length: 255 })
}, (table) => [
    check("category_check", sql`category IN ('manual', 'maintenance', 'certificate', 'premob', 'fault', 'emergency', 'other')`)
]);

export const insertDocumentSchema = createInsertSchema(documents).omit({
    id: true,
    uploadedAt: true
});

// Equipment table schema
export const equipments = pgTable(
  "equipments",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(()=>tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    assetId: varchar("asset_id", { length: 255 }).notNull(),
    serialNumber: varchar("serial_number", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 }).notNull().default("operational"),
    dateOfManufacturing: date("date_of_manufacturing").notNull(),
    inServiceDate: date("in_service_date").notNull(),
    usefulLifeSpan: integer("useful_life_span").notNull(),
    totalWorkingHours: integer("total_working_hours"),
    requirements: varchar("requirements", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    department: varchar("department", { length: 255 }).notNull(),
    equipmentImage: text("equipment_image").notNull(),
    healthIndex: doublePrecision("health_index"),
    notes: varchar("notes", { length: 511 }),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow()
  },
  (table) => [
    check(
      "requirements_check",
      sql`requirements IN ('calibration & testing', 'maintenance', 'both')`
    ),
    check(
      "status_check",
      sql`status IN ('operational', 'under repair', 'out of service')`
    ),
    unique("unique_asset_id_per_tenant").on(table.tenantId, table.assetId),
    unique("unique_serial_number_per_tenant").on(table.tenantId, table.serialNumber),
    ]
);

export const insertEquipmentSchema = createInsertSchema(equipments).omit({
    id: true,
    uploadedAt: true
});

// Maintenance table schema
export const maintenances = pgTable("maintenances", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(()=>tenants.id, { onDelete: "cascade" }),
  givenHealthIndex: integer("given_health_index").notNull().default(100),
  dailyWorkingHours: integer("daily_working_hours"),
  serviceStartDate: date("service_start_date").notNull().defaultNow(),
  serviceEndDate: date("service_end_date").notNull().defaultNow(),
  levelAHours: integer("level_a_hours").notNull(),
  levelADuration: integer("level_a_duration").notNull().default(0),
  levelBDuration: integer("level_b_duration").notNull().default(0),
  levelBHours: integer("level_b_hours").notNull().default(0),
  levelCDuration: integer("level_c_duration").notNull().default(0),
  levelCHours: integer("level_c_hours").notNull().default(0),
  levelDDuration: integer("level_d_duration").notNull().default(0),
  levelDHours: integer("level_d_hours").notNull().default(0),
  levelIDuration: integer("level_i_duration").notNull().default(0),
  levelIMonths: integer("level_i_months").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  tenantId: integer("tenant_id").notNull().references(()=>tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 511 }).notNull(),
  level: char("level").notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  start: date("start_date").notNull(),
  end: date("end_date"), // nullable for emergency events
  reason: varchar("reason", { length: 255 }),
  scheduledAt: date("scheduled_at").notNull().defaultNow(),
  performedAt: date("performed_at")
}, (table) => [ 
    check("level_check", sql`level IN ('A', 'B', 'C', 'D', 'E', 'I')`),
    check("status_check", sql`status IN ('complete', 'incomplete', 'pending')`),
    index("idx_maintenance_events_maintenance_id").on(table.maintenanceId),
    index("idx_me_tenant_equipment_id").on(table.tenantId, table.equipmentId, table.start),
    index("idx_maintenance_events_start_date").on(table.start),
    index("idx_maintenance_events_status").on(table.status),
    // unique("unique_equipment_start_level").on(table.equipmentId, table.start, table.level)
]);

export const insertMaintenanceEventSchema = createInsertSchema(maintenanceEvents).omit({
    id: true
});

// Photos table schema
export const photos = pgTable("photos", {
    id: serial("id").primaryKey(),
    equipmentId: integer("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
    id: true,
    uploadedAt: true
});

// Tenant table schema
export const tenants = pgTable("tenants", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique()
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
    id: true
});

// User table scheme
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(()=>tenants.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});


// Export types
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Component = typeof components.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type Maintenance = typeof maintenances.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type MaintenanceEvent = typeof maintenanceEvents.$inferSelect;
export type InsertMaintenanceEvent = z.infer<typeof insertMaintenanceEventSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;


// Define table relations
export const activitiesRelations = relations(activities, ({ one }) => ({
    tenant: one(tenants, {
        fields: [activities.tenantId],
        references: [tenants.id]
    }),
    user: one(users, {
        fields: [activities.userId],
        references: [users.id]
    })
}));

export const componentsRelations = relations(components, ({ one }) => ({
    equipment: one(equipments, {
        fields: [components.equipmentId],
        references: [equipments.id]
    })
}))

export const documentsRelations = relations(documents, ({ one }) => ({
    equipment: one(equipments, {
        fields: [documents.equipmentId],
        references: [equipments.id]
    })
}));

export const equipmentRelations = relations(equipments, ({ one, many }) => ({
    activities: many(activities),
    components: many(components),
    document: many(documents),
    maintenances: many(maintenances),
    maintenanceEvents: many(maintenanceEvents),
    photos: many(photos),
    tenant: one(tenants, {
        fields: [equipments.tenantId],
        references: [tenants.id]
    })
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

export const tenantRelations = relations(tenants, ({ many }) => ({
    activities: many(activities),
    equipments: many(equipments),
    maintenances: many(maintenances),
    maintenanceEvents: many(maintenanceEvents),
    users: many(users),    
}))

export const userRelations = relations(users, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [users.tenantId],
        references: [tenants.id]
    }),
    activities: many(activities),
}));