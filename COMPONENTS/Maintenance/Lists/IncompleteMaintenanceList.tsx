
import GeneralMaintenanceList from './GeneralMaintenanceList'
import { useQuery } from '@tanstack/react-query'
import { TEquipment, TMaintenanceEvent } from '@/COMPONENTS/utils/types'
import { Skeleton } from '@mui/material'

const OverdueMaintenanceList = ({equipments}: { equipments: TEquipment[] }) => {
    const { data: events, isLoading: isLoadingEvents } = useQuery<TMaintenanceEvent[]>({
        queryKey: [`/api/maintenance-events?status=pending&start=${new Date(new Date().getTime() - 1000*86400*3).toISOString().slice(0, 10)}&end=${new Date().toISOString().slice(0, 10)}`]
    });

    if (!events || isLoadingEvents) {
      return (
        <Skeleton>
          <GeneralMaintenanceList equipments={[]} mEvents={[]} />
        </Skeleton>
      )
    }

  return (
    <>
      <GeneralMaintenanceList equipments={equipments} mEvents={events} />
    </>
  )
}

export default OverdueMaintenanceList;