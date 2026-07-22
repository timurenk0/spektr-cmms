import { Activity, Component, Document, Equipment, EquipmentCategory, EquipmentType, Maintenance, MaintenanceEvent, Photo, Tenant, User } from "@/BACKEND/Database/schema";

export type CustomError = {
    code: string
    message: string,
    suggestion?: string,
    field?: string
}

export type TActivity = (Activity);

export type TComponent = Component;

export type TDocument = Document;

export type TEquipment = (Equipment & { lastEvent: string | null, nextEvent: string | null })

export type TEquipmentCategorie = EquipmentCategory;

export type TEquipmentType = EquipmentType;

export type TCategoryAndTypes = (EquipmentCategory & { types: EquipmentType[] })

export type TMaintenance = Maintenance;

export type TMaintenanceEvent = MaintenanceEvent;

export type TPhoto = Photo;

export type TTenant = Tenant;

export type TUser = (Omit<User, "password"> & {tenantName: string});