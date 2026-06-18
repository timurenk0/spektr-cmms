import {
    activities, type Activity, type InsertActivity,
    components, type Component, type InsertComponent,
    documents, type Document, type InsertDocument,
    equipments, type Equipment, type InsertEquipment,
    maintenances, type Maintenance, type InsertMaintenance,
    maintenanceEvents, type MaintenanceEvent, type InsertMaintenanceEvent,
    photos, type Photo, type InsertPhoto,
    tenants, type Tenant, type InsertTenant,
    users, type User, type InsertUser,
} from "./Database/schema";
import * as schema from "./Database/schema";
import { db } from "./Database/db";
import { eq, and, asc, desc, sql, not, ExtractTablesWithRelations, lt, gte, lte, ilike, or, getTableColumns, gt, count } from "drizzle-orm";
import type { NeonDatabase, NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { differenceInCalendarMonths, differenceInDays } from "date-fns";
import { createMaintenanceEvents } from "./Middleware/EventManager";
import { CustomApiError } from "./Utils/errorBuilder";
import { PgTransaction } from "drizzle-orm/pg-core";


type Schema = typeof schema;
type Transaction = PgTransaction<NeonQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;


export class DatabaseStorage {
    // User methods
    /* ===================================================== User Methods ===================================================== */
    async getUsers(): Promise<Pick<User, "id" | "username" | "role" | "firstName" | "lastName">[]> {
        return await db.select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role            
        }).from(users);
    };

    async getUser(id: number): Promise<Pick<User, "id" | "username" | "role" | "firstName" | "lastName"> | undefined> {
        return (await db.select({id: users.id, username: users.username, role: users.role, firstName: users.firstName, lastName: users.lastName}).from(users).where(eq(users.id, id)))[0];
    }

    async getUserRoles(): Promise<string[]> {
        return (await db.selectDistinct({ role: users.role }).from(users).where(not(eq(users.role, "admin")))).map(r=>r.role);
    }

    async getUserByUsername(username: string): Promise<Pick<User, "id" | "username" | "role"> | undefined> {
        return (await db.select({id: users.id, username: users.username, role: users.role}).from(users).where(eq(users.username, username)))[0];
    }

    private async fetchUserByUsername(username: string): Promise<User | undefined> {
        return (await db.select().from(users).where(eq(users.username, username)))[0];
    }

    async addUser(insertUser: InsertUser): Promise<User> {
        const hashedPW = await bcrypt.hash(insertUser.password, 10);
        const [user] = await db.insert(users).values({
            ...insertUser,
            password: hashedPW
        }).returning();

        return user;
    }

    async loginUser(username: string, pw: string): Promise<{token: string, user: Partial<User>}> {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error("JWT_SECRET variables must be set");

        try {
            const user = await this.fetchUserByUsername(username);
            if (!user) throw new Error("User not found.");

            const isMatch = await bcrypt.compare(pw, user.password);
            if (!isMatch) throw new Error("User credentials are incorrect.");

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    tenantId: user.tenantId,
                    iat: Math.floor(Date.now() / 1000)
                },
                jwtSecret,
                {
                    expiresIn: "1d"
                }
            );

            const { password: _, ...userData } = user;
            return { token, user: userData };
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to login user: ${msg}`);
        }
    }
    /* ======================================================================================================================== */

    /* ================================================= Tenants Methods ====================================================== */
    async getTenants(): Promise<Tenant[]> {
        return await db.select().from(tenants);
    }

    async getTenant(id: number): Promise<Tenant | undefined> {
        return (await db.select().from(tenants).where(eq(tenants.id, id)))[0];
    }

    async addTenant(insertTenant: InsertTenant): Promise<Tenant> {
        const [tenant] = await db.insert(tenants).values(insertTenant).onConflictDoNothing({ target: tenants.name }).returning();
        if (tenant) return tenant;
        
        const [existing] = await db.select().from(tenants).where(eq(tenants.name, insertTenant.name));
        return existing;
    }
    /* ======================================================================================================================== */

    /* ================================================ Equipment Methods ===================================================== */
    async getEquipments(tenant: number, concise?:string, limit?: number, page?: number, location?: string, status?: string, type?: string, category?: string, search?: string): Promise<{equips: (Partial<Equipment>)[], totalCount: number}> {
        const filters = [];

        if (tenant !== 1) {
            filters.push(eq(equipments.tenantId, tenant));
        }
        if (location) filters.push(eq(equipments.location, location));
        if (status) filters.push(eq(equipments.status, status));
        if (type) filters.push(eq(equipments.type, type));
        if (category) filters.push(eq(equipments.category, category));
        if (search) {
            filters.push(
                or(
                    ilike(equipments.name, `%${search}%`),
                    ilike(equipments.assetId, `%${search}%`),
                    ilike(equipments.serialNumber, `%${search}%`),
                    ilike(equipments.model, `%${search}%`),
                )
            );
        };

        const whereClause = filters.length ? and(...filters) : undefined;

        const lastEventSubquery = db
            .select({
                lastEvent: maintenanceEvents.start,
            })
            .from(maintenanceEvents)
            .where(
                and(
                eq(maintenanceEvents.equipmentId, equipments.id),
                lt(maintenanceEvents.start, sql`CURRENT_DATE`),
                ),
            )
            .orderBy(desc(maintenanceEvents.start))
            .limit(1)
            .as("last_event");


        const nextEventSubquery = db
            .select({
                nextEvent: maintenanceEvents.start,
            })
            .from(maintenanceEvents)
            .where(
                and(
                eq(maintenanceEvents.equipmentId, equipments.id),
                gt(maintenanceEvents.start, sql`CURRENT_DATE`),
                ),
            )
            .orderBy(asc(maintenanceEvents.start))
            .limit(1)
            .as("next_event");


        let query = db
            .select(
                concise === "true" ? {
                    id: equipments.id,
                    tenantId: equipments.tenantId,
                    name: equipments.name,
                    assetId: equipments.assetId,
                    equipmentImage: equipments.equipmentImage,
                    status: equipments.status,
                    hadOverhaul: equipments.hadOverhaul,
                    lastEvent: lastEventSubquery.lastEvent,
                    nextEvent: nextEventSubquery.nextEvent,
                    totalWorkingHours: equipments.totalWorkingHours
                } : {
                    ...getTableColumns(equipments),
                    lastEvent: lastEventSubquery.lastEvent,
                    nextEvent: nextEventSubquery.nextEvent,
                }
            )
            .from(equipments)
            .where(whereClause)
            .leftJoinLateral(lastEventSubquery, sql`true`)
            .leftJoinLateral(nextEventSubquery, sql`true`)
            .orderBy(equipments.id)
            .offset(limit && page ? (page - 1) * limit : 0)
            .$dynamic();
        
        if (limit !== undefined && limit > 0) {
            query = query.limit(limit)
        }
        
        const count = await db.select({ count: sql<number>`count(*)` }).from(equipments).where(whereClause);
        const data = await query;


        return { equips: data, totalCount: count[0].count }
    }
    
    async getEquipment(id: number): Promise<Equipment | undefined> {
        // return (await db.select().from(equipments).where(eq(equipments.id, id)))[0]
        const lastEventSubquery = db
                                        .select({ lastEvent: maintenanceEvents.start })
                                        .from(maintenanceEvents)
                                        .where(
                                            and(
                                                eq(maintenanceEvents.equipmentId, id),
                                                lt(maintenanceEvents.start, sql`CURRENT_DATE`)
                                            )
                                        )
                                        .orderBy(desc(maintenanceEvents.start))
                                        .limit(1)
                                        .as("last_event")
        
        const nextEventSubquery = db
                                        .select({ nextEvent: maintenanceEvents.start })
                                        .from(maintenanceEvents)
                                        .where(
                                            and(
                                                eq(maintenanceEvents.equipmentId, id),
                                                gt(maintenanceEvents.start, sql`CURRENT_DATE`)
                                            )
                                        )
                                        .orderBy(asc(maintenanceEvents.start))
                                        .limit(1)
                                        .as("next_event")

        return (
            await db.select(
                {
                    ...getTableColumns(equipments),
                    lastEvent: lastEventSubquery.lastEvent,
                    nextEvent: nextEventSubquery.nextEvent,
                }
            )
                    .from(equipments)
                    .where(eq(equipments.id, id))
                    .leftJoinLateral(lastEventSubquery, sql`true`)
                    .leftJoinLateral(nextEventSubquery, sql`true`)
        )[0];
    }

    async getEquipmentLocations(): Promise<string[]> {
        return (await db.selectDistinct({ location: equipments.location }).from(equipments)).map(loc=>loc.location);
    }

    async getEquipmentStatusCount(tenantId: number): Promise<{ operational: number, underRepair: number, outOfService: number } | undefined> {
        const operationalCount = await db.select({ count: count() }).from(equipments).where(and(eq(equipments.tenantId, tenantId), eq(equipments.status, "operational")));
        const underRepairCount = await db.select({ count: count() }).from(equipments).where(and(eq(equipments.tenantId, tenantId), eq(equipments.status, "under repair")));
        const outOfServiceCount = await db.select({ count: count() }).from(equipments).where(and(eq(equipments.tenantId, tenantId), eq(equipments.status, "out of service")));
        
        return { operational: operationalCount[0].count, underRepair: underRepairCount[0].count, outOfService: outOfServiceCount[0].count }
    }
    
    async addEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
        return (await db.insert(equipments).values(insertEquipment).returning())[0];
    }
    
    async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
        const [equipment] = await db.update(equipments).set(updateData).where(eq(equipments.id, id)).returning();

        return equipment;
    }
    
    async deleteEquipment(id: number): Promise<void> {
        try {
            await db.delete(equipments).where(eq(equipments.id, id));
        } catch (error) {
            throw error;   
        }
    }
    /* ======================================================================================================================== */
    
    /* ================================================ Maintenance Methods =================================================== */
    async getMaintenances(tenantId: number): Promise<(Maintenance & { totalCount: number, completeCount: number, overdueCount: number, pendingCount: number })[]> {
        const isAdmin = tenantId === 1;

        // Proper Drizzle conditions (not raw WHERE strings)
        const maintenanceEventCondition = isAdmin 
            ? undefined 
            : eq(maintenanceEvents.tenantId, tenantId);

        const maintenanceCondition = isAdmin 
            ? undefined 
            : eq(maintenances.tenantId, tenantId);
        
        const eventCounts = db.select({
            equipmentId: maintenanceEvents.equipmentId,
            totalCount: sql<number>`COUNT(*)`.as("total_count"),
            completeCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceEvents.status} = 'complete')`.as("complete_count"),
            overdueCount: sql<number>`COUNT(*) FILTER (WHERE CURRENT_DATE - ${maintenanceEvents.scheduledAt} > 3)`.as("overdue_count"),
            pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceEvents.status} = 'pending')`.as("pending_count"),
        }).from(maintenanceEvents).where(maintenanceEventCondition).groupBy(maintenanceEvents.equipmentId).as("event_counts")
        
        return await db.select({
            ...getTableColumns(maintenances),
            totalCount: sql<number>`COALESCE(event_counts.total_count, 0)`.as("totalCount"),
            completeCount: sql<number>`COALESCE(event_counts.complete_count, 0)`.as("completeCount"),
            overdueCount: sql<number>`COALESCE(event_counts.overdue_count, 0)`.as("overdueCount"),
            pendingCount: sql<number>`COALESCE(event_counts.pending_count, 0)`.as("pendingCount"),
        }).from(maintenances).where(maintenanceCondition).leftJoin(eventCounts, eq(maintenances.equipmentId, eventCounts.equipmentId));
    }
    
    async getMaintenance(id: number): Promise<Maintenance | undefined> {
        return (await db.select().from(maintenances).where(eq(maintenances.id, id)))[0];
    }
    
    async getMainteancesByEquipmentId(id: number): Promise<Maintenance | undefined> {
        return (await db.select().from(maintenances).where(eq(maintenances.equipmentId, id)))[0];
    }
    
    async addMaintenance(insertMaintenance: InsertMaintenance, equipment: Equipment, transaction?: NeonDatabase<Schema>): Promise<Maintenance> {
        const hasValidLevels = [
            { duration: insertMaintenance.levelADuration, hours: insertMaintenance.levelAHours },
            { duration: insertMaintenance.levelBDuration, hours: insertMaintenance.levelBHours },
            { duration: insertMaintenance.levelCDuration, hours: insertMaintenance.levelCHours },
            { duration: insertMaintenance.levelDDuration, hours: insertMaintenance.levelDHours },
            { duration: insertMaintenance.levelIDuration1, hours: insertMaintenance.levelIMonths1 },
            { duration: insertMaintenance.levelIDuration2, hours: insertMaintenance.levelIMonths2 },
        ].some(level => level.duration && level.duration > 0 && level.hours && level.hours > 0);
        // if (!hasValidLevels) throw new Error("At least one maintenance level must have hours/duration values > 0");
        if (!hasValidLevels) throw new CustomApiError({
            code: "VALIDATION_ERROR",
            message: "At least one of levels should have both hours and duration values",
            suggestion: "Double-check the submitted form fields",
            status: 400
        });
        
        const tx = transaction || db;
        return await tx.transaction(async (tx: Transaction) => {
            try {
                const [maintenance] = await tx.insert(maintenances).values(insertMaintenance).returning();
                console.log(maintenance);
                
                const events = createMaintenanceEvents(maintenance, equipment, undefined, undefined);
                await tx.insert(maintenanceEvents).values(events).returning();    
                
                return maintenance;
            } catch (error) {
                throw error;
            }
        })
    };
    
    async updateMaintenance(
        id: number,
        updateData: Partial<InsertMaintenance>,
        equipment: Equipment,
        transaction?: NeonDatabase<Schema>
    ): Promise<Maintenance | undefined> {
        const hasValidLevels = [
            { duration: updateData.levelADuration, hours: updateData.levelAHours },
            { duration: updateData.levelBDuration, hours: updateData.levelBHours },
            { duration: updateData.levelCDuration, hours: updateData.levelCHours },
            { duration: updateData.levelDDuration, hours: updateData.levelDHours },
            { duration: updateData.levelIDuration1, hours: updateData.levelIMonths1 },
            { duration: updateData.levelIDuration2, hours: updateData.levelIMonths2 },
        ].some(level => level.duration && level.duration > 0 && level.hours && level.hours > 0);
        if (!hasValidLevels) throw new CustomApiError({
            code: "VALIDATION_ERROR",
            message: "At least one of levels should have both hours and duration values",
            suggestion: "Double-check the submitted form fields",
            status: 400
        });

        const tx = transaction || db;
        return await tx.transaction(async (tx: Transaction) => {
            try {
                const [maintenance] = await db.update(maintenances).set(updateData).where(eq(maintenances.id, id)).returning();
            
                const events = createMaintenanceEvents(maintenance, equipment, undefined, undefined);
                await tx.insert(maintenanceEvents).values(events).returning();

                return maintenance;
            } catch (error) {
                throw error;
            }   
        })
    }
    
    async deleteMaintenance(id: number): Promise<Maintenance | undefined> {
        try {
            const deletedMaintenance = (await db.delete(maintenances).where(eq(maintenances.id, id)).returning())[0];
            return deletedMaintenance;
        } catch (error) {
            throw error;
        }
    }
    /* ======================================================================================================================== */
    
    /* ============================================== Maintenance Events Methods ============================================== */
    async getMaintenanceEvents(tenantId: number, status: "any" | "pending" | "complete" | "incomplete",  start?: string, end?: string): Promise<MaintenanceEvent[]> {
        const tenantCondition = tenantId === 1 ? undefined : eq(maintenanceEvents.tenantId, tenantId);
        const conditions = [tenantCondition];

        if (start && end) {
            conditions.push(gte(maintenanceEvents.start, start), lte(maintenanceEvents.start, end));
        }

        if (status !== "any") {
            conditions.push(eq(maintenanceEvents.status, status));
        }

        const events = await db.select({
            id: maintenanceEvents.id,
            tenantId: maintenanceEvents.tenantId,
            equipmentId: maintenanceEvents.equipmentId,
            maintenanceId: maintenanceEvents.maintenanceId,
            title: maintenanceEvents.title,
            description: maintenanceEvents.description,
            level: maintenanceEvents.level,
            start: maintenanceEvents.start,
            end: sql<string>`
                COALESCE(
                    ${maintenanceEvents.end}::text,
                    to_char(CURRENT_DATE, 'YYYY-MM-DD')
                )
            `,
            scheduledAt: maintenanceEvents.scheduledAt,
            performedAt: maintenanceEvents.performedAt,
            status: maintenanceEvents.status,
            reason: maintenanceEvents.reason,
            isOverdue: sql<boolean>`
                CURRENT_DATE - ${maintenanceEvents.start} > 3 AND ${maintenanceEvents.status} != 'complete'
            `,
            color: sql<string>`
                CASE
                    WHEN ${maintenanceEvents.status} = 'pending' THEN
                        CASE ${maintenanceEvents.level}
                            WHEN 'A' THEN 'oklch(76.5% 0.177 163.223)'
                            WHEN 'B' THEN 'oklch(85.2% 0.199 91.936)'
                            WHEN 'C' THEN 'oklch(70.7% 0.165 254.624)'
                            WHEN 'D' THEN 'oklch(43.8% 0.218 303.724)'
                            WHEN 'E' THEN 'oklch(0.4915 0.1306 49.65)'
                            WHEN 'I1' THEN 'oklch(.511 .096 186.391)'
                            WHEN 'I2' THEN 'oklch(.511 .096 186.391)'
                            WHEN 'O' THEN 'oklch(43.2% 0.232 292.759)'
                            ELSE '#4D96FF'
                        END
                        WHEN CURRENT_DATE - ${maintenanceEvents.start}  > 3 AND ${maintenanceEvents.status} != 'complete' THEN '#22222275'
                        WHEN ${maintenanceEvents.status} = 'incomplete' THEN '#FF0000'
                        WHEN ${maintenanceEvents.status} = 'complete' THEN
                        CASE ${maintenanceEvents.level}
                            WHEN 'A' THEN 'oklch(43.2% 0.095 166.913)'
                            WHEN 'B' THEN 'oklch(68.1% 0.162 75.834)'
                            WHEN 'C' THEN 'oklch(42.4% 0.199 265.638)'
                            WHEN 'D' THEN 'oklch(71.4% 0.203 305.504)'
                            WHEN 'E' THEN 'oklch(0.559643 0.192567 35.8054)'
                            WHEN 'I1' THEN 'oklch(.704 .14 182.503)'
                            WHEN 'I2' THEN 'oklch(.704 .14 182.503)'
                            WHEN 'O' THEN 'oklch(60.6% 0.25 292.717)'
                            ELSE '#4D96FF'
                        END
                END
            `.as("color")
        }).from(maintenanceEvents).where(and(...conditions));

        return events;
    }

    async getEmergencyMaintenanceEventByEquipmentId(id: number): Promise<MaintenanceEvent | undefined> {
        return (await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), eq(maintenanceEvents.level, "E"), eq(maintenanceEvents.status, "pending"))))[0];
    }

    async getOverhaulMaintenanceEventByEquipmentId(id: number): Promise<MaintenanceEvent | undefined> {
        return (await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), eq(maintenanceEvents.level, "O"), eq(maintenanceEvents.status, "pending"))))[0];
    }

    async getMaintenanceEventsInfo(): Promise<{total: number, upcoming: number, overdue: number, complete: number, incomplete: number}> {
        const upcomingEvents = (await db.select().from(maintenanceEvents).
                            where(gte(maintenanceEvents.start, sql`CURRENT_DATE`))).length;

        const overdueEvents = (await db.select().from(maintenanceEvents).
                            where(
                                and(
                                    lt(maintenanceEvents.start, sql`CURRENT_DATE`),
                                    // eq(maintenanceEvents.status, "pending")
                                )
                            )).length;

                            console.log(overdueEvents)

        const completeEvents = (await db.select().from(maintenanceEvents).
                            where(
                                eq(maintenanceEvents.status, "complete")
                            )).length;

        const incompleteEvents = (await db.select().from(maintenanceEvents).
                            where(
                                eq(maintenanceEvents.status, "incomplete"),
                            )).length;

        return {
            total: upcomingEvents+overdueEvents,
            upcoming: upcomingEvents,
            overdue: overdueEvents,
            complete: completeEvents,
            incomplete: incompleteEvents,
        };
    }
    
    async getMaintenanceEvent(id: number): Promise<(MaintenanceEvent & { isOverdue: boolean }) | undefined> {
        const event = (await db.select({
            ...getTableColumns(maintenanceEvents),
            isOverdue: sql<boolean>`
                CURRENT_DATE - ${maintenanceEvents.start} > 3 AND ${maintenanceEvents.status} != 'complete'
            `,
        }).from(maintenanceEvents).where(eq(maintenanceEvents.id, id)))[0]
        return event;
    }
    
    async getMaintenanceEventsByEquipmentId(id: number, level?: string): Promise<MaintenanceEvent[]> {
        const conditions = [eq(maintenanceEvents.equipmentId, id)];
        if (level) {
            conditions.push(lte(maintenanceEvents.level, level));
        }
        return await db.select().from(maintenanceEvents).where(and(...conditions));
    }

    async addMaintenanceEvents(
            events: InsertMaintenanceEvent[],
            transaction?: Transaction
        ): Promise<MaintenanceEvent[]> {
            const query = transaction ? transaction.insert(maintenanceEvents).values(events).returning() : db.insert(maintenanceEvents).values(events).returning();
            return await query;
        }
            
    async updateMaintenanceEvent(
        id: number,
        updateData: Partial<InsertMaintenanceEvent>
    ): Promise<MaintenanceEvent | undefined> {
        try {
            const [event] = await db.update(maintenanceEvents).set(updateData).where(eq(maintenanceEvents.id, id)).returning();
    
            // const updatedEquipment = await this.subtractPenaltyScore(event);
    
            return event;
        } catch (error) {
            throw error;
        }
    }

    async shiftMaintenanceEvents(
        event: MaintenanceEvent
    ): Promise<MaintenanceEvent[]> {
        // Assuming updated complete event is passed
        if (!event.performedAt || !event.end) {
            throw new Error("Can't shift incomplete events.")
        }
        const shift = differenceInDays(event.performedAt, event.end);
        if (shift === 0) {
            return [];
        }
        
        // Interval-based events should NOT affect any other levels
        if (event.level === "I") {
            const shiftedEvents = await db.update(maintenanceEvents).set({
                start: sql`${maintenanceEvents.start} + (${shift} * interval '1 day')`,
                end: sql`${maintenanceEvents.end} + (${shift} * interval '1 day')`,
            }).where(
                and(
                    eq(maintenanceEvents.equipmentId, event.equipmentId),
                    gte(maintenanceEvents.start, event.scheduledAt),
                    eq(maintenanceEvents.level, event.level)
                )
            ).returning();

            return shiftedEvents;
        }
        
        const shiftedEvents = await db.update(maintenanceEvents).set({
            start: sql`${maintenanceEvents.start} + (${shift} * interval '1 day')`,
            end: sql`${maintenanceEvents.end} + (${shift} * interval '1 day')`,
        }).where(
            and(
                eq(maintenanceEvents.equipmentId, event.equipmentId),
                gte(maintenanceEvents.start, event.scheduledAt),
                lte(maintenanceEvents.level, event.level)
            )
        ).returning();
        
        return shiftedEvents;
    }

    async moveEmergencyEvents(): Promise<MaintenanceEvent[]> {
        const events = await db
        .update(maintenanceEvents)
        .set({ end: sql`current_date` })
        .where(
        and(
            eq(maintenanceEvents.level, "E"),
            eq(maintenanceEvents.status, "pending"),
            not(eq(maintenanceEvents.end, sql`current_date`))
        )
        ).returning();
        return events;
    }
            
    async deleteMaintenanceEvent(id: number): Promise<void> {
        await db.delete(maintenanceEvents).where(eq(maintenanceEvents.id, id));
    }

    async cancelCurrentMaintenanceForEquipment(id: number): Promise<void> {
        await db.delete(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), gte(maintenanceEvents.start, new Date().toISOString().slice(0, 10))));
    }
    /* ======================================================================================================================== */
    
    /* =================================================== Activity Methods =================================================== */
    async getActivities(tenantId: number, limit: number = 12, equipmentId?: number): Promise<Activity[]> {
        return equipmentId ?
            await db.select().from(activities).where(and(eq(activities.tenantId, tenantId), eq(activities.equipmentId, equipmentId))).orderBy(desc(activities.createdAt)).limit(limit) : 
            await db.select().from(activities).where(eq(activities.tenantId, tenantId)).orderBy(desc(activities.createdAt)).limit(limit);
    }
    
    async addActivity(insertActivity: InsertActivity): Promise<Activity> {
        return (await db.insert(activities).values(insertActivity).returning())[0];
    }
    /* ======================================================================================================================== */
    
    /* ================================================== Components Methods ================================================== */
    async getComponents(id: number): Promise<Component[]> {
        return await db.select().from(components).where(eq(components.equipmentId, id));
    }

    async addComponent(insertComponent: InsertComponent): Promise<Component> {
        return (await db.insert(components).values(insertComponent).returning())[0];
    }

    async addComponentsBulk(insertComponents: InsertComponent[]): Promise<Component[]> {
        return db.transaction(async (tx) => {
            const insertedComponents = await tx.insert(components).values(insertComponents).returning();
            return insertedComponents;
        });
    }

    async deleteComponent(id: number): Promise<Component | undefined> {
        return (await db.delete(components).where(eq(components.id, id)).returning())[0];
    }
    /* ======================================================================================================================== */
    
    
    /* =================================================== Document Methods =================================================== */
    async getDocuments(equipmentId?: number): Promise<Document[]> {
        return equipmentId ? 
        await db.select().from(documents).where(eq(documents.equipmentId, equipmentId)).orderBy(desc(documents.uploadedAt)) : 
        await db.select().from(documents).orderBy(desc(documents.uploadedAt));
    }
    
    async getDocument(id: number): Promise<Document | undefined> {
        return (await db.select().from(documents).where(eq(documents.id, id)))[0];
    }
    
    async addDocument(insertDocument: InsertDocument): Promise<Document> {
        return (await db.insert(documents).values(insertDocument).returning())[0];
    }
    
    async deleteDocument(id: number): Promise<Document | undefined> {
        const deletedDocument = await db.delete(documents).where(eq(documents.id, id)).returning();
        return deletedDocument[0];
    }
    /* ======================================================================================================================== */
    
    /* ==================================================== Photo Methods ===================================================== */
    async getPhotos(equipmentId?: number): Promise<Photo[]> {
        return equipmentId ? 
        await db.select().from(photos).where(eq(photos.equipmentId, equipmentId)).orderBy(desc(photos.uploadedAt)) : 
        await db.select().from(photos).orderBy(desc(photos.uploadedAt));
    }

    async getPhotosByEquipmentId(id: number): Promise<Photo[]> {
        return await db.select().from(photos).where(eq(photos.equipmentId, id));
    }
    
    async addPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
        return (await db.insert(photos).values(insertPhoto).returning())[0];
    }
    
    async deletePhoto(id: number): Promise<Photo> {
        const deletedPhoto = (await db.delete(photos).where(eq(photos.id, id)).returning());
        return deletedPhoto[0];
    }
    /* ======================================================================================================================== */
    
    /* =============================================== Stats Methods ========================================================== */
    async getDashboardCardStats(tenant: number): Promise<any> {
        const whereClause = tenant !== 1 ? sql`WHERE ${tenant} = tenant_id` : sql``;
        
        const total = await db.execute(sql`
            SELECT m.eq, e.mt
            FROM (
                SELECT COUNT(*) as eq
                FROM maintenances
                ${whereClause}
            ) m
            CROSS JOIN (
                SELECT COUNT(*) as mt
                FROM maintenance_events
                ${whereClause}
            ) e
        `);

        const overdue = await db.execute(sql`
            SELECT
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date < CURRENT_DATE) AS oeq,
                COUNT(*) FILTER (WHERE start_date < CURRENT_DATE) AS omt
            FROM maintenance_events ${whereClause}
        `);

        const complete = await db.execute(sql`
            SELECT
                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '1 week' AND status = 'complete') AS cmt1,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '1 week' AND status = 'complete') AS ceq1,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '2 week' AND status = 'complete') AS cmt2,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '2 week' AND status = 'complete') AS ceq2,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '3 week' AND status = 'complete') AS cmt3,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '3 week' AND status = 'complete') AS ceq3,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '4 week' AND status = 'complete') AS cmt4,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '4 week' AND status = 'complete') AS ceq4
            FROM maintenance_events ${whereClause};
        `);

        const upcoming = await db.execute(sql`
            SELECT
                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '1 week') AS umt1,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '1 week') AS ueq1,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '2 weeks') AS umt2,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '2 weeks') AS ueq2,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '3 weeks') AS umt3,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '3 weeks') AS ueq3,

                COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '4 weeks') AS umt4,
                COUNT(DISTINCT equipment_id) FILTER (WHERE start_date >= CURRENT_DATE AND start_date < CURRENT_DATE + interval '4 weeks') AS ueq4 
            FROM maintenance_events ${whereClause};
        `);

        const emergency = await db.execute(sql`
            SELECT
                COUNT(*) FILTER (WHERE level = 'E' and status = 'pending') AS epn,
                COUNT(*) FILTER (WHERE level = 'E' AND status = 'complete') AS ecm
            FROM maintenance_events ${whereClause}
        `);
    
        return {
            eq: Number(total.rows[0].eq),
            mt: Number(total.rows[0].mt),
            oeq: Number(overdue.rows[0].oeq),
            omt: Number(overdue.rows[0].omt),
            ceq1: Number(complete.rows[0].ceq1),
            cmt1: Number(complete.rows[0].cmt1),
            ceq2: Number(complete.rows[0].ceq2),
            cmt2: Number(complete.rows[0].cmt2),
            ceq3: Number(complete.rows[0].ceq3), 
            cmt3: Number(complete.rows[0].cmt3),
            ceq4: Number(complete.rows[0].ceq4),
            cmt4: Number(complete.rows[0].cmt4),
            ueq1: Number(upcoming.rows[0].ueq1),
            umt1: Number(upcoming.rows[0].umt1),
            ueq2: Number(upcoming.rows[0].ueq2),
            umt2: Number(upcoming.rows[0].umt2),
            ueq3: Number(upcoming.rows[0].ueq3),
            umt3: Number(upcoming.rows[0].umt3),
            ueq4: Number(upcoming.rows[0].ueq4),
            umt4: Number(upcoming.rows[0].umt4),
            epn: Number(emergency.rows[0].epn),
            ecm: Number(emergency.rows[0].ecm)
        }
    }

    async getKPIs(tenant: number): Promise<any> {
        const whereClause = tenant !== 1 ? sql`WHERE ${tenant} = tenant_id` : sql``;
        
        const msc = await db.execute(sql`
            SELECT
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE)) AS total,
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE AND status = 'complete')) AS complete
            FROM maintenance_events ${whereClause};
        `);
        const err = await db.execute(sql`
            SELECT
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE AND level = 'E')) AS error,
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE)) AS total
            FROM maintenance_events ${whereClause};
        `);
        const tcm = await db.execute(sql`
            SELECT
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE AND status = 'complete' AND performed_at IS NOT NULL AND performed_at - scheduled_at <= 2)) as timely,
                COALESCE(COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE AND status = 'complete')) as total 
            FROM maintenance_events ${whereClause};
        `);
        const ehi = await db.execute(sql`
            SELECT COALESCE(AVG(health_index)) as avg FROM equipments ${whereClause};
        `)

        return {
            msc: (100*(Number(msc.rows[0].complete) / Number(msc.rows[0].total))) || 0,
            err: (100*(Number(err.rows[0].error) / Number(err.rows[0].total))) || 0,
            tcm: (100*(Number(tcm.rows[0].timely) / Number(tcm.rows[0].total))) || 0,
            ehi: Number(ehi.rows[0].avg) || 0
        };
    }
    /* ======================================================================================================================== */
    
    /* =========================================== Miscellaneous Methods ====================================================== */
    async calculateHealthIndex(
        equipmentId: number,
        givenHealthIndex: number | undefined | null
    ) {
        const equipment = await this.getEquipment(equipmentId);
        if (!equipment) throw new Error("No equipment found");
        if (!givenHealthIndex) throw new Error("No given health index");

        const { usefulLifeSpan, dateOfManufacturing } = equipment;

        const monthlyHealthDrop = Number((100 / usefulLifeSpan).toFixed(2));

        let idealHealthIndex = Math.max(0, 100 - differenceInCalendarMonths(Date(), dateOfManufacturing) * monthlyHealthDrop);

        
        // const trueHealthIndex = givenHealthIndex > idealHealthIndex ? idealHealthIndex : givenHealthIndex;
        const trueHealthIndex = Math.min(givenHealthIndex, idealHealthIndex);
        console.log("Ideal | True", idealHealthIndex, trueHealthIndex);

        return trueHealthIndex;
    }

    async subtractPenaltyScore(event: (MaintenanceEvent & { isOverdue: boolean })) {
        const levelCoeffs: Record<string, number> = {
            "A": 1,
            "B": 2,
            "C": 3,
            "D": 4,
            "I1": 1,
            "I2": 2,
        }
        const statusCoeffs: Record<string, number> = {
            "complete": 0,
            "overdue": 0.5,
            "incomplete": 1
        }

        const BASE_PENALTY_SCORE = 0.2;
        const eventStatus = event.status === "incomplete" ? "incomplete" : event.isOverdue ? "overdue" : event.status;
        
        const penalty = BASE_PENALTY_SCORE * levelCoeffs[event.level] * (statusCoeffs[eventStatus] || 0);

        console.log(penalty);

        // update event in the db
        return await db.update(equipments).set({ healthIndex: sql`${equipments.healthIndex} - ${penalty}` }).where(eq(equipments.id, event.equipmentId));
    }

    async subtractMonthlyHealthDrop(tenantId: number) {
        
        await db.execute(sql`
            UPDATE equipments
            SET
                health_index = GREATEST(
                    0,
                    health_index
                    - (
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, next_health_index_update)) * 12
                        + EXTRACT(MONTH FROM AGE(CURRENT_DATE, next_health_index_update))
                        + 1
                    ) * (100.0 / useful_life_span)
                ),

                next_health_index_update =
                    next_health_index_update +
                    (
                        (
                            EXTRACT(YEAR FROM AGE(CURRENT_DATE, next_health_index_update)) * 12
                            + EXTRACT(MONTH FROM AGE(CURRENT_DATE, next_health_index_update))
                            + 1
                        ) * INTERVAL '1 month'
                    )

                
            WHERE
                health_index IS NOT NULL
                AND next_health_index_update <= CURRENT_DATE
            AND (${tenantId} = 1 OR tenant_id = ${tenantId})`)
    }

    // async subtractPenaltyScore(
    //     event: MaintenanceEvent
    // ) {
    //     const levelCoeffs: Record<string, number> = {
    //         "A": 1,
    //         "B": 2,
    //         "C": 3,
    //         "D": 4,
    //     };
    //     const statusCoeffs: Record<string, number> = {
    //         "complete": 0,
    //         "overdue": 0.5,
    //         "incomplete": 1
    //     };

    //     const score = event.status ? levelCoeffs[event.level]*statusCoeffs[event.status] : "no status yet";

        
    //     return await db.update(equipments).set({ healthIndex: sql`${equipments.healthIndex} - ${score}` }).where(eq(equipments.id, event.equipmentId));
    // }
    
    
    // async calculateHealthIndex(
    //     equipmentId: number,
    //     maintenance: Maintenance
    // ): Promise<number | undefined> {
    //     try {
    //         const equipment = await db.execute(sql`
    //             SELECT useful_life_span,
    //             EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_manufacturing)) * 12 +
    //             EXTRACT(MONTH FROM AGE(CURRENT_DATE, date_of_manufacturing)) AS age_in_months
    //             FROM equipments
    //             WHERE id = ${equipmentId}
    //         `);

    //         if (!equipment.rows[0]) return undefined;

    //         const { useful_life_span, age_in_months } = equipment.rows[0];
    //         if (!useful_life_span || age_in_months == null) return undefined;

    //         return 0;            
    //     } catch (error) {
    //         const msg = error instanceof Error ? error.message : "Unknown error";
    //         throw new Error(`Failed to calculate health index for specified equipment: ${msg}`);
    //     }
    // }

}


export const storage = new DatabaseStorage();