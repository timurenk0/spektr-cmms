"use client"


import { Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"


const StatusChart = () => {

   const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{ data: IEquipment[], count: number }>({
    queryKey: ["/api/equipments"]
   });

   const isLoading = (!equipments || isLoadingEquipments);
   if (isLoading) return (<h1>Loading...</h1>)

   const statusData = [
    {name: "Operational", value: equipments.data.filter(eq => eq.status==="operational").length},
    {name: "Under Repair", value: equipments.data.filter(eq => eq.status==="under repair").length},
    {name: "Out of Service", value: equipments.data.filter(eq => eq.status==="out of service").length},
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
                        labelLine
                        label={({ name, value, percent }) => 
                            `${value>0 ? name+":": ""} ${value>0?value+" | "+(percent*100).toFixed(0)+"%" : ""}`
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
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </Paper>
  )
}

export default StatusChart;