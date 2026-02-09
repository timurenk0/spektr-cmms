import { Activity } from "lucide-react"

export const HealthBadgeFull = ({ color, value }: { color: string, value: string }) => {
    return (
        <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full bg-${color}-200 text-${color}-600 flex items-center justify-center mr-3`}>
                <Activity className="h-5 w-5" />
            </div>
            <div>
                <div className={`text-sm font-bold text-${color}-600`}>
                    { value }{ value === "-" ? "" : "%" }
                </div>
                <div className="text-xs text-gray-500">
                    Health Score
                </div>
            </div>
        </div>
    )
};

export const HealthBadge = ({ color, value }: { color: string, value: string }) => {
    return (
        <div className={`bg-${color}-200 text-${color}-600 font-bold px-2 py-1 rounded-full`}>
            { value }{ value === "-" ? "" : "%" }
        </div>
    )
}