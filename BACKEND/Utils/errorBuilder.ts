import { NextResponse } from "next/server"

export default function buildError({
    code,
    message,
    field,
    suggestion,
    status=500
}: {
    code: string,
    message: string,
    field?: string,
    suggestion?: string,
    status?: number 
}) {
    return NextResponse.json({
        success: false,
        error: {
            code, field, message, suggestion
        }
    }, { status })
}