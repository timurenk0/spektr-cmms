import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const user = await validateUser();
        
        const count = await storage.getDashboardCardStats(user.tenantId);
        return res.json(count, { status: 200 });
    } catch (error) {
       const msg = error instanceof Error ? error.message : "Unknown error"; 
       return res.json({ error: `Failed to get dashboard card stats: ${msg}` }, { status: 500 });
    }
} 