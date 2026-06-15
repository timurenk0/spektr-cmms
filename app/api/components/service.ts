import { Component, InsertComponent } from "@/BACKEND/Database/schema";
import { storage } from "@/BACKEND/storage";


class ComponentsService {
    async getComponentsForEquipment(equipmentId: number): Promise<Component[]> {
        return await storage.getComponents(equipmentId);
    }

    async addComponent(data: InsertComponent): Promise<Component> {
        return await storage.addComponent(data);
    }

    async addComponenentsInBulk(data: InsertComponent[]): Promise<Component[]> {
        return await storage.addComponentsBulk(data);
    }

    async deleteComponent(componentId: number): Promise<Component> {
        return await storage.deleteComponent(componentId);
    }
}

export const componentsService = new ComponentsService();