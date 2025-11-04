import { AlertTriangle, Clock, Wrench } from "lucide-react"


interface variationProps { 
    "total": {
        border: string,
        bg: string,
        icon: React.ReactNode,
        header1: string,
        header2: string
    },
    "overdue": {
        border: string,
        bg: string,
        icon: React.ReactNode,
        header1: string,
        header2: string
    },
    "emergency": {
        border: string,
        bg: string,
        icon: React.ReactNode,
        header1: string,
        header2: string
    },
}

const VARIATIONS = {
    total: {
        border: "border-indigo-400",
        bg: "bg-blue-100",
        icon: <Wrench className="text-indigo-400 w-6 h-6" />,
        header1: "Total Equipment",
        header2: "Total Maintenance Tasks"
    },
    overdue: {
        border: "border-red-500",
        bg: "bg-red-100",
        icon: <Clock className="text-red-500 w-6 h-6" />,
        header1: "Equipment With Overdue Maintenance",
        header2: "Overdue Maintenance Tasks",
    },
    emergency: {
        border: "border-purple-500",
        bg: "bg-purple-100",
        icon: <AlertTriangle className="text-purple-500 w-6 h-6" />,
        header1: "Ongoing Emergency Repairs",
        header2: "Completed Emergency Repairs"
    }
}

interface StatCardProps {
    variant: string,
    value1: number,
    value2: number
}

const StatCard = ({variant, value1, value2}: StatCardProps) => {
    const style = VARIATIONS[variant as keyof variationProps];
    
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${style.border}`}>
        <div className="flex justify-between">

            <div>
                <p className="text-sm font-medium text-gray-500">
                    {style.header1}
                </p>
                <h3 className="text-2xl font-semibold mt-1">
                    {value1}
                </h3>
            </div>

            <div className={`w-12 h-12 ${style.bg} rounded-full flex items-center justify-center`}>
                {style.icon}
            </div>
        </div>

        <div className="mt-6">
            <p className="text-sm font-medium text-gray-500">
                {style.header2}
            </p>
            <h3 className="text-2xl font-semibold mt-1">
                {value2}
            </h3>
        </div>
    </div>
  )
}

export default StatCard