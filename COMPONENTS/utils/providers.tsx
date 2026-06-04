"use client"

import { QueryClient, QueryClientProvider, QueryFunctionContext } from "@tanstack/react-query";
import { AuthProvider } from "./authContext";
import { useState } from "react";
import { TUser } from "./types";


export default function Providers({ children, initialUser }: { children: React.ReactNode, initialUser?: TUser }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                queryFn: async ({ queryKey }) => {
                    const res = await fetch(queryKey[0] as string, {
                        credentials: "include"
                    });
                    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
                
                    return await res.json();
                },
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 10,
                retry: (failureCount, error) => {
                    if (error instanceof Error && error.message.includes("401")) return false;
                    return failureCount < 2;
                },
                retryDelay: (retryIdx) => Math.min(1000 * 2 ** retryIdx, 30000),
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