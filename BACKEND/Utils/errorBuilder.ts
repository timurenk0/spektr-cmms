import { NextResponse } from "next/server"


export type DBError = {
    params: any[],
    cause: string,
    length: number,
    severity: string,
    code: string,
    detail: string,
    hint: string | undefined,
    position: string | undefined,
    internalPosition: string | undefined,
    internalQuery: string | undefined,
    where: string | undefined,
    schema: string,
    table: string,
    column: string | undefined,
    dataType: string | undefined,
    constraint: string,
    file: string,
    line: number,
    routine: string
} 


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