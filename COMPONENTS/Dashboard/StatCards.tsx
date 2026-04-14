"use client"

import StatCard from "./StatCard/StatCard"
import SliderStatCard from "./StatCard/SliderStatCard"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"

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


  if (!data || isLoading) {
    return (
      <h1>Loading...</h1>
    )
  }

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

        <StatCard variant="total" value1={data.eq} value2={data.mt} />

        <StatCard variant="overdue" value1={data.oeq} value2={data.omt} />

        <SliderStatCard variant="complete" slides={[completeSlides]} />

        <SliderStatCard variant="upcoming" slides={[upcomingSlides]} />

        <StatCard variant="emergency" value1={data.eeq} value2={data.emt} />


    </div>
  )
}

export default StatCards