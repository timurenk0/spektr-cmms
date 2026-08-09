import { TEquipment, TMaintenanceEvent } from '@/COMPONENTS/utils/types';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { format } from 'date-fns';
import Image from 'next/image';
import React from 'react'


const levelMap: Record<string, string> = {
    "A": "bg-green-500 text-white",
    "B": "bg-orange-500 text-white",
    "C": "bg-blue-500 text-white",
    "D": "bg-purple-500 text-white",
    "E": "police-tape",
    "I1": "bg-teal-500 text-white",
    "I2": "bg-teal-500 text-white",
    "O": "bg-violet-500 text-white",
}

const GeneralMaintenanceList = ({
    mEvents,
    equipments,
    complete
}: {
    mEvents: TMaintenanceEvent[],
    equipments: TEquipment[],
    complete?: boolean
}) => {

    
  return (
    <Table stickyHeader>
        <TableHead>
            <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", textAlign: "center" } }}>
                <TableCell>Equipment</TableCell>
                <TableCell>Scheduled At</TableCell>
                {complete && (
                    <TableCell>Completed Date</TableCell>
                )}
                <TableCell>Level</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {(mEvents.length > 0) ? mEvents.map(ev => {
            const eq = equipments.find(eq => eq.id === ev.equipmentId);
            return eq && (
            <TableRow key={ev.id} sx={{"& .MuiTableCell-root": { textAlign: "center" }}}>
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
                <TableCell>{format(ev.scheduledAt, "MMM dd, yyyy")}</TableCell>
                {complete && ev.performedAt && (
                    <TableCell>{format(ev.performedAt, "MMM dd, yyyy")}</TableCell>
                )}
                <TableCell>
                    <div className={`w-20 ${levelMap[ev.level]} text-center mx-auto py-2 rounded-[100px]`}>
                        {ev.level}
                    </div>
                </TableCell>
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

export default GeneralMaintenanceList;