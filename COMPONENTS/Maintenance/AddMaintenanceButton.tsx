"use client"

import { Button } from "@mui/material";
import SlideDialog from "../ui/SlideDialog";
import { Plus } from "lucide-react";
import AddMaintenanceForm from "./AddMaintenanceForm";


const AddMaintenanceButton = () => {

  return (
    <>
    {2 + 3 == 5 && (
        <SlideDialog
            title="Add New Maintenance"
            Btn={(props) => (
                <Button {...props}>
                    <Plus className="w-4 h-4 mr-1 mb-0.5" /> Add Maintenance
                </Button>
            )}
            DialogForm={(props) => (
                <AddMaintenanceForm {...props} />
            )}
        />
    )}
    </>
  )
}

export default AddMaintenanceButton;