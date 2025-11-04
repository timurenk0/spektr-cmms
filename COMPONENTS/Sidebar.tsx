import { CalendarCheck, CornerDownRight, LayoutDashboard, LogOut, Settings, User, Wrench } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './utils/authContext'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const Sidebar = () => {

    const pathName = usePathname();
    const { user, setUser, isLoading } = useAuth();


    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();
            
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
        },
        onSuccess: () => {
            setUser(null);
            toast.success("Logged out successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
        },
        onError: (error) => {
            toast.error(`Failed to logout: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    const handleLogout = () => {
        mutation.mutate();
    }

    
    const links = [
        {
            name: "Dashboard",
            path: "/",
            icon: <LayoutDashboard width={20} height={20} className='mr-3' />
        },
        {
            name: "Equipment",
            path: "/equipment",
            icon: <Wrench width={20} height={20} className='mr-3' />
        },
        {
            name: "Maintenance",
            path: "/maintenance",
            icon: <CalendarCheck width={20} height={20} className='mr-3' />
        },
        {
            name: "Settings",
            path: "/settings",
            icon: <Settings width={20} height={20} className='mr-3' />
        }
    ]


  return (
    <aside className='bg-white w-64 h-full shadow-md flex-shrink-0 fixed inset-y-0 left-0 z-20 lg:relative tranition-all duration-300'>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <a href="/" className='flex flex-col items-center'>
                <Image priority src="/spektr-logo.png" width={300} height={100} alt="SpektrGroup logo" className='h-10 mb-1' />
                <h1 className='text-lg font-semibold text-gray-800'>CMMS</h1>
            </a>
            <button className='lg:hidden text-gray-500 hover:text-gray-700'>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                </svg>
            </button>
        </div>

        <nav className='p-4'>
            <div className="mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Main
                </p>
                {links.map((link) => (
                    <div key={link.path}>
                    <Link href={link.path}>
                        <div className={`flex items-center p-2 rounded-md mb-1 ${pathName === link.path ? "bg-gray-100 inset-shadow-md": ""}`}>
                            {link.icon}
                            <span>{link.name}</span>
                        </div>
                    </Link>
                    {(link.name === "Equipment" && pathName.includes("/equipment/")) && (
                        <div className='cursor-default mb-2'>
                            <CornerDownRight width={16} height={16} className='inline ms-4' />
                            <div className="inline ms-2 p-2 text-sm bg-gray-100 inset-shadow-md rounded-md">Equipment ID {pathName.slice(pathName.indexOf("/", 2)+1)}</div>
                        </div>
                    )}
                    {(link.name === "Maintenance" && pathName.includes("/calendar")) && (
                        <div className='cursor-default mb-2'>
                            <CornerDownRight width={16} height={16} className='inline ms-4' />
                            <div className="inline ms-2 p-2 text-sm bg-gray-100 inset-shadow-md rounded-md">Calendar</div>
                        </div>
                    )}
                    </div>
                ))}
            </div>
        </nav>

        <div className='absolute bottom-0 w-full p-4 border-t border-gray-200'>
            <div className="flex justify-between">
                <Link href="/settings" className='flex'>
                    <div className='rounded-full border border-gray-400 p-1 me-2 bg-gray-100'>
                        <Image
                            src="https://imgs.search.brave.com/cbRsVEjsNvKT6LRtyrUsWg_th6qPs7DAMD5BtWhHjeU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS81/MTIvMTIyLzEyMjQ2/Mi5wbmc"
                            width={32}
                            height={32}
                            alt="user-pfp"
                            className='rounded-full'
                        />
                        {/* <User color='gray'></User> */}
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {isLoading ? "Fetching user..." : !user ? "No User" : user.username}
                        </p>
                        <p className="text-xs text-gray-500">{isLoading ? "" : !user ? "" : user.role}</p>
                    </div>
                    
                </Link>
                <button className="text-red-600/75 p-1 rounded-2xl cursor-pointer hover:bg-gray-50" onClick={handleLogout}>
                    <LogOut />
                </button>
            </div>
        </div>
    </aside>
  )
}

export default Sidebar