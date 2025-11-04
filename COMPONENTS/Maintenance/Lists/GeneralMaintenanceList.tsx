import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Image from 'next/image';
import React from 'react'


const getLevelBadge = (level: string) => {        
    switch (level) {
        case "A":
            return (
                <div className="w-20 bg-green-500 text-white text-center mx-auto py-2 rounded-[100px]">
                    {level}
                </div>
            );
        case "B":
            return (
                <div className="w-20 bg-orange-500 text-white text-center mx-auto py-2 rounded-[100px]">
                    {level}
                </div>
            );
        case "C":
            return (
                <div className="w-20 bg-blue-500 text-white text-center mx-auto py-2 rounded-[100px]">
                    {level}
                </div>
            );
        case "D":
            return (
                <div className="w-20 bg-purple-500 text-white text-center mx-auto py-2 rounded-[100px]">
                    {level}
                </div>
            );
    }
}

const GeneralMaintenanceList = ({
    mEvents,
    equipments,
    complete
}: {
    mEvents: IMaintenanceEvent[],
    equipments: IEquipment[],
    complete?: boolean
}) => {

    
  return (
    <Table stickyHeader>
        <TableHead>
            <TableRow sx={{ "& .MuiTableCell-root": { fontWeight: "bold", textAlign: "center" } }}>
                <TableCell>Equipment</TableCell>
                <TableCell>Due Date</TableCell>
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
                <TableCell>{ev.start}</TableCell>
                {complete && (
                    <TableCell>Completed Date</TableCell>
                )}
                <TableCell>{getLevelBadge(ev.level)}</TableCell>
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