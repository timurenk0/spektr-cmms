"use client"

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "../../utils/authContext";
import { Button, Paper, Tab } from "@mui/material";
import { ArrowBigDown, Calendar, ChevronLeft, Clock, Pencil, RotateCcw, Wrench } from "lucide-react";
import Link from "next/link";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import EquipmentOverview from "./OverviewTab/EquipmentOverview";
import EquipmentDocuments from "./DocumentTab/EquipmentDocuments";
import EquipmentPhotos from "./PhotoTab/EquipmentPhotos";
import EquipmentActivity from "./ActivityTab/EquipmentActivity";
import { TEquipment } from "@/COMPONENTS/utils/types";
import { HealthBadgeFull } from "@/COMPONENTS/ui/badges/HealthBadge";
import { DetailBadge } from "@/COMPONENTS/ui/badges/DetailBadge";
import EquipmentComponents from "./ComponentTab/EquipmentComponents";
import { format } from "date-fns";
import toast from "react-hot-toast";


const getHealthBadge = (healthIndex: number | null) => {
  if (healthIndex == null) {
    return (
      <HealthBadgeFull color="gray" value="-" />
    )
  }

  if (healthIndex < 30) {
    return (
      <HealthBadgeFull color="red" value={healthIndex.toFixed(2)} />
    )
  } else if (healthIndex < 60) {
    return (
      <HealthBadgeFull color="amber" value={healthIndex.toFixed(2)} />
    )
  } else if (healthIndex < 85) {
    return (
      <HealthBadgeFull color="yellow" value={healthIndex.toFixed(2)} />
    )
  } else {
    return (
      <HealthBadgeFull color="green" value={healthIndex.toFixed(2)} />
    )
  }
}

const statusColors: Record<string, string> = {
  "operational": "bg-green-200 text-green-800",
  "under repair": "bg-amber-200 text-amber-800",
  "out of service": "bg-red-200 text-red-800",
}

const hoverStatusColors: Record<string, string> = {
  "operational": "text-green-800 hover:text-green-400",
  "under repair": "text-amber-800 hover:text-amber-400",
  "out of service": "text-red-800 hover:text-red-400",
}

const EquipmentDetails = ({ equipmentId }: { equipmentId: number }) => {
  const queryClient = useQueryClient();
  const [statusSelectionOpen, setStatusSelectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = (event: React.SyntheticEvent, val: string) => {
    setActiveTab(val);
  }

  const { user, isLoading: isLoadingUser } = useAuth();

  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<TEquipment>({
      queryKey: [`equipment`, equipmentId],
      queryFn: async () => {
        const res = await fetch(`/api/equipments/${equipmentId}`, {
          method: "GET",
          credentials: "include"
        });
        if (!res.ok) {
          throw new Error("Failed to fetch equipment unit");
        }

        return await res.json()
      }
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (status === equipment?.status) {
        toast.error("Can't update equipment status to the same status value");
        throw new Error("Same status update rejected");
      }

      const res = await fetch(`/api/equipments/${equipmentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status
        }),
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Failed to update equipment status");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId] });
      toast.success(`Updated equipment status to ${data}`);
      return; 
    },
    onError: (err) => {
      toast.error("Failed to update equipment status");
      console.error(err);
      return; 
    }
  });
  
  const isLoading = (!equipment || isLoadingEquipment) || (!user || isLoadingUser);
  if (isLoading) return (<h1>Loading...</h1>);

  console.log(equipment)

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="mr-6">
                <Image src={equipment.equipmentImage} width={200} height={200} className="max-w-[200px] max-h-[200px] rounded-md object-cover border" alt="Equipment image" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  {equipment.name}
                  {equipment.status === "operational" && (
                    <div className="ml-2 w-3 h-3 rounded-full bg-green-500"></div>
                  )}
                </h1>
                <div className="text-sm text-gray-600 mt-1 mb-1">
                  {equipment.manufacturer}{" "}{equipment.model}
                </div>
                <div className="flex space-x-3 mt-2">
                  <DetailBadge name="Type" text={equipment.type} />
                  <DetailBadge name="Location" text={equipment.location} />
                  <DetailBadge name="Owning Dept." text={equipment.department} />

                  <div className="flex flex-col items-center relative">
                    <span className="text-xs text-gray-500 mb-1">Status</span>
                      <div className={`flex ${statusColors[equipment.status]} py-1 px-2 rounded-full text-xs font-semibold`}>
                          {equipment.status.slice(0, 1).toUpperCase()}{equipment.status.slice(1).toLowerCase()}
                          { user.role === "admin" && (
                            <button
                            onClick={() => setStatusSelectionOpen(!statusSelectionOpen)}
                            className={`
                              ${hoverStatusColors[equipment.status]} h-4 w-4 ms-1 rounded-full cursor-pointer`}
                            >
                              <ArrowBigDown height={16} width={16} />
                            </button>
                          )}
                      </div>
                      {statusSelectionOpen && (
                        <div
                        className="absolute top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        onMouseLeave={() => setStatusSelectionOpen(false)}
                        >
                          <ul className="py-1">
                            <li
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => updateStatus.mutate("operational")}
                            >
                              Operational
                            </li>
                            <li
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => updateStatus.mutate("under repair")}
                            >
                              Under Repair
                            </li>
                            <li
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => updateStatus.mutate("out of service")}
                            >
                              Out of Service
                            </li>
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <Link href="/equipment">
              <Button variant="outlined" color="inherit">
                <ChevronLeft height={16} width={16} className="mr-1" /> Back to List
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-4 mt-8">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <Calendar width={24} height={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-green-600">
                  12
                </div>
                <div className="text-xs text-gray-500">Equipment Age</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Clock width={24} height={24} className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-blue-600">
                    {equipment.totalWorkingHours || "N/A"}
                  </div>
                  {equipment.totalWorkingHours && (
                    <Button
                    variant="text"
                    color="inherit"
                    sx={{ height: "24px", fontSize: "8px" }}
                    >
                      <Pencil width={12} height={12} className="mr-1" /> Edit
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-500">Working Hours</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <RotateCcw width={24} height={24} className="text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-orange-600">
                  {equipment.lastEvent ? format(equipment.lastEvent, "MMM d, yyyy") : "N/A"}
                </div>
                <div className="text-xs text-gray-500">Last Maintenance</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Wrench width={24} height={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-purple-600">
                  {equipment.nextEvent ? format(equipment.nextEvent, "MMM d, yyyy") : "N/A"}
                </div>
                <div className="text-xs text-gray-500">Next Maintenance</div>
              </div>
            </div>

            { getHealthBadge(equipment.healthIndex) }
          </div>
        </div>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TabContext value={activeTab}>
            <TabList onChange={handleTabChange} variant="fullWidth" className="border-b border-gray-300">
              <Tab label="Overview" value="overview" />
              <Tab label="Documents" value="documents" />
              <Tab label="Photos" value="photo" />
              <Tab label="Crit. Components" value="components" />
              <Tab label="Activities" value="activity" />
            </TabList>
            <TabPanel value="overview">
              <EquipmentOverview equipment={equipment} />
            </TabPanel>
            <TabPanel value="documents">
              <EquipmentDocuments equipmentId={equipment.id} userRole={user.role} />
            </TabPanel>
            <TabPanel value="photo">
              <EquipmentPhotos equipmentId={equipment.id} userRole={user.role} />
            </TabPanel>
            <TabPanel value="components">
              <EquipmentComponents equipmentId={equipment.id} userRole={user.role} />
            </TabPanel>
            <TabPanel value="activity">
              <EquipmentActivity equipmentId={equipment.id} />
            </TabPanel>
          </TabContext>
        </Paper>
      </div>
    </div>
  )
}

export default EquipmentDetails