import {
    users, type User, type InsertUser,
    equipments, type Equipment, type InsertEquipment,
    maintenances, type Maintenance, type InsertMaintenance,
    maintenanceEvents, type MaintenanceEvent, type InsertMaintenanceEvent,
    activities, type Activity, type InsertActivity,
    documents, type Document, type InsertDocument,
    photos, type Photo, type InsertPhoto,
} from "./Database/schema";
import * as schema from "./Database/schema";
import { db } from "./Database/db";
import { generateEvents } from "./Middleware/EventManager";
import { eq, and, desc, sql, not, ExtractTablesWithRelations, lt, gte, lte, isNull } from "drizzle-orm";
import type { NeonDatabase, NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { differenceInCalendarMonths } from "date-fns";


type Schema = typeof schema;
type Transaction = PgTransaction<NeonQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;


export class DatabaseStorage {
    // User methods
    /* ===================================================== User Methods ===================================================== */
    async getUsers(): Promise<Pick<User, "id" | "username" | "role">[]> {
        return await db.select({
            id: users.id,
            username: users.username,
            role: users.role            
        }).from(users);
    };

    async getUser(id: number): Promise<Pick<User, "id" | "username" | "role"> | undefined> {
        return (await db.select({id: users.id, username: users.username, role: users.role}).from(users).where(eq(users.id, id)))[0];
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

    /* ================================================ Equipment Methods ===================================================== */
    async getEquipments(concise?:string, limit?: number, page?: number): Promise<{equips: IEquipment[], totalCount: number}> {
        // Another format just for fun why not
        const data = await db.query.equipments.findMany({
            orderBy: equipments.id,
            limit: limit ? limit : -1,
            offset: (limit && page) ? (page-1)*limit : 0,
            columns: concise === "true" ? {
                id: true,
                name: true,
                assetId: true,
                equipmentImage: true,
                status: true,
            }: undefined
        });
        
        const count = await db.select({ count: sql<number>`count(*)` }).from(equipments);

        const equips = await Promise.all(
            data.map(async (d) => {
                const {lastEvent, nextEvent} = await this.getClosestMaintenanceEventsForEquipment(d.id);

                return {
                    ...d,
                    lastEvent,
                    nextEvent
                }
            })
        )

        return { equips, totalCount: count[0].count }
    }
    
    async getEquipment(id: number): Promise<Equipment | undefined> {
        return (await db.select().from(equipments).where(eq(equipments.id, id)))[0];
    }
    
    async addEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
        try {
            return (await db.insert(equipments).values(insertEquipment).returning())[0];
        } catch (error: any) {
            console.error("Failed to add equipment", error.stack, error.message, error);
            throw error;
        }
    }
    
    async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
        const [equipment] = await db.update(equipments).set(updateData).where(eq(equipments.id, id)).returning();

        console.log(equipment);
        return equipment;
    }
    
    async deleteEquipment(id: number): Promise<void> {
        await db.delete(equipments).where(eq(equipments.id, id));
    }
    /* ======================================================================================================================== */
    
    /* ================================================ Maintenance Methods =================================================== */
    async getMaintenances(): Promise<Maintenance[]> {
        return await db.select().from(maintenances);
    }
    
    async getMaintenance(id: number): Promise<Maintenance | undefined> {
        return (await db.select().from(maintenances).where(eq(maintenances.id, id)))[0];
    }
    
    async getMainteancesByEquipmentId(id: number): Promise<Maintenance | undefined> {
        return (await db.select().from(maintenances).where(eq(maintenances.equipmentId, id)))[0];
    }
    
    async addMaintenance(insertMaintenance: InsertMaintenance, transaction?: NeonDatabase<Schema>): Promise<Maintenance> {
        const hasValidLevels = [
            { duration: insertMaintenance.levelADuration, hours: insertMaintenance.levelAHours },
            { duration: insertMaintenance.levelBDuration, hours: insertMaintenance.levelBHours },
            { duration: insertMaintenance.levelCDuration, hours: insertMaintenance.levelCHours },
            { duration: insertMaintenance.levelDDuration, hours: insertMaintenance.levelDHours }
        ].some(level => level.duration && level.duration > 0 && level.hours && level.hours > 0);
        if (!hasValidLevels) throw new Error("At least one maintenance level must have hours/duration values > 0");
        
        const tx = transaction || db;
        return await tx.transaction(async (tx: Transaction) => {
            try {
                const [maintenance] = await tx.insert(maintenances).values(insertMaintenance).returning();
                console.log(maintenance);
                
                const events = await generateEvents(maintenance, undefined, undefined);
                await tx.insert(maintenanceEvents).values(events).returning();    
                
                return maintenance;
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
                throw new Error(`Failed to add maintenance: ${msg}`);
            }
        })
    };
    
    async updateMaintenance(
        id: number,
        updateData: Partial<InsertMaintenance>
    ): Promise<Maintenance | undefined> {
        const [maintenance] = await db.update(maintenances).set(updateData).where(eq(maintenances.id, id)).returning();
        return maintenance;
    }
    
    async deleteMaintenance(id: number): Promise<void> {
        await db.delete(maintenances).where(eq(maintenances.id, id));
    }
    /* ======================================================================================================================== */
    
    /* ============================================== Maintenance Events Methods ============================================== */
    async getMaintenanceEvents(status: string, start?: string, end?: string): Promise<MaintenanceEvent[]> {
        let conditions = [];

        if (start && end) {
            conditions.push(and(gte(maintenanceEvents.start, start), lte(maintenanceEvents.start, end)));
        }

        if (status !== "any") {
            conditions.push(eq(maintenanceEvents.status, status));
        }
        
        let events = await db.select({
            id: maintenanceEvents.id,
            equipmentId: maintenanceEvents.equipmentId,
            maintenanceId: maintenanceEvents.maintenanceId,
            title: maintenanceEvents.title,
            description: maintenanceEvents.description,
            level: maintenanceEvents.level,
            start: maintenanceEvents.start,
            end: maintenanceEvents.end,
            scheduledAt: maintenanceEvents.scheduledAt,
            performedAt: maintenanceEvents.performedAt,
            status: maintenanceEvents.status,
            color: sql<string>`
                CASE
                    WHEN ${maintenanceEvents.status} = 'complete' THEN
                        CASE ${maintenanceEvents.level}
                            WHEN 'A' THEN 'oklch(43.2% 0.095 166.913)'
                            WHEN 'B' THEN 'oklch(68.1% 0.162 75.834)'
                            WHEN 'C' THEN 'oklch(42.4% 0.199 265.638)'
                            WHEN 'D' THEN 'oklch(43.8% 0.218 303.724)'
                            WHEN 'E' THEN '#CC3700'
                            ELSE '#4D96FF'
                        END
                    WHEN ${maintenanceEvents.status} = 'incomplete' THEN '#22222275'
                    WHEN ${maintenanceEvents.start} >= CURRENT_DATE THEN
                        CASE ${maintenanceEvents.level}
                            WHEN 'A' THEN 'oklch(76.5% 0.177 163.223)'
                            WHEN 'B' THEN 'oklch(85.2% 0.199 91.936)'
                            WHEN 'C' THEN 'oklch(70.7% 0.165 254.624)'
                            WHEN 'D' THEN 'oklch(71.4% 0.203 305.504)'
                            WHEN 'E' THEN '#FF4500'
                            ELSE '#4D96FF'
                        END
                END
            `.as("color")
        }).from(maintenanceEvents).where(and(...conditions));

        return events;
    }

    async getMaintenanceEventsInfo(): Promise<{total: number, upcoming: number, overdue: number, complete: number, incomplete: number}> {
        const today = new Date().toISOString().slice(0, 10); 
        
        const upcomingEvents = (await db.select().from(maintenanceEvents).
                            where(gte(maintenanceEvents.scheduledAt, today))).length;
        const overdueEvents = (await db.select().from(maintenanceEvents).
                            where(
                                and(
                                    not(
                                        eq(maintenanceEvents.status, "incomplete")
                                    ),
                                    lte(maintenanceEvents.scheduledAt, today)
                                )
                            )).length;
        const completeEvents = (await db.select().from(maintenanceEvents).
                            where(
                                eq(maintenanceEvents.status, "complete")
                            )).length;
        const incompleteEvents = (await db.select().from(maintenanceEvents).
                            where(
                                eq(maintenanceEvents.status, "incomplete")
                            )).length;

        return {
            total: upcomingEvents+overdueEvents+completeEvents+incompleteEvents,
            upcoming: upcomingEvents,
            overdue: overdueEvents,
            complete: completeEvents,
            incomplete: incompleteEvents,
        };
    }
    
    async getMaintenanceEvent(id: number): Promise<MaintenanceEvent | undefined> {
        return (await db.select().from(maintenanceEvents).where(eq(maintenanceEvents.id, id)))[0];
    }
    
    async getMaintenanceEventsByEquipmentId(id: number): Promise<MaintenanceEvent[]> {
        return await db.select().from(maintenanceEvents).where(eq(maintenanceEvents.equipmentId, id));
    }

    async getClosestMaintenanceEventsForEquipment(id: number): Promise<{lastEvent: string, nextEvent: string}> {
        const today = new Date().toISOString();
        
        const [prev] = await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), sql`${maintenanceEvents.start} < ${today}`)).limit(1);
        const [next] = await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), and(sql`${maintenanceEvents.start} > ${today}`, eq(maintenanceEvents.status, "upcoming")))).limit(1);

        return {lastEvent: prev?.scheduledAt ?? "N/A", nextEvent: next?.scheduledAt ?? "N/A"};
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
        const [event] = await db.update(maintenanceEvents).set(updateData).where(eq(maintenanceEvents.id, id)).returning();

        // const updatedEquipment = await this.subtractPenaltyScore(event);

        return event;
    }

    async updateIncompleteEvents(): Promise<{id: number}[]> {
        const updatedEvents = await db.update(maintenanceEvents).set({ status: "incomplete" }).
                        where(
                            and(
                                eq(maintenanceEvents.status, "overdue"),
                                isNull(maintenanceEvents.performedAt),
                                lt(maintenanceEvents.start, sql`CURRENT_DATE - INTERVAL '10 days'`)

                            )
                        ).returning({ id: maintenanceEvents.id });

        return updatedEvents;
    }
            
    async moveEmergencyEvents(): Promise<MaintenanceEvent[]> {
        const events = await db
        .update(maintenanceEvents)
        .set({ end: sql`current_date` })
        .where(
        and(
            eq(maintenanceEvents.level, "E"),
            eq(maintenanceEvents.status, "emergency"),
            not(eq(maintenanceEvents.end, sql`current_date`))
        )
        ).returning();
        return events;
    }
            
    async deleteMaintenanceEvent(id: number): Promise<void> {
        await db.delete(maintenanceEvents).where(eq(maintenanceEvents.id, id));
    }
    /* ======================================================================================================================== */
    
    /* =================================================== Activity Methods =================================================== */
    async getActivities(limit: number = 10, equipmentId?: number): Promise<Activity[]> {
        return equipmentId ?
            await db.select().from(activities).where(eq(activities.equipmentId, equipmentId)).orderBy(desc(activities.createdAt)).limit(limit) : 
            await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
    }
    
    async addActivity(insertActivity: InsertActivity): Promise<Activity> {
        return (await db.insert(activities).values(insertActivity).returning())[0];
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
    
    async deleteDocument(id: number): Promise<void> {
        await db.delete(documents).where(eq(documents.id, id));
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
    
    async deletePhoto(id: number): Promise<void> {
        await db.delete(photos).where(eq(photos.id, id));
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

        const idealHealthIndex = 100 - differenceInCalendarMonths(Date(), dateOfManufacturing) * monthlyHealthDrop;

        
        let trueHealthIndex = givenHealthIndex > idealHealthIndex ? idealHealthIndex : givenHealthIndex;
        console.log("Ideal | True", idealHealthIndex, trueHealthIndex);

        return trueHealthIndex;
    }

    async subtractPenaltyScore(
        event: MaintenanceEvent
    ) {
        const levelCoeffs: Record<string, number> = {
            "A": 1,
            "B": 2,
            "C": 3,
            "D": 4,
        };
        const statusCoeffs: Record<string, number> = {
            "complete": 0,
            "overdue": 0.5,
            "incomplete": 1
        };

        const score = event.status ? levelCoeffs[event.level]*statusCoeffs[event.status] : "no status yet";

        
        return await db.update(equipments).set({ healthIndex: sql`${equipments.healthIndex} - ${score}` }).where(eq(equipments.id, event.equipmentId));
    }
    
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