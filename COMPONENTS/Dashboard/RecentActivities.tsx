"use client"

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";



const getActivityColor = (action: string) => {
    const colors: Record<string, string> = {
        "add": "bg-green-500",
        "delete": "bg-red-500",
        "update": "bg-amber-500"
    };

    return colors[action];
}

const RecentActivities = ({ equipmentId } : { equipmentId?: number }) => {
    
    const { data: activities=[], isLoading: isLoadingActivities } = useQuery<IActivity[]>({
        queryKey: equipmentId ? [`/api/activities?equipmentId=${equipmentId}`] : ["/api/activities"]
    });


    const isLoading = (!activities || isLoadingActivities);
    if (isLoading) return (<h1>Loading...</h1>);
    
  return (
    <>
    {!equipmentId && (
        <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold">Recent Activities</h2>
        </div>
    )}
        <div className="p-4">
            <div className="grid grid-cols-3 gap-6">
                {activities.length > 0 ? activities.map(activity => (
                    <div key={activity.id} className="flex">
                        <div className="flex-shrink-0 w-8">
                            <div className={`w-2 h-2 ${getActivityColor(activity.action)} rounded-full mt-2 mx-auto`}></div>
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                                {format(activity.createdAt, "MMM dd, yyyy | HH:mm:ss | ")}
                                by {activity.username}
                            </p>
                        </div>
                    </div>
                )) : "Nothing to see here yet..."}
            </div>
        </div>
    </>
  )
}

export default RecentActivities;