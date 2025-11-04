"use client"

import React, { createContext, useContext, useEffect, useState } from "react"


type AuthContextType = {
    user: IUser | null,
    isLoading: boolean,
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: IUser }> = ({
    children,
    initialUser
}) => {
    const [user, setUser] = useState<IUser | null>(initialUser ?? null);
    const [isLoading, setIsLoading] = useState(!initialUser);

    useEffect(() => {
        if (initialUser) return;
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include"
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                throw new Error(`Failed to fetch user: ${error}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [initialUser]);

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}