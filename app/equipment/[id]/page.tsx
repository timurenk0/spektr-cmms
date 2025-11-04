import EquipmentDetails from "@/COMPONENTS/Equipment/EquipmentDetails/EquipmentDetails";

const EquipmentDetailsPage = async ({ params }: { params: Promise<{id: string}> }) => {
  const { id } = await params;
  
  return (
    <EquipmentDetails equipmentId={parseInt(id)} />
  )
}

export default EquipmentDetailsPage