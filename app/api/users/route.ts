import { NextRequest, NextResponse as res } from "next/server";
import { insertUserSchema } from "@/BACKEND/Database/schema";
import { storage } from "@/BACKEND/storage";
import { authService, authorize } from "@/BACKEND/Middleware/AuthService";
import activityLogger from "@/BACKEND/Utils/activityLogger";


export async function GET() {
    try {
        const users = await storage.getUsers();
        return res.json(users, {status: 200});
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to fetch users: ${msg}` }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        // Fetch user using authService helper function and verify user role.
        // Throw errors if user info is not found or user is unauthorized.
        const user = await authService();
        if (!user) return res.json({ error: "Unauthorized" }, { status: 401 });
        if (!authorize(user, "admin")) return res.json({ error: "Forbidden" }, { status: 403 });

        // Pull user data from the request body.
        // Parse user data with DB schema for validation.
        const body = await req.json();
        const validatedData = insertUserSchema.parse(body);

        // Check added user role and forbid the operation if it is "admin" role.
        if (validatedData.role?.toLowerCase() === "admin") return res.json({ error: "Cannot create admin user" }, { status: 400 });
        if (await storage.getUserByUsername(validatedData.username)) return res.json({ error: "This username is taken! Pick another one" }, { status: 409 });
        // Add validated user data to the DB.
        const newUser = await storage.addUser(validatedData);

        // Log the activity for added user using helper logger method.
        await activityLogger(user, "add", "User added", `User ${newUser.username} added to the database`);
        
        return res.json(newUser, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to add user: ${msg}` }, { status: 500 });
    }
}