import EquipmentList from "@/COMPONENTS/Equipment/EquipmentList"
import AddEquipmentButton from "../../COMPONENTS/Equipment/AddEquipmentButton"


const Equipment = () => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Tool Pool
          </h1>
          <p className="text-sm text-gray-600">
            Manage your equipment, maintenance schedules, testing and calibrations
          </p>
        </div>

          <div className="mt-4 md:mt-0">
            <AddEquipmentButton />
          </div>
      </div>

      <EquipmentList />
    </>
  )
}

export default Equipment