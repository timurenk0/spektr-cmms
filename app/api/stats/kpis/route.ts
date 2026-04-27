import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const user = await validateUser();
        
        const kpis = await storage.getKPIs(user.tenantId);
        return res.json(kpis, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch KPI stats: ${msg}` }, { status: 500 });
    }
}