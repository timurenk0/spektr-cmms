import RecentActivities from '@/COMPONENTS/Dashboard/RecentActivities';
import React from 'react'

const EquipmentActivity = ({ equipmentId }: { equipmentId: number }) => {
  return (
    <RecentActivities equipmentId={equipmentId} />
  )
}

export default EquipmentActivity;  
