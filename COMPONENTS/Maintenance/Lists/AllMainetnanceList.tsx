import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material"
import Image from "next/image";

const AllMaintenanceList = ({
  maintenances,
  info,
  equipments,
}: {
  maintenances: IMaintenance[],
  info: {
    total: number,
    upcoming: number,
    overdue: number,
    complete: number,
    incomplete: number
  },
  equipments: IEquipment[],
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
        </TableRow>
      </TableHead>
      <TableBody>
        {(maintenances && maintenances.length > 0) ? maintenances.map(m => {
          const eq = equipments.find(eq => eq.id === m.equipmentId);
          return eq && (
          <TableRow key={m.id} sx={{"& .MuiTableCell-root": { textAlign: "center" }}}>
            <TableCell>
              <div className="flex items-center">
                <div className="h-[128px] w-[128px] flex items-center">
                  <Image src={eq.equipmentImage} className="max-h-full m-auto" alt="eq_image" width={128} height={128} />
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
            <TableCell>{info.total}</TableCell>
            <TableCell>{info.upcoming}</TableCell>
            <TableCell>{info.complete}</TableCell>
            <TableCell>{info.overdue}</TableCell>
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