"use client"

import { Button } from "@mui/material";
import { CalendarCheck, CheckCircle } from "lucide-react";
import { useState } from "react"


interface variationProps {
    "complete": {
        status: string,
        border: string,
        bg: string,
        text: string,
        icon: React.ReactNode,
    },
    "upcoming": {
        status: string,
        border: string,
        bg: string,
        text: string,
        icon: React.ReactNode,
    },
}

const VARIATIONS = {
    complete: {
        status: "Complete",
        border: "border-emerald-500",
        bg: "bg-emerald-100",
        text: "text-emerald-500",
        icon: <CheckCircle className="text-emerald-500 h-6 w-6" />
    },
    upcoming: {
        status: "Upcoming",
        border: "border-amber-500",
        bg: "bg-amber-100",
        text: "text-amber-100",
        icon: <CalendarCheck className="text-amber-500 h-6 w-6" />
    }
}

interface SliderStatCardProps {
    variant: string,
    slides: {
        title: string,
        uniqueEquipmentCount: number,
        totalTasksCount: number,
    }[],
}

const SliderStatCard = ({ variant, slides }: SliderStatCardProps) => {
    const style = VARIATIONS[variant as keyof variationProps];
    
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        setCurrentSlide((prev) => Math.min(prev+1, slides.length -1 ));
    }

    const handlePrev = () => {
        setCurrentSlide((next) => Math.max(next-1, 0));
    }
    
  return (
    <div className="relative w-full h-full">
        <div className="overflow-hidden">
            <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentSlide*100}%)` }}>

                {slides.map((slide: {title: string, uniqueEquipmentCount: number, totalTasksCount: number}, idx: number) => (
                    <div key={idx} className="min-w-full min-h-full">
                        <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${style.border}`}>
                            <div className="flex justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Equipment {style.status} {" "} {slide.title}
                                    </p>
                                    <h3 className="text-2xl font-semibold mt-1">
                                        {slide.uniqueEquipmentCount}
                                    </h3>
                                </div>

                                <div className={`w-12 h-12 ${style.bg} rounded-full flex items-center justify-center`}>
                                    {style.icon}
                                </div>

                            </div>
                            <div className="mt-6">
                                <p className="text-sm font-medium text-gray-500">
                                    Maintenance Tasks {style.status} {" "} {slide.title}
                                </p>
                                <h3 className="text-2xl font-semibold mt-1">
                                    {slide.totalTasksCount}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </div>

        <div className={`flex justify-between mt-4 border-0 border-l-4 rounded-lg ${style.border} bg-white`}>
            <Button 
                onClick={handlePrev} 
                disabled={currentSlide === 0} 
                className="disabled:opacity-50"
            >
                Previous
            </Button>
            <Button 
                onClick={handleNext} 
                disabled={currentSlide === slides.length - 1} 
                className="disabled:opacity-50"
            >
                Next
            </Button>
        </div>
    </div>
  )
}

export default SliderStatCard;