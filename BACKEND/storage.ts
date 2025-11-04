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
import { eq, and, desc, sql, not, ExtractTablesWithRelations, lt } from "drizzle-orm";
import type { NeonDatabase, NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


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
    async getEquipments(concise?:string, limit?: number, page?: number): Promise<{data: Equipment[], totalCount: number}> {
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
                status: true
            }: undefined
        });
        
        const count = await db.select({ count: sql<number>`count(*)` }).from(equipments);
    
        return { data, totalCount: count[0].count }
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
    async getMaintenanceEvents(): Promise<MaintenanceEvent[]> {
        return await db.select().from(maintenanceEvents);
    }
    
    async getMaintenanceEvent(id: number): Promise<MaintenanceEvent | undefined> {
        return (await db.select().from(maintenanceEvents).where(eq(maintenanceEvents.id, id)))[0];
    }
    
    async getMaintenanceEventsByEquipmentId(id: number): Promise<MaintenanceEvent[]> {
        return await db.select().from(maintenanceEvents).where(eq(maintenanceEvents.equipmentId, id));
    }

    async getClosestMaintenanceEventsForEquipment(id: number): Promise<MaintenanceEvent[]> {
        const today = new Date().toISOString();
        
        const [prev] = await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), sql`${maintenanceEvents.start} < ${today}`)).limit(1);
        const [next] = await db.select().from(maintenanceEvents).where(and(eq(maintenanceEvents.equipmentId, id), sql`${maintenanceEvents.start} > ${today}`)).limit(1);

        return [prev, next];
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
        return event;
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
    
    
    // Additional methods
    async calculateHealthIndex(
        equipmentId: number,
        maintenance: Maintenance
    ): Promise<number | undefined> {
        try {
            const equipment = await db.execute(sql`
                SELECT useful_life_span,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_manufacturing)) * 12 +
                EXTRACT(MONTH FROM AGE(CURRENT_DATE, date_of_manufacturing)) AS age_in_months
                FROM equipments
                WHERE id = ${equipmentId}
            `);

            if (!equipment.rows[0]) return undefined;

            const { useful_life_span, age_in_months } = equipment.rows[0];
            if (!useful_life_span || age_in_months == null) return undefined;

            return 0;            
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to calculate health index for specified equipment: ${msg}`);
        }
    }

}


export const storage = new DatabaseStorage();