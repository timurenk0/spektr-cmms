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

    const refreshUser = async () => {
        try {
            const res = await fetch("/api/auth/me", {
                credentials: "include"
            });
            if (res.ok) {
                setUser(await res.json());
            } else {
                setUser(null);
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (initialUser) {
            setIsLoading(false);
            return;
        }
        
        
        refreshUser();
    }, [initialUser]);

    const value = useMemo(() => ({user, setUser, isLoading, refreshUser}), [user, isLoading])
    
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