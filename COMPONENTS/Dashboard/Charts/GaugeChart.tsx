import { Tooltip } from "@mui/material";
import { CircleQuestionMark } from "lucide-react";


interface TooltipsProps {
    msc: string,
    pmp: string,
    tcm: string,
    ehi: string,
}

const TOOLTIPS: TooltipsProps = {
    "msc": "Number of completed events over the total number of events",
    "pmp": "Number of completed planned events over the total number of completed events",
    "tcm": "Number of events completed on time over the number of completed events",
    "ehi": "Average health index of all assets"
}

interface GaugeChartProps {
    value: number,
    title: string,
    subtitle: string,
    colorClass: string,
    statClass: string
}

const GaugeChart = ({
    value,
    title,
    subtitle,
    colorClass,
    statClass
} : GaugeChartProps) => {

    const circumference = 251.3;
    const strokeDashOffset = circumference - (circumference * value) / 100;

    const getGaugeColor = () => {
        switch (statClass) {
            case "msc":
                if (value >= 90) return "oklch(62.7% 0.194 149.214)";
                if (value < 90 && value >= 70) return "oklch(85.2% 0.199 91.936)";
                if (value < 70 && value >= 50) return "oklch(76.9% 0.188 70.08)";
                if (value < 50) return "#FF0000";
                break;
            case "pmp":
                if (value >= 85) return "oklch(62.7% 0.194 149.214)";
                if (value < 85 && value >= 60) return "oklch(85.2% 0.199 91.936)";
                if (value < 60 && value >= 30) return "oklch(76.9% 0.188 70.08)";
                if (value < 30) return "#FF0000";
                break;
            case "tcm":
                if (value >= 90) return "oklch(62.7% 0.194 149.214)";
                if (value < 90 && value >= 70) return "oklch(85.2% 0.199 91.936)";
                if (value < 70 && value >=50) return "oklch(76.9% 0.188 70.08)";
                if (value < 50) return "#FF0000";
                break;
            case "ehi":
                if (value >= 75) return "oklch(62.7% 0.194 149.214)";
                if (value < 75 && value >= 50) return "oklch(85.2% 0.199 91.936)";
                if (value < 50 && value >= 30) return "oklch(76.9% 0.188 70.08)";
                if (value < 30) return "#FF0000";
                break;
        }
    };

    const gradientId = `gauge-gradient-${colorClass}`;
    
  return (    
    <div className="bg-white p-4 rounded-lg shadow-sm relative">
        <div className="group absolute top-2 right-2">
            <Tooltip title={TOOLTIPS[statClass as keyof TooltipsProps] ?? "No tooltip available"} arrow>
                <div className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <CircleQuestionMark size={16} />
                </div>
            </Tooltip>
        </div>

        <div className="flex flex-col items-center">
            <div className="mt-2">
                <h3 className="text-lg font-medium text-gray-800 h-16">{title}</h3>
                <div className="flex w-full justify-center">
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>

            <div className="relative mt-3 flex justify-center">
                <svg width="200" height="120" viewBox="0 0 200 120">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={getGaugeColor()} />
                            <stop offset="100%" stopColor={`${getGaugeColor()}`} />
                        </linearGradient>
                    </defs>

                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#EEEEEE"
                        strokeWidth="22"
                        strokeLinecap="round"
                    />

                    {/* Foreground track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth="22"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashOffset}
                        transform="rotate(0, 100, 100)"
                    />
                </svg>

                {/* Percentage text */}
                <div className="absolute bottom-0 text-3xl font-bold text-gray-700">
                    {value.toFixed(2)}%
                </div>
            </div>
        </div>
    </div>
  )
}

export default GaugeChart;