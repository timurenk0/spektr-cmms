import GaugeCharts from "@/COMPONENTS/Dashboard/GaugeCharts"
import RecentActivities from "@/COMPONENTS/Dashboard/RecentActivities"
import StatCards from "@/COMPONENTS/Dashboard/StatCards"
import StatusChart from "@/COMPONENTS/Dashboard/Charts/StatusChart"
import TypeChart from "@/COMPONENTS/Dashboard/Charts/TypeChart"
import { Paper } from "@mui/material"


const Dashboard = () => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Maintenance Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Overview of your maintenance operations
          </p>
        </div>
      </div>

      <StatCards />

      <GaugeCharts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatusChart />
        <TypeChart />
      </div>

      <Paper>
        <RecentActivities />
      </Paper>
    </>
  )
}

export default Dashboard