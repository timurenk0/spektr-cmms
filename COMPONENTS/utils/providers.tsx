"use client"

import { QueryClient, QueryClientProvider, QueryFunctionContext } from "@tanstack/react-query";
import { AuthProvider } from "./authContext";
import { useState } from "react";


export default function Providers({ children, initialUser }: { children: React.ReactNode, initialUser?: IUser }) {
    const defaultQueryFn = async ({ queryKey }: QueryFunctionContext) => {
        const res = await fetch(queryKey[0] as string);
        if (!res.ok) throw new Error("Fetch request failed");
        return await res.json();
    }
    
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                queryFn: defaultQueryFn
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider initialUser={initialUser}>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    )
}