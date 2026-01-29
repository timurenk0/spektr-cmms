import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        
    } catch (error) {
        console.error("Failed to fetch equipment stats:", error);
        res.json("Failed to fetch equipment stats", { status: 500 });
    }
}