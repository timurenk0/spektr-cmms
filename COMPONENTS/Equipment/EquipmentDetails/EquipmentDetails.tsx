"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "../../utils/authContext";
import { Button, Paper, Tab } from "@mui/material";
import { Activity, ArrowBigDown, Calendar, ChevronLeft, Clock, Pencil, RotateCcw, Wrench } from "lucide-react";
import Link from "next/link";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import EquipmentOverview from "./OverviewTab/EquipmentOverview";
import EquipmentDocuments from "./DocumentTab/EquipmentDocuments";
import EquipmentPhotos from "./PhotoTab/EquipmentPhotos";
import EquipmentActivity from "./ActivityTab/EquipmentActivity";

const EquipmentDetails = ({ equipmentId }: { equipmentId: number }) => {
  const [statusSelectionOpen, setStatusSelectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = (event: React.SyntheticEvent, val: string) => {
    setActiveTab(val);
  }

  const { user, isLoading: isLoadingUser } = useAuth();

  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<IEquipment>({
      queryKey: [`/api/equipments/${equipmentId}`]
  });

  const isLoading = (!equipment || isLoadingEquipment) || (!user || isLoadingUser);
  if (isLoading) return (<h1>Loading...</h1>);


  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="mr-6">
                <Image src={equipment.equipmentImage} width={200} height={200} className="max-w-[200px] rounded-md object-cover border" alt="Equipment image" />
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
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">Type</span>
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">{equipment.type}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">Location</span>
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">{equipment.location}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">Owning Dept.</span>
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">{equipment.department}</span>
                  </div>

                  <div className="flex flex-col items-center relative">
                    <span className="text-xs text-gray-500 mb-1">Status</span>
                      <div className={`pb-1 px-2 rounded-full text-xs font-semibold ${
                        equipment.status === "operational" ? "bg-green-200 text-green-800" :
                        equipment.status === "under repair" ? "bg-amber-200 text-amber-800" :
                        equipment.status === "out of service" && "bg-red-200 text-red-800"
                      }`}>
                        {equipment.status.slice(0, 1).toUpperCase()}{equipment.status.slice(1).toLowerCase()}
                        { user.role === "admin" && (
                          <button
                          onClick={() => setStatusSelectionOpen(!statusSelectionOpen)}
                          className={`
                            ${equipment.status === "operational" ? "text-green-800 hover:text-green-400" :
                              equipment.status === "under repair" ? "text-amber-800 hover:bg-amber-600" :
                              "text-amber-800 hover:bg-amber-600"
                          } h-[16px] w-[16px] ms-1 rounded-full cursor-pointer`}
                          >
                            <ArrowBigDown height={16} width={16} className="mt-1" />
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
                            >
                              Operational
                            </li>
                            <li className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                              Under Repair
                            </li>
                            <li className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
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
                <div className="text-sm font-medium text-green-600">
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
                  <div className="text-sm font-medium text-blue-600">
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
                <div className="text-sm font-medium text-orange-600">
                  {equipment.lastEvent}
                </div>
                <div className="text-xs text-gray-500">Last Maintenance</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Wrench width={24} height={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-meidum text-purple-600">
                  {equipment.nextEvent}
                </div>
                <div className="text-xs text-gray-500">Next Maintenance</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                <Activity width={24} height={24} />
              </div>
              <div className="relative">
                <div className={`text-sm font-medium`}>
                  {equipment.healthIndex ? `${equipment.healthIndex}%` : "N/A"}
                </div>
                <div className="text-xs text-gray-500">Health Score</div>
              </div>
            </div>
          </div>
        </div>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TabContext value={activeTab}>
            <TabList onChange={handleTabChange} variant="fullWidth" className="border-b border-gray-300">
              <Tab label="Overview" value="overview" />
              <Tab label="Documents" value="documents" />
              <Tab label="Photos" value="photo" />
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