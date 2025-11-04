import AddMaintenanceButton from "@/COMPONENTS/Maintenance/AddMaintenanceButton";
import MaintenanceList from "@/COMPONENTS/Maintenance/MaintenanceList";
import { Button } from "@mui/material";
import Link from "next/link";

const Maintenance = () => {
    
    const user = {
        role: "admin"
    }
    
  return (
    <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
                <h1 className="text-xl font-semibold">Maintenance Schedule</h1>
                <p className="text-sm text-gray-600">
                    Track and manage equipment maintenance tasks and calibrations
                </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
                <Link href="/calendar">
                    <Button variant="outlined">Go To Calendar</Button>
                </Link>
                
                {user.role === "admin" && (
                    <AddMaintenanceButton />
                )}
            </div>

        </div>
        <MaintenanceList />
    </>
  )
}

export default Maintenance;