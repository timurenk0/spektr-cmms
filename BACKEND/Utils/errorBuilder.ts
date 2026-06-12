import { DatabaseError } from "@neondatabase/serverless"
import { DrizzleQueryError } from "drizzle-orm"
import { NextResponse } from "next/server"
import { ZodError } from "zod"


type CustomError = {
    code: string,
    message: string,
    field?: string,
    suggestion?: string,
    status?: number
}

type CustomApiErrorPayload = {
    code: string,
    message: string,
    field?: string,
    suggestion?: string,
    status: number
}

export const ERROR_CODES = {
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    DUPLICATION_ERROR: "DUPLICATION_ERROR",
    NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
}

export class CustomApiError extends Error {
    code: string;
    status: number;
    suggestion?: string;
    field?: string;

    constructor({ code, message, status, suggestion, field }: CustomApiErrorPayload) {
        super(message);

        this.code = code;
        this.status = status;
        this.suggestion = suggestion;
        this.field = field;
    }
}

/**
 * Checks generic errors like user authentication/authorization, Zod and Database inconsistencies errors
 * @param error Any error caught by try-catch block
 * @returns NextResponse with success flag and custom error
 */
export default function buildError(error: unknown): NextResponse {
    if (error instanceof CustomApiError) return buildCustomError(error);

    if (error instanceof ZodError) {
        
        const firstError = error.issues[0];
        const field = firstError.path.join(".");
        
        switch (field) {
            case "tenantId":
                return buildCustomError({
                    code: "TENANT_ERROR",
                    field,
                    message: "Current tenant is not linked/activated yet.",
                    suggestion: "Please contact IT administrator.",
                    status: 403
                })
            default:
                console.error(error);
                return buildCustomError({
                    code: ERROR_CODES.VALIDATION_ERROR,
                    field,
                    message: firstError.message,
                    suggestion: "Double-check the submitted form fields.",
                    status: 400
                });
        }
    }

    if (error instanceof DrizzleQueryError) {
        console.error(error);
        if (error instanceof DatabaseError) {
            console.error(error);

            return buildCustomError({
                code: ERROR_CODES.SERVER_ERROR,
                message: "Something went wrong while executing your query.",
                suggestion: "Please try again later.",
                status: 500
            });
        }

    }
    console.error(error);
    return buildCustomError({
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: "Unexpected server error",
        suggestion: "Please try again later",
        status: 500
    });

}

/**
 * Builds errors with custom parameters based on the default custom error pattern
 * @param param0 Custom error parameters
 * 
 * {
 * 
 *  code: string,
 * 
 *  message: string,
 * 
 *  field?: string,
 * 
 *  suggestion?: string,
 * 
 *  status?: string (default = 500)
 * 
 * }
 * @returns Custom error
 */
export function buildCustomError({
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