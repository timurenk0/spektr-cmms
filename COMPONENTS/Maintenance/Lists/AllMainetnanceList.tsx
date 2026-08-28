import SlideDialog from "@/COMPONENTS/ui/SlideDialog";
import { TEquipment, TMaintenance } from "@/COMPONENTS/utils/types";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material"
import { Edit, Inspect, Trash } from "lucide-react";
import Image from "next/image";
import { DeleteMaintenanceForm } from "../DeleteMaintenanceForm";
import AddMaintenanceForm from "../AddMaintenanceForm";

const AllMaintenanceList = ({
  userRole,
  maintenances,
  equipments,
}: {
  userRole: string,
  maintenances: (TMaintenance & { totalCount: number, completeCount: number, overdueCount: number, pendingCount: number })[],
  equipments: TEquipment[],
}) => {


  return (
    <Table stickyHeader>
      <TableHead>
        <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", textAlign: "center" } }}>
          <TableCell>Equipment</TableCell>
          <TableCell>All</TableCell>
          <TableCell>Upcoming</TableCell>
          <TableCell>Complete</TableCell>
          <TableCell>Overdue</TableCell>
          { userRole === "admin" && (
            <TableCell>Admin</TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {(maintenances && maintenances.length > 0) ? maintenances.map(m => {
          const eq = equipments.find(eq => eq.id === m.equipmentId);
          return eq && (
          <TableRow key={m.id} sx={{"& .MuiTableCell-root": { textAlign: "center" }}}>
            <TableCell>
              <div className="flex items-center">
                <div className="h-32 w-32 flex items-center">
                  <Image src={eq.equipmentImage} loading="lazy" unoptimized className="max-h-full m-auto" alt="eq_image" width={128} height={128} />
                </div>
                <div className="ml-2 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {eq.name || "Unknown Equipment"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {eq.assetId}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>{m.totalCount}</TableCell>
            <TableCell>{m.pendingCount}</TableCell>
            <TableCell>{m.completeCount}</TableCell>
            <TableCell>{m.overdueCount}</TableCell>
            { userRole === "admin" && (
              <TableCell>
                <div className="flex justify-center gap-2">
                  <SlideDialog
                    title="View Maintenance Schedule"
                    Btn={(props) => (
                      <button {...props}><Inspect size={20} className="text-blue-400 hover:text-blue-800 cursor-pointer" /></button>
                    )}
                    DialogForm={(props) => (
                      <AddMaintenanceForm {...props} maintenanceId={m.id} />
                    )}
                  />
                  <SlideDialog
                    title="Delete Maintenance Record"
                    Btn={(props) => (
                      <button {...props}><Trash size={20} className="text-red-400 hover:text-red-800 cursor-pointer" /></button>
                    )}
                    DialogForm={(props) => (
                      <DeleteMaintenanceForm {...props} maintenanceId={m.id} />
                    )}
                  />
                </div>
              </TableCell>
            ) }
          </TableRow>
        )}): (
          <TableRow>
            <TableCell colSpan={6}>No maintenance records found. Create a new one to start tracking your equipment</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default AllMaintenanceList;