import { Box, TableCell, TableRow } from "@mui/material";
import { Edit, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AddEquipmentForm from "./AddEquipmentForm";
import SlideDialog from "../ui/SlideDialog";
import DeleteEquipmentForm from "./DeleteEquipmentForm";
import { TEquipment } from "../utils/types";
import { HealthBadge } from "../ui/badges/HealthBadge";
import { StatusBadge } from "../ui/badges/StatusBadge";
import { format } from "date-fns";
import { useState } from "react";


const getStatusBadge = (status: string) => {
    switch (status) {
        case "operational":
            return (
                <StatusBadge color="green" status="Operational" />
            );
        case "under repair":
            return (
                <StatusBadge color="amber" status="Under Repair" />
            );
        case "out of service":
            return (
                <StatusBadge color="red" status="Out of Service" />
            );
        default:
            return (
                <StatusBadge color="gray" status="Invalid Status (error)" />
            );
    }
};

const getHealthBadge = (healthIndex: number | null) => {
    if (healthIndex == null) {
        return (
            <HealthBadge color="gray" value="-" />
        )
    }

    if (healthIndex < 30) {
        return (
            <HealthBadge color="red" value={healthIndex.toFixed(2)} />
        )
    } else if (healthIndex < 60) {
        return (
            <HealthBadge color="amber" value={healthIndex.toFixed(2)} />
        )
    } else if (healthIndex < 85) {
        return (
            <HealthBadge color="yellow" value={healthIndex.toFixed(2)} />
        )
    } else {
        return (
            <HealthBadge color="green" value={healthIndex.toFixed(2)} />
        )
    }
}

const EquipmentListEl = ({ equipment, userRole }: { equipment: TEquipment, userRole: string }) => {
    const router = useRouter();

  return (
        <TableRow sx={{ "& .MuiTableCell-root": { textAlign: "center", cursor: "pointer", padding: "0 32px" } }} hover onClick={() => router.push(`/equipment/${equipment.id}`)}>
            {/* Equipment image and name */}
            <TableCell>
                <div className="flex items-center">
                    <div className="h-28 w-28 overflow-hidden flex items-center">
                        {/* add max-h-[128px] to image if you want the image to resize */}
                        <Image className="max-w-28" src={equipment.equipmentImage ? equipment.equipmentImage : "/window.svg"} width={112} height={112} alt="Equipment image" />
                    </div>
                    <div className="ml-2 flex-1 text-left">
                        <div className="text-xs font-medium truncate max-w-32" title={equipment.name}>
                            {equipment.name}
                        </div>
                        <div className="text-gray-500 mt-1 truncate max-w-32" style={{ fontSize: "10px" }}>
                            model: {equipment.model}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="text-xs truncate max-w-32" title={equipment.assetId}>
                    {equipment.assetId}
                </div>
            </TableCell>
            <TableCell style={{ fontSize: "12px" }}>{getStatusBadge(equipment.status)}</TableCell>
            <TableCell style={{ fontSize: "12px" }} title={equipment.location}>
                <Box sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{equipment.location}</Box>
            </TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.lastEvent ? format(equipment.lastEvent, "MMM d, yyyy") : "N/A"}</TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.nextEvent ? format(equipment.nextEvent, "MMM d, yyyy") : "N/A"}</TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.healthIndex ? getHealthBadge(equipment.healthIndex) : <div className="bg-gray-200 text-gray-600 rounded-full px-2 py-1 text-bold">-</div>}</TableCell>
            {userRole === "admin" && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                    {/* Dialog window for equipment record editing */}
                    <SlideDialog
                        title="Edit Equipment Unit"
                        Btn={(props) => (
                            <button {...props}><Edit size={20} className="text-blue-400 hover:text-blue-800 cursor-pointer" /></button>
                        )}
                        DialogForm={(props) => (
                            <AddEquipmentForm {...props} equipmentId={equipment.id} />
                        )}
                    />
                    {/* Dialog window for equipment record deletion */}
                    <SlideDialog
                        title="Delete Equipment Unit"
                        Btn={(props) => (
                            <button {...props}><Trash size={20} className="text-red-400 hover:text-red-800 cursor-pointer" /></button>
                        )}
                        DialogForm={(props) => (
                            <DeleteEquipmentForm {...props} equipmentId={equipment.id} equipmentName={equipment.name} />
                        )}
                    />
                    </div>
                </TableCell>
            )}
        </TableRow>
  )
}

export default EquipmentListEl;