"use client"


import { TEquipment } from "@/COMPONENTS/utils/types";
import { Button, Paper, Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
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


const TypeChart = () => {
    const [category, setCategory] = useState<string>("");

    const { data: equipments, isLoading: isLoadingEquipment } = useQuery<{ equips: TEquipment[], count: number }>({
        queryKey: ["/api/equipments"]
    });

    const isLoading = (!equipments  || isLoadingEquipment);
    if (isLoading) return (
        <Skeleton>
            <Paper sx={{ width: "100vw" }}>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[]}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 0
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                // className={!type ? "underline cursor-pointer" : ""}
                                style={!category ? { textDecoration: "underline", cursor: "pointer" } : {}}
                                dataKey="name"
                                angle={-25}
                                textAnchor="end"
                                height={100}
                                onClick={(e) => {!category ? setCategory(e.value) : ""}}
                            />
                            <YAxis
                                tickCount={0}
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
        </Skeleton>
    );



    const equipmentCategoryCount = equipments.equips.reduce((acc: Record<string, number>, equipment: TEquipment) => {
        acc[equipment.category || "Uncategorized"] = (acc[equipment.category || "Uncategorized"] || 0) + 1;
        return acc;
    }, {});

    const equipmentTypeCount = equipments.equips.reduce((acc: Record<string, number>, equipment: TEquipment) => {
        if (equipment.category === category) {
            acc[equipment.type] = (acc[equipment.type] || 0) + 1;
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
        setCategory("");
    }

    const chartData = category ? equipmentTypeData : equipmentCategoryData;
    const maxCount = Math.max(...chartData.map(i => i.count), 1);

  return (
    <Paper>
            <h3 className="px-6 pt-4 font-semibold">Equipment by {!category ? "Category" : `Type (category=${category})`}</h3>
            {category.length>0 ? (
                <Button onClick={refreshChart}  variant="text" color="inherit" sx={{ marginLeft: "1rem" }}>
                    <ArrowLeftIcon width={32} height={32} />
                </Button>
            ) : ""}
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={category ? equipmentTypeData : equipmentCategoryData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 0
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        // className={!type ? "underline cursor-pointer" : ""} 
                        style={!category ? { textDecoration: "underline", cursor: "pointer" } : {}}
                        dataKey="name" 
                        angle={-25} 
                        textAnchor="end" 
                        height={100} 
                        onClick={(e) => {!category ? setCategory(e.value) : ""}}
                    />
                    <YAxis
                        domain={[0, Math.max(maxCount, 5)]}
                        tickCount={6}
                        interval={0}
                        allowDecimals={false}
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