import { TableCell, TableRow } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";


const getStatusBadge = (status: string) => {
    switch (status) {
        case "operational":
            return (
                <div className="bg-green-600 text-white text-center py-3 rounded-[100px]">
                    Operational
                </div>
            );
        case "under repair":
            return (
                <div className="bg-amber-500 text-white text-center py-2 rounded-[100px]">
                    Under Repair
                </div>
            );
        case "out of service":
            return (
                <div className="bg-gray-500 text-white text-center py-2 rounded-[100px]">
                    Out of Service
                </div>
            );
    }
}

const EquipmentListEl = ({ equipment }: { equipment: IEquipment }) => {
    const router = useRouter();
    
  return (
    <TableRow sx={{ "& .MuiTableCell-root": { textAlign: "center", cursor: "pointer", padding: "0 32px" } }} hover onClick={() => router.push(`/equipment/${equipment.id}`)}>
        {/* Equipment image and name */}
        <TableCell>
            <div className="flex items-center">
                <div className="h-[128px] w-[128px] overflow-hidden flex items-center">
                    {/* add max-h-[128px] to image if you want the image to resize */}
                    <Image className="max-w-[128px]" src={equipment.equipmentImage} width={128} height={128} alt="Equipment image" />
                </div>
                <div className="ml-2 flex-1 text-left">
                    <div className="text-sm font-medium truncate" title={equipment.name}>
                        {equipment.name}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                        model: {equipment.model}
                    </div>
                </div>
            </div>
        </TableCell>
        <TableCell>{equipment.assetId}</TableCell>
        <TableCell>{getStatusBadge(equipment.status)}</TableCell>
        <TableCell>{equipment.location}</TableCell>
        <TableCell>{"sosal"}</TableCell>
        <TableCell>{"sosal"}</TableCell>
        <TableCell>{equipment.healthIndex ?? "-"}</TableCell>
    </TableRow>
  )
}

export default EquipmentListEl