"use client"

import { Button, TextField } from "@mui/material"
import { useState } from "react"

const AddRoleForm = ({ addNewRole, who, onClose }: { addNewRole: (role: string)=>void, who: string, onClose: ()=>void }) => {
    const [role, setRole] = useState<string>("");

    return (
        <div>
            <TextField
                color="info"
                label={`New ${who}`}
                fullWidth
                margin="dense"
                defaultValue={""}
                onChange={(e) => setRole(e.target.value)}
                required
            />
            <div className="flex justify-end gap-2">
                <Button onClick={onClose} variant="text" color="inherit">Go back</Button>
                <Button type="submit" onClick={()=>{addNewRole(role); onClose()}} color="primary">Add</Button>
            </div>
        </div>
    )
};

export default AddRoleForm;