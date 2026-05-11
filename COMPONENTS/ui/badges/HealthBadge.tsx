import { Activity } from "lucide-react"

export const HealthBadgeFull = ({ background, color, value }: { background: string, color: string, value: string }) => {
    return (
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: background, color: color }}>
                <Activity className="h-5 w-5" />
            </div>
            <div>
                <div className="text-sm font-bold" style={{ color: color }}>
                    { value }{ value === "-" ? "" : "%" }
                </div>
                <div className="text-xs text-gray-500">
                    Health Score
                </div>
            </div>
        </div>
    )
};

export const HealthBadge = ({ background, color, value }: { background: string, color: string, value: string }) => {
    return (
        <div className="font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${background}`, color: `${color}` }}>
            { value }{ value === "-" ? "" : "%" }
        </div>
    )
}