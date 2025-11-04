"use client"

import Sidebar from "@/COMPONENTS/Sidebar";
import Header from "./Header";
import { ThemeProvider } from "@mui/material";
import theme from "@/theme";
import { CssBaseline } from "@mui/material";
import { useEffect, useState } from "react";
import { redirect, usePathname } from "next/navigation";
import { useAuth } from "./utils/authContext";


const Body = ({children}: Readonly<{children: React.ReactNode}>) => {
    const [mounted, setMounted] = useState(false);

    const { user, isLoading } = useAuth();

    const pathname = usePathname();
    const hideLayout = pathname === "/login";

    if ((!isLoading && !user) && !hideLayout) {
        redirect("/login")
    }
    
    let pageName = pathname.length > 1 ? pathname.slice(1, 2).toUpperCase() + pathname.slice(2).toLowerCase() : "Dashboard";

    if (pageName.includes("Equipment/")) {
        pageName = "Equipment Details"
    }

    console.log(pageName);
    

    useEffect(() => {
        setMounted(true);
    }, [])

    if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        {hideLayout ? (
            <div className="p-6">
                {children}
            </div>
        ): (
            <>
                <Sidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <Header title={pageName} />

                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </>
        )}
    </ThemeProvider>
  )
}

export default Body