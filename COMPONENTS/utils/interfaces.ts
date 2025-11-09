interface IActivity {
    id: number,
    userId: number,
    username: string,
    action: string,
    title: string,
    description: string,
    createdAt: string
}

interface IDocument {
    id: number,
    equipmentId: number,
    title: string,
    fileUrl: string,
    fileType: string,
    fileName: string,
    category: string,
    uploadedAt: string,
    notes?: string
}

interface IEquipment {
    id: number,
    name: string,
    manufacturer: string,
    model: string,
    assetId: string,
    serialNumber: string,
    type: string,
    category: string,
    status: string,
    dateOfManufacturing: string,
    inServiceDate: string,
    usefulLifeSpan: number,
    totalWorkingHours: number | null,
    requirements: string,
    location: string,
    department: string,
    equipmentImage: string,
    healthIndex: string | null,
    notes: string,
    lastEvent: string,
    nextEvent: string,
}

interface IMaintenance {
    id: number,
    equipmentId: number,
    givenHealthIndex: number,
    dailyWorkingHours: number,
    serviceStartDate: string,
    serviceEndDate: string,
    levelAHours: number,
    levelADuration: number,
    levelBHours: number,
    levelBDuration: number,
    levelCHours: number,
    levelCDuration: number,
    levelDHours: number,
    levelDDuration: number,
}

interface IMaintenanceEvent {
    id: number,
    equipmentId: number,
    maintenanceId: number,
    title: string,
    description: string,
    status: string,
    level: string,
    color: string,
    start: string,
    end: string,
    scheduledAt: string,
    performedAt: string
}

interface IPhoto {
    id: number,
    equipmentId: number,
    title: string,
    imageUrl: string,
    notes?: string
}

interface IUser {
    id: number,
    username: string,
    role: string
}