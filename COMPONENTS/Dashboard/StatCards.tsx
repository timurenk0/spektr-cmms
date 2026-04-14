"use client"

import StatCard from "./StatCard/StatCard"
import SliderStatCard from "./StatCard/SliderStatCard"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Skeleton } from "@mui/material"

const StatCards = () => {    
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-cards"],
    queryFn: async () => {
      const res = await fetch("/api/stats/dashboard-cards");
      if (!res.ok) {
        toast.error("Failed to retrieve stats. Try to refresh the page", {
          icon: "😕"
        });
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

  const completeSlides = {
      title: "oat",
      uniqueEquipmentCount: data.ceq,
      totalTasksCount: data.cmt,
  };
  
  const upcomingSlides = {
      title: "oat",
      uniqueEquipmentCount: data.ueq,
      totalTasksCount: data.umt,
    };


    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <>
            <StatCard variant="total" value1={data.eq} value2={data.mt} />
            <StatCard variant="overdue" value1={data.oeq} value2={data.omt} />
            <SliderStatCard variant="complete" slides={[completeSlides]} />
            <SliderStatCard variant="upcoming" slides={[upcomingSlides]} />
            <StatCard variant="emergency" value1={data.eeq} value2={data.emt} />
          </>
    </div>
  )
}

export default StatCards