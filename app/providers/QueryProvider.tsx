"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { useState } from "react";


export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () => new QueryClient({
            defaultOptions: {
                queries: {
                    queryFn: async ({ queryKey }) => {
                        const url = queryKey[0] as string;
                        const res = await fetch(url, {
                            credentials: "include"
                        });
                        if (!res.ok) {
                            const error = await res.text();
                            throw new Error(error || "Network response error");
                        }
                        return res.json();
                    },
                    staleTime: 60 * 1000,
                    retry: 1
                }
            }
        })
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}