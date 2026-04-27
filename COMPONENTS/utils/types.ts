export type TActivity = {
    id: number;
    tenantId: number;
    userId: number;
    equipmentId: number | null;
    username: string;
    action: string;
    title: string;
    description: string;
    createdAt: string;
}

export type TComponent = {
    id: number;
    equipmentId: number;
    name: string;
    manufacturer: string;
    partNumber: string;
    stock: number;
    failImpact: string;
    notes: string | null;
}

export type TDocument = {
    id: number;
    equipmentId: number;
    title: string;
    fileUrl: string;
    fileType: string;
    fileName: string | null;
    category: string;
    uploadedAt: string;
    notes: string | null;
}

export type TEquipment = {
    id: number;
    tenantId: number;
    name: string;
    manufacturer: string;
    model: string;
    assetId: string;
    serialNumber: string;
    type: string;
    category: string;
    status: "operational" | "under repair" | "out of service";
    dateOfManufacturing: string;
    inServiceDate: string;
    usefulLifeSpan: number;
    totalWorkingHours: number | null;
    requirements: "calibration & testing" | "maintenance" | "both";
    location: string;
    department: string;
    equipmentImage: string;
    healthIndex: number | null;
    notes: string | null;
    uploadedAt: string;
    lastEvent: string | null;
    nextEvent: string | null;
}

export type TMaintenance = {
    id: number;
    equipmentId: number;
    tenantId: number;
    givenHealthIndex: number;
    dailyWorkingHours: number;
    serviceStartDate: string;
    serviceEndDate: string;
    levelAHours: number;
    levelADuration: number;
    levelBHours: number;
    levelBDuration: number;
    levelCHours: number;
    levelCDuration: number;
    levelDHours: number;
    levelDDuration: number;
    levelIMonths: number;
    levelIDuration: number;
}

export type TMaintenanceEvent = {
    id: number;
    equipmentId: number;
    maintenanceId: number;
    tenantId: number;
    title: string;
    description: string;
    isComplete: boolean;
    level: "A" | "B" | "C" | "D" | "E" | "I";
    start: string;
    end: string;
    scheduledAt: string;
    performedAt: string | null;
}

export type TPhoto = {
    id: number;
    equipmentId: number;
    title: string;
    imageUrl: string;
}

export type TTenant = {
    id: number;
    name: string;
}

export type TUser = {
    id: number;
    tenantId: number;
    username: string;
    role: string;
}