"use client"


import { TEquipment } from "@/COMPONENTS/utils/types";
import { Paper, Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"


const StatusChart = () => {

   const { data: equipments = {operational: 0, underRepair: 0, outOfService: 0}, isLoading: isLoadingEquipments } = useQuery<{ operational: number, underRepair: number, outOfService: number }>({
    queryKey: ["equipments-status"],
    queryFn: async () => {
        const res = await fetch("/api/stats/equipment-status");
        if (!res.ok) {
            toast.dismiss();
            toast.error("Failed to load equipment data. Try to refresh the page.");
            throw new Error("Failed to fetch equipment data");
        }

        return await res.json();
    }
   });

   const isLoading = (!equipments || isLoadingEquipments);
   if (isLoading) return (
    <Skeleton>
        <Paper sx={{ width: "100vw" }}>
            <h3 className="px-6 pt-4 font-semibold">Equipment Status</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[]}
                            cx="50%"
                            cy="50%"
                            labelLine
                            label={({ name, value, percent }) => 
                                `${value>0 ? name+":": ""} ${value>0?value+" | "+(percent ? percent*100 : 0).toFixed(1)+"%" : ""}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        >
                            {[].map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                >

                                </Cell>
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Paper>
    </Skeleton>
   )

   const statusData = [
    {name: "Operational", value: equipments.operational },
    {name: "Under Repair", value: equipments.underRepair },
    {name: "Out of Service", value: equipments.outOfService },
   ]


    
    const COLORS = ["#3cc92a", "#e5aa3cff", "#444444"];
   
  return (
    <Paper>
        <h3 className="px-6 pt-4 font-semibold">Equipment Status</h3>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        // labelLine
                        label={({ name, value, percent }) => 
                            `${value>0 ? name+":": ""} ${value>0?value+" | "+(percent ? percent*100 : 0).toFixed(1)+"%" : ""}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                >
                                </Cell>
                            ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                        formatter={(val) => {
                            const item = statusData.find(s => s.name === val);
                            return `${val} - ${item?.value ?? 0}`
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </Paper>
  )
}

export default StatusChart;