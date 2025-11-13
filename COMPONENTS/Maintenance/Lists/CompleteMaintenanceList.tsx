"use client"

import React from 'react'
import GeneralMaintenanceList from './GeneralMaintenanceList'
import { useQuery } from '@tanstack/react-query'

const CompleteMaintenanceList = ({equipments}: { equipments: IEquipment[] }) => {
    const { data: events, isLoading: isLoadingEvents } = useQuery<IMaintenanceEvent[]>({
        queryKey: ["/api/maintenance-events?status=complete"]
    });

    if (!events || isLoadingEvents) {
        return <h1>Loading...</h1>
    }
    
  return (
    <GeneralMaintenanceList equipments={equipments} mEvents={events} complete />
  )
}

export default CompleteMaintenanceList