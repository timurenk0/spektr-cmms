"use client"

import { Button, Skeleton } from "@mui/material";
import { Plus, User } from "lucide-react";
import SlideDialog from "@/COMPONENTS/ui/SlideDialog";
import AddEquipmentForm from "@/COMPONENTS/Equipment/AddEquipmentForm";
import { useAuth } from "../utils/authContext";


export default function AddEquipmentButton() {

    const { user, isLoading } = useAuth();

    if (!user || isLoading) return (
        <>
            Loading User<span className="dots"></span>
        </>
    )
    
    return (
        <>
        {user.role === "admin" && (
            <SlideDialog 
                title="Add New Equipment Unit"
                Btn={(props) => (
                    <Button {...props} variant="contained">
                        <Plus className="w-4 h-4 mr-1 mb-0.5" /> Add Equipment
                    </Button>
                )}
                DialogForm={(props) => (
                    <AddEquipmentForm {...props} />
                )} 
            />
        )}
        </>
    )
}

