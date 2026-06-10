"use client"

import StatCard from "./StatCard/StatCard"
import SliderStatCard from "./StatCard/SliderStatCard"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Skeleton } from "@mui/material"

const StatCards = () => {    
  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-cards"],
    queryFn: async () => {
      const res = await fetch("/api/stats/dashboard-cards");
      if (!res.ok) {
        toast.dismiss();
        toast.error("Failed to retrieve stats. Try to refresh the page");
        throw new Error("Failed to fetch stats");
      }

      return await res.json();
    }
  });


  const loading = (!data || isLoading);
  
  if (loading) return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Skeleton variant="rounded">
          <StatCard variant="total" value1={0} value2={0} />
        </Skeleton>
        <Skeleton variant="rounded">
          <StatCard variant="overdue" value1={0} value2={0} />
        </Skeleton>
        <Skeleton variant="rounded">
          <SliderStatCard variant="complete" slides={[{title: "", uniqueEquipmentCount: 0, totalTasksCount: 0}]} />
        </Skeleton>
        <Skeleton variant="rounded">
          <SliderStatCard variant="upcoming" slides={[{title: "", uniqueEquipmentCount: 0, totalTasksCount: 0}]} />
        </Skeleton>
        <Skeleton variant="rounded">
          <StatCard variant="emergency" value1={0} value2={0} />
        </Skeleton>
      </div>
  )

  const completeSlides = [
    {
      title: "Last 7 days",
      uniqueEquipmentCount: data.ceq1,
      totalTasksCount: data.cmt1,
    },
    {
      title: "Last 14 days",
      uniqueEquipmentCount: data.ceq2,
      totalTasksCount: data.cmt2,
    },
    {
      title: "Last 21 days",
      uniqueEquipmentCount: data.ceq3,
      totalTasksCount: data.cmt3,
    },
    {
      title: "Last 28 days",
      uniqueEquipmentCount: data.ceq4,
      totalTasksCount: data.cmt4,
    },
  ]
  
  const upcomingSlides = [
    {
      title: "7 days",
      uniqueEquipmentCount: data.ueq1,
      totalTasksCount: data.umt1,
    },
    {
      title: "14 days",
      uniqueEquipmentCount: data.ueq2,
      totalTasksCount: data.umt2,
    },
    {
      title: "21 days",
      uniqueEquipmentCount: data.ueq3,
      totalTasksCount: data.umt3,
    },
    {
      title: "28 days",
      uniqueEquipmentCount: data.ueq4,
      totalTasksCount: data.umt4,
    },
  ]


    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <>
            <StatCard variant="total" value1={data.eq} value2={data.mt} />
            <StatCard variant="overdue" value1={data.oeq} value2={data.omt} />
            <SliderStatCard variant="complete" slides={completeSlides} />
            <SliderStatCard variant="upcoming" slides={upcomingSlides} />
            <StatCard variant="emergency" value1={data.epn} value2={data.ecm} />
          </>
    </div>
  )
}

export default StatCards