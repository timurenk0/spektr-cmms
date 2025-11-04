"use client"


import { Button, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts"


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const TypeChart = () => {
    const [type, setType] = useState<string>("");

    const { data: equipments, isLoading: isLoadingEquipment } = useQuery<{ data: IEquipment[], count: number }>({
        queryKey: ["/api/equipments"]
    });

    const isLoading = (!equipments  || isLoadingEquipment);
    if (isLoading) return (<h1>Loading...</h1>);



    const equipmentTypeCount = equipments.data.reduce((acc: Record<string, number>, equipment: IEquipment) => {
        acc[equipment.type || "Uncategorized"] = (acc[equipment.type || "Uncategorized"] || 0) + 1;
        return acc;
    }, {});

    const equipmentCategoryCount = equipments.data.reduce((acc: Record<string, number>, equipment: IEquipment) => {
        if (equipment.type === type) {
            acc[equipment.category] = (acc[equipment.category] || 0) + 1;
        }
        return acc;
    }, {});

    const equipmentTypeData = Object.keys(equipmentTypeCount).map((type) => ({
        name: type,
        count: equipmentTypeCount[type]
    }));

    const equipmentCategoryData = Object.keys(equipmentCategoryCount).map((category) => ({
        name: category,
        count: equipmentCategoryCount[category]
    }));

    const refreshChart = () => {
        setType("");
    }
    
  return (
    <Paper>
            <h3 className="px-6 pt-4 font-semibold">Equipment by {!type ? "Type" : `Category (type=${type})`}</h3>
            {type.length>0 ? (
                <Button onClick={refreshChart}  variant="text" color="inherit" sx={{ marginLeft: "1rem" }}>
                    <RefreshCw width={32} height={32} />
                </Button>
            ) : ""}
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={type.length>0 ? equipmentCategoryData : equipmentTypeData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 0
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        className={!type ? "underline cursor-pointer" : ""} 
                        dataKey="name" 
                        angle={-25} 
                        textAnchor="end" 
                        height={100} 
                        onClick={(e) => {!type ? setType(e.value) : ""}}
                    />
                    <YAxis
                        tickCount={type.length>0 ? Math.max(...equipmentCategoryData.map(d => d.count)) + 1 : Math.max(...equipmentTypeData.map(d => d.count)) + 1}
                        interval={0}
                    />
                    <Tooltip/>
                    <Legend/>
                    <Bar
                        dataKey="count"
                        name="Equipment Count"
                        fill="#2563eb"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </Paper>
  )
}

export default TypeChart;