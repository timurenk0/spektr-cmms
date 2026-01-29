import { TableCell, TableRow } from "@mui/material";
import { Edit, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AddEquipmentForm from "./AddEquipmentForm";
import SlideDialog from "../ui/SlideDialog";
import DeleteEquipmentForm from "./DeleteEquipmentForm";
import { TEquipment } from "../utils/types";


const getStatusBadge = (status: string) => {
    switch (status) {
        case "operational":
            return (
                <div className="bg-green-200 rounded-full border border-green-800 text-green-800 px-2 py-1 whitespace-nowrap">
                    Operational
                </div>
            );
        case "under repair":
            return (
                <div className="bg-amber-200 rounded-full border border-amber-800 text-amber-800 px-2 py-1 whitespace-nowrap">
                    Under Repair
                </div>
            );
        case "out of service":
            return (
                <div className="bg-gray-200 rounded-full border border-gray-800 text-gray-800 px-2 py-1 whitespace-nowrap">
                    Out of Service
                </div>
            );
        default:
            return (
                <div className="bg-red-200 rounded-full border border-red-800 text-red-800 px-2 py-1 whitespace-nowrap">
                    Invalid Status
                </div>
            );
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
                        <Image className="max-w-28" src={equipment.equipmentImage} width={112} height={112} alt="Equipment image" />
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
            <TableCell style={{ fontSize: "12px" }}>{equipment.location}</TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.lastEvent}</TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.nextEvent}</TableCell>
            <TableCell style={{ fontSize: "12px" }}>{equipment.healthIndex ?? "-"}%</TableCell>
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

export default EquipmentListEl