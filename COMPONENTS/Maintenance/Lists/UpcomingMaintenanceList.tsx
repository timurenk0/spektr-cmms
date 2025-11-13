"use client"

import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Paper, Tab } from "@mui/material";
import { useState } from "react";
import GeneralMaintenanceList from "./GeneralMaintenanceList";
import { differenceInDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";


const UpcomingMaintenanceList = ({
    equipments
}: {
    equipments: IEquipment[]
}) => {
    const [value, setValue] = useState("7");
    
    const today = new Date();
    const latestDate = new Date(today);
    latestDate.setDate(latestDate.getDate()+28);

    const { data: events, isLoading: isLoadingEvents } = useQuery<IMaintenanceEvent[]>({
        queryKey: [`/api/maintenance-events?status=upcoming&start=${today.toISOString().slice(0, 10)}&end=${latestDate.toISOString().slice(0, 10)}`]
    });

    if (!events || isLoadingEvents) return <h1>Loading...</h1>

    const handleValueChange = (event: React.SyntheticEvent, val: string) => {
        setValue(val);
    }

    
    const mEvents_7 = events.filter(ev => differenceInDays(new Date(ev.start), new Date()) <= 7);
    const mEvents_14 = events.filter(ev => differenceInDays(new Date(ev.start), new Date()) <= 14);
    const mEvents_21 = events.filter(ev => differenceInDays(new Date(ev.start), new Date()) <= 21);
    const mEvents_28 = events;
    
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TabContext value={value}>
            <TabList onChange={handleValueChange}>
                <Tab label={`7 days (${mEvents_7.length})`} value="7" />
                <Tab label={`14 days (${mEvents_14.length})`} value="14" />
                <Tab label={`21 days (${mEvents_21.length})`} value="21" />
                <Tab label={`28 days (${mEvents_28.length})`} value="28" />
            </TabList>
            <TabPanel value="7">
                <GeneralMaintenanceList mEvents={mEvents_7} equipments={equipments} />
            </TabPanel>
            <TabPanel value="14">
                <GeneralMaintenanceList mEvents={mEvents_14} equipments={equipments} />
            </TabPanel>
            <TabPanel value="21">
                <GeneralMaintenanceList mEvents={mEvents_21} equipments={equipments} />
            </TabPanel>
            <TabPanel value="28">
                <GeneralMaintenanceList mEvents={mEvents_28} equipments={equipments} />
            </TabPanel>
        </TabContext>
    </Paper>
        
  )
}

export default UpcomingMaintenanceList;