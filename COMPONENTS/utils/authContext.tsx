"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { TUser } from "./types";


type AuthContextType = {
    user: TUser | null,
    isLoading: boolean,
    setUser: React.Dispatch<React.SetStateAction<TUser | null>>
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: TUser }> = ({
    children,
    initialUser
}) => {
    const [user, setUser] = useState<TUser | null>(initialUser ?? null);
    const [isLoading, setIsLoading] = useState(!initialUser);

    useEffect(() => {
        if (initialUser) {
            setIsLoading(false);
            return;
        }
        
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include"
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else if (response.status === 401) {
                    setUser(null);
                }

            } catch (error) {
                setUser(null);
                throw new Error(`Failed to fetch user: ${error}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [initialUser]);

    const value = useMemo(() => ({user, setUser, isLoading}), [user, isLoading])
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}