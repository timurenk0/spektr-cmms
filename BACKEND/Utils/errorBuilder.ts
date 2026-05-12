import { NextResponse } from "next/server"


type CustomError = {
    code: string,
    message: string,
    field?: string,
    suggestion?: string,
    status?: number
}

type CustomApiError = {
    code: string,
    message: string,
    field?: string,
    suggestion?: string,
    status: number
}

export class ApiError extends Error {
    code: string;
    status: number;
    suggestion?: string;
    field?: string;

    constructor({ code, message, status, suggestion, field }: CustomApiError) {
        super(message);

        this.code = code;
        this.status = status;
        this.suggestion = suggestion;
        this.field = field;
    }
}

export default function buildError({
    code,
    message,
    field,
    suggestion,
    status=500
}: CustomError) : NextResponse {
    return NextResponse.json({
        success: false,
        error: {
            code, field, message, suggestion
        }
    }, { status })
}