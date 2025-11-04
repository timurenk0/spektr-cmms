import StatCard from "./StatCard/StatCard"
import SliderStatCard from "./StatCard/SliderStatCard"

const StatCards = () => {    
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <StatCard variant="total" value1={12} value2={22} />

        <StatCard variant="overdue" value1={10} value2={88} />

        <SliderStatCard variant="complete" slides={[{title: "asd", totalTasksCount: 12, uniqueEquipmentCount: 11}]} />

        <SliderStatCard variant="upcoming" slides={[{title: "asd", totalTasksCount: 12, uniqueEquipmentCount: 11}]} />

        <StatCard variant="emergency" value1={1} value2={100} />


    </div>
  )
}

export default StatCards