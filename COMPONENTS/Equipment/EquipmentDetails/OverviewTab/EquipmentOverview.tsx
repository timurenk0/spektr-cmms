import { TEquipment } from '@/COMPONENTS/utils/types';
import { Paper } from '@mui/material'
import { format } from 'date-fns';
import React from 'react'

const EquipmentOverview = ({ equipment }: { equipment: TEquipment }) => {
  return (
    <>
        <div className="grid grid-cols-3 gap-6">
            {/* Row 1 */}
            <div>
                <div className="text-sm text-gray-500">Name</div>
                <div>{equipment.name}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">ID</div>
                <div>{equipment.assetId}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Date of Manufacture</div>
                <div>{format(equipment.dateOfManufacturing, "MMM dd, yyyy")}</div>
            </div>

            {/* Row 2 */}
            <div>
                <div className="text-sm text-gray-500">Manufacturer</div>
                <div>{equipment.manufacturer}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Location</div>
                <div>{equipment.location}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Date Put in Service</div>
                <div>{format(equipment.inServiceDate, "MMM dd, yyyy")}</div>
            </div>

            {/* Row 3 */}
            <div>
                <div className="text-sm text-gray-500">Model</div>
                <div>{equipment.model}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>{equipment.status}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Uploaded At</div>
                <div>{format(equipment.uploadedAt, "MMM dd, yyyy | hh:mm:ss")}</div>
            </div>
        </div>

        {equipment.notes && (
            <>
                <hr className="my-4 text-gray-300" />
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <div className="text-sm">{equipment.notes}</div>
            </>
        )}
    </>
  )
}

export default EquipmentOverview;