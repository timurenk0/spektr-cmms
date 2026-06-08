"use client"

import { useQuery } from "@tanstack/react-query"
import GaugeChart from "./Charts/GaugeChart"
import toast from "react-hot-toast"
import { Skeleton } from "@mui/material"


const GaugeCharts = () => {
    const { data = {}, isLoading } = useQuery({
        queryKey: ["dashboard-gauges"],
        queryFn: async () => {
            const res = await fetch("/api/stats/kpis");
            if (!res.ok) {
                toast.dismiss()
                toast.error("Failed to retrieve KPI data. Try to refresh the page.");
                throw new Error("Failed to fetch KPI endpoint");
            }

            return await res.json();
        }
    })


    const loading = !data || isLoading;

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Skeleton variant="rounded">
                    <GaugeChart value={0} title="" subtitle="" statClass="" />
                </Skeleton>
                <Skeleton variant="rounded">
                    <GaugeChart value={0} title="" subtitle="" statClass="" />
                </Skeleton>
                <Skeleton variant="rounded">
                    <GaugeChart value={0} title="" subtitle="" statClass="" />
                </Skeleton>
                <Skeleton variant="rounded">
                    <GaugeChart value={0} title="" subtitle="" statClass="" />
                </Skeleton>
            </div>
        )
    }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <GaugeChart value={data.msc} title="Maintenance Schedule Compliance (MSC)" subtitle="Target > 90%" statClass="msc" />
        <GaugeChart value={data.err} title="Emergency Repairs Ratio (ERR)" subtitle="Target < 5%" statClass="err" />
        <GaugeChart value={data.tcm} title="Timely Completed Maintenances (TCM)" subtitle="Target > 90%" statClass="tcm" />
        <GaugeChart value={data.ehi} title="Equipment Health Index (EHI)" subtitle="Target > 75%" statClass="ehi" />
    </div>
  )
}

export default GaugeCharts;