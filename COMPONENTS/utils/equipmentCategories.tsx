import { Building2, Cog, FlaskConical, Thermometer, Trash2, Truck, Wrench, Zap } from "lucide-react";

export const EquipmentCategories = [
    {
        id: "Mechanical",
        icon: <Wrench className="min-h-4 min-w-4" />,
        types: [
            "Pumps / Blowers / Fans",
            "Engines",
            "Compressors",
            "Gearboxes / Reducers",
            "Pressure Units",
            "Valves",
            "Hydraulic Systems",
            "Pneumatic Systems",
        ],
    },
    {
        id: "Electrical",
        icon: <Zap className="min-h-4 min-w-4" />,
        types: [
            "Transformers",
            "Generators",
            "Switchgear",
            "Circuit Breakers",
            "UPS Systems",
            "Power Panels / Distribution Boards",
            "Electrical Motors",
            "VFDs (Variable Frequency Drives)",
            "Lighting Systems",
        ],
    },
    {
        id: "HVAC",
        icon: <Thermometer className="min-h-4 min-w-4" />,
        types: [
            "Chillers",
            "Boilers",
            "Air Handling Units (AHUs)",
            "Cooling Towers",
            "Water Heaters",
            "Dehumidifiers",
            "Air Compressors",
        ]
    },
    {
        id: "Production",
        icon: <Cog className="min-h-4 min-w-4" />,
        types: [
            "Machines",
            "Heat Exchangers",
            "Tanks",
            "Mixers / Agitators",
            "Furnaces / Ovens",
            "Turbines",
            "Filtration / Settler Units",
        ],
    },
    // {
        // id: "Test",
        // icon: <FlaskConical className="min-h-4 min-w-4" />,
        // types: [
        //     "Flow Meters",
        //     "Gauges",
        //     "Detectors",
        //     "Test Benches",
        //     "Testers",
        // ],
    // },
    {
        id: "Material Handling",
        icon: <Truck className="min-h-4 min-w-4" />,
        types: [
            "Forklifts / Pallet Trucks",
            "Tractors / Heavy Vehicles",
            "Cranes / Hoists",
            "Elevators / Conveyors",
            "Rigging Equipment",
            "Racking Systems",
            "Containers"
        ],
    },
    {
        id: "Facility",
        icon: <Building2 className="min-h-4 min-w-4" />,
        types: [
            "Fire Protection Systems",
            "Elevators / Escalators",
            "Security Systems",
            "Plumbing Systems",
            "Doors / Gates (Motorized)",
            "Lighting",
        ],
    },
    {
        id: "Cleaning",
        icon: <Trash2 className="min-h-4 min-w-4" />,
        types: [
            "Industrial Vacuums",
            "Scrubbers / Sweepers",
            "Waste Compactors",
            "Incinerators",
            "Water Treatment Systems",
        ],
  },
]