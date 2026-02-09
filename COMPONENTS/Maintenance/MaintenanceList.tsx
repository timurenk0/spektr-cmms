"use client"


import { Paper, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useQuery } from "@tanstack/react-query"
import { useState } from "react";
import AllMaintenanceList from "./Lists/AllMainetnanceList";
import UpcomingMaintenanceList from "./Lists/UpcomingMaintenanceList";
import ListSkeleton from "../SKELETONS/ListSkeleteon";
import CompleteMaintenanceList from "./Lists/CompleteMaintenanceList";
import OverdueMaintenanceList from "./Lists/IncompleteMaintenanceList";
import { TEquipment, TMaintenance } from "../utils/types";
import { useAuth } from "../utils/authContext";

const MaintenanceList = () => {
  const [value, setValue] = useState("All");

  const { user, isLoading: isLoadingUser } = useAuth();

  // Fetch data
  const { data: maintenances, isLoading: isLoadingMaintenances } = useQuery<TMaintenance[]>({
    queryKey: ["/api/maintenances"]
  });

  const { data: info, isLoading: isLoadingInfo } = useQuery<{total: number, upcoming: number, overdue: number, complete: number, incomplete: number}>({
    queryKey: ["/api/maintenance-events/info"]
  });

  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ equips: TEquipment[], totalCount: number }>({
    queryKey: ["/api/equipments?concise=true"]
  });


  const handleValueChange = (event: React.SyntheticEvent, val: string) => {
    setValue(val);
  }
  
  const isLoading =
    (isLoadingUser || !user) ||
    (isLoadingMaintenances || !maintenances) ||
    (isLoadingEquipments || !equipments) ||
    (isLoadingInfo || !info);

  if (isLoading) return (
    <ListSkeleton />
  )

  
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TabContext value={value}>
        <TabList onChange={handleValueChange} variant="fullWidth" className="border-b border-gray-300">
          <Tab label={`All (${info.total})`} value="All"  />
          <Tab label={`Upcoming (${info.upcoming})`} value="Upcoming"  />
          <Tab label={`Complete (${info.complete})`} value="Complete"  />
          <Tab label={`Overdue (${info.overdue})`} value="Overdue"  />
        </TabList>
        <TabPanel value="All">
          <AllMaintenanceList userRole={user.role} maintenances={maintenances} info={info} equipments={equipments.equips} />
        </TabPanel>
        <TabPanel value="Upcoming">
          <UpcomingMaintenanceList equipments={equipments.equips} />
        </TabPanel>
        <TabPanel value="Complete">
          <CompleteMaintenanceList equipments={equipments.equips} />
        </TabPanel>
        <TabPanel value="Overdue">
          <OverdueMaintenanceList equipments={equipments.equips} />
        </TabPanel>
      </TabContext>
    </Paper>
  )
}

export default MaintenanceList