"use client"


import { Paper, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useQuery } from "@tanstack/react-query"
import { useState } from "react";
import AllMaintenanceList from "./Lists/AllMainetnanceList";
import UpcomingMaintenanceList from "./Lists/UpcomingMaintenanceList";
import GeneralMaintenanceList from "./Lists/GeneralMaintenanceList";
import ListSkeleton from "../SKELETONS/ListSkeleteon";

const MaintenanceList = () => {
  const [value, setValue] = useState("All");

  // Fetch data
  const { data: maintenances, isLoading: isLoadingMaintenances } = useQuery<IMaintenance[]>({
    queryKey: ["/api/maintenances"]
  });

  const { data: mEvents, isLoading: isLoadingMEvents } = useQuery<IMaintenanceEvent[]>({
    queryKey: ["/api/maintenance-events"]
  });

  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ equips: IEquipment[], totalCount: number }>({
    queryKey: ["/api/equipments?concise=true"]
  });


  const handleValueChange = (event: React.SyntheticEvent, val: string) => {
    setValue(val);
  }
  
  const isLoading =
    (isLoadingMaintenances || !maintenances) ||
    (isLoadingEquipments || !equipments) ||
    (isLoadingMEvents || !mEvents);

  if (isLoading) return (
    <ListSkeleton />
  )

  const upcomingMantenances = mEvents.filter(ev => ev.status === "upcoming");
  const completeMaintenances = mEvents.filter(ev => ev.status === "complete");
  const overdueMaintenances = mEvents.filter(ev => ev.status === "overdue");

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TabContext value={value}>
        <TabList onChange={handleValueChange} variant="fullWidth" className="border-b border-gray-300">
          <Tab label={`All (${mEvents.length})`} value="All"  />
          <Tab label={`Upcoming (${upcomingMantenances.length})`} value="Upcoming"  />
          <Tab label={`Complete (${completeMaintenances.length})`} value="Complete"  />
          <Tab label={`Overdue (${overdueMaintenances.length})`} value="Overdue"  />
        </TabList>
        <TabPanel value="All">
          <AllMaintenanceList maintenances={maintenances} mEvents={[]} equipments={equipments.equips} />
        </TabPanel>
        <TabPanel value="Upcoming">
          <UpcomingMaintenanceList mEvents={upcomingMantenances} equipments={equipments.equips} />
        </TabPanel>
        <TabPanel value="Complete">
          <GeneralMaintenanceList mEvents={completeMaintenances} equipments={equipments.equips} complete />
        </TabPanel>
        <TabPanel value="Overdue">
          <GeneralMaintenanceList mEvents={overdueMaintenances} equipments={equipments.equips} />
        </TabPanel>
      </TabContext>
    </Paper>
  )
}

export default MaintenanceList