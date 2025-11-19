import { auth } from "@/auth";
import { NextResponse as res } from "next/server";


export async function isAdmin() {
    const session = await auth();

    if (!session?.user) {
        return res.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return res.json({ erorr: "Forbidden" }, { status: 403 });
    }

    return { user: session.user };
}