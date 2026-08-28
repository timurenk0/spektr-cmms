import { TEquipment } from "@/COMPONENTS/utils/types"
import { TextField } from "@mui/material"
import React from "react"
import { Controller, UseFormReturn } from "react-hook-form"

const LevelCard = ({
    level,
    form
}: {
    level: "A" | "B" | "C" | "D" | "I1" | "I2" | "I3" | "I4" | "I5",
    form: UseFormReturn<any>
}) => {
    const colors: Record<string, string> = {
        "A": "bg-green-50",
        "B": "bg-amber-50",
        "C": "bg-blue-50",
        "D": "bg-purple-50",
        "I": "bg-pink-50",
    }
    
  return (
    <div className={`border p-4 rounded-md col-span-2 ${colors[level[0]]}`}>
        <div className="font-medium text-lg mb-3">{level[0] === "I" ? `Certification ${level[1]}` : `Level ${level} Maintenance`}
            <div className={`grid grid-cols-3 gap-2`}>
                <Controller
                    name={`level${level}Months`}
                    control={form.control}
                    defaultValue={0}
                    render={({ field }) => (
                        <TextField
                            type="number"
                            label="Interval in Months"
                            color="info"
                            margin="dense"
                            slotProps={{ htmlInput: { min: 0 } }}
                            fullWidth
                            required
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            helperText={level[0] === "I" ? "Interval between certification tasks in months (if present)" : "Interval between maintenance tasks in months (if present)"}
                        />
                    )}
                />
                { level[0] !== "I" && (
                    <Controller
                        name={`level${level}Hours`}
                        control={form.control}
                        defaultValue={0}
                        render={({ field }) => (
                            <TextField
                                type="number"
                                label="Interval in Hours"
                                color="info"
                                margin="dense"
                                slotProps={{ htmlInput: { min: 0 } }}
                                fullWidth
                                required
                                {...field}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value) || 0)}
                                helperText="Interval between maintenance tasks in hours (if present)"
                            />
                        )}
                    />
                ) }
                <Controller
                    name={`level${level}Duration`}
                    control={form.control}
                    defaultValue={0}
                    render={({ field }) => (
                        <TextField
                            type="number"
                            label="Duration in days"
                            color="info"
                            margin="dense"
                            slotProps={{ htmlInput: { min: 0 } }}
                            fullWidth
                            required
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
                            helperText={level[0] === "I" ? "Expected certification task duration in days" : "Expected maintenance task duration in days"}
                        />
                    )}
                />
                { level[0] === "I" && (
                    <TextField
                        label="Short Description"
                        color="info"
                        margin="dense"
                        fullWidth
                        {...form.register(`level${level}Description`)}
                    />

                ) }
            </div>
        </div>
    </div>
  )
}

export default LevelCard