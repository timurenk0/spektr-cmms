import { NextRequest, NextResponse as res } from "next/server";
import { insertTenantSchema, insertUserSchema } from "@/BACKEND/Database/schema";
import { storage } from "@/BACKEND/storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "@neondatabase/serverless";


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
        const user = await validateUser("admin");

        // Pull user data from the request body.
        const body = await req.json();
        
        // Parse tenant data with DB schema validation
        const validatedTenant = insertTenantSchema.parse({ name: body.tenant });
        const newTenant = await storage.addTenant(validatedTenant);

        // Parse user data with DB schema validation
        const validatedUser = insertUserSchema.parse({
            ...body,
            tenantId: newTenant.id
        });

        // Check added user role and forbid the operation if it is "admin" role.
        if (validatedUser.role?.toLowerCase() === "admin") return buildError({
            code: ERROR_CODES.VALIDATION_ERROR,
            field: "role",
            message: "Impossible to create admin user.",
            suggestion: "Contact IT administrator if you wish to elevate your account permissions.",
            status: 400
        });
        // if (await storage.getUserByUsername(validatedUser.username)) return res.json({ error: "This username is taken! Pick another one" }, { status: 409 });
        // if (await storage.getUserByUsername(validatedUser.username)) return buildError({
        //     code: "VALIDATION_ERROR",
        //     field: "username",
        //     message: "",
        //     suggestion: "Contact IT administrator if you wish to have admin priviledges.",
        //     status: 400
        // });

        // Add validated user data to the DB.
        const newUser = await storage.addUser(validatedUser);

        // Log the activity for added user using helper logger method.
        await activityLogger(user, "add", `User ${newUser.username} added to the database`);
        
        return res.json(newUser, { status: 201 });
    } catch (error: unknown) {

        // Catch duplication error
        if (error instanceof DrizzleQueryError) {
            console.error(error);
            if (error.cause instanceof DatabaseError) {
                console.error(error);
                if (error.cause.code === "23505") {
                    return buildCustomError({
                        code: ERROR_CODES.DUPLICATION_ERROR,
                        field: "username",
                        message: `User with this username already exists.`,
                        suggestion: `Try a different username.`,
                        status: 409
                    })
                }
            }
        }

        // Catch generic errors
        return buildError(error);
    }
}