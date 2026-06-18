"use client"
export const dynamic = "force-dynamic";


import SlideDialog from "@/COMPONENTS/ui/SlideDialog"
import { TTenant } from "@/COMPONENTS/utils/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, Tab, TextField } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"
import z from "zod"
import AddRoleForm from "./forms/AddRoleForm"
import { useAuth } from "@/COMPONENTS/utils/authContext"
import { insertUserSchema } from "@/BACKEND/Database/schema";


const formSchema = insertUserSchema.omit({
    tenantId: true
}).extend({
    tenant: z.string().min(1, { error: "Tenant field cannot be empty" }).max(255, { error: "Tenant name can be 255 characters long max" }) 
});
type ProfileFormValues = z.infer<typeof formSchema>;


const generatePassword = (setter: (x: "username" | "password" | "role" | "tenant", y: string) => void, length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  setter("password", password);  
}

const Settings = () => {
    const queryClient = useQueryClient();

    const { user, isLoading } = useAuth();

    
    const [value, setValue] = useState("personal");
    const [role, setRole] = useState("user");
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [availableTenants, setAvailableTenants] = useState<string[]>([]);
    
    const handleValueChange = (event: React.SyntheticEvent, val: string) => {
        setValue(val)
    }

    
    const { data: userRoles, isLoading: isLoadingUserRoles } = useQuery<string[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await fetch("/api/users/roles", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                toast.error("Failed to get user roles");
                throw new Error("Failed to fetch user roles");
            }
            const data = await res.json();
            console.log(data);
            setAvailableRoles(data)

            return data;
        }
    });
    
    const { data: tenants, isLoading: isLoadingTenants } = useQuery<TTenant[]>({
        queryKey: ["tenants"],
        queryFn: async () => {
            const res = await fetch("/api/tenants", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                toast.error("Failed to get tenants");
                throw new Error("Failed to fetch tenants");
            }

            const data = await res.json();
            console.log(data.map((t: TTenant) => t.name));
            setAvailableTenants(data.map((t: TTenant) => t.name));

            return data;
        }
    });

    // useEffect(()=>{
    //     if (userRoles.length > 0) {
    //         setAvailableRoles(userRoles);
    //     }
    //     if (tenants.length > 0) {
    //         setAvailableTenants(tenants.map(t=>t.name));
    //     }
    // }, [userRoles, tenants]);
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
            role: "",
            tenant: "",
            firstName: "",
            lastName: ""
        }
    });
    
    const mutation = useMutation({
        mutationFn: async (values: ProfileFormValues) => {
            if (values.role?.toLowerCase() === "admin") {
                throw new Error("You think you're the smarted huh?")
            };

            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
                credentials: "include"
            });
            
            const data = await response.json().catch(() => null);
            
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
            
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
            toast.success("User added successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
        },
        onError: (error) => {
            console.error(error);
            toast.error(`Failed to add user: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            })
        }
    });
    
    const onSubmit = (values: ProfileFormValues) => {
        mutation.mutate(values);
    };

    const loading = (!userRoles || isLoadingUserRoles) || (!tenants || isLoadingTenants) || (!user || isLoading);
    if (loading) return (<h1>Loading data...</h1>);
    
    const addRole = (role: string) => {
        const normalizedRole = role.trim().toLowerCase();
        if (!normalizedRole) return;
        
        if (availableRoles.includes(normalizedRole)) {
            toast.error("This user role already exists!", {
                duration: 2000,
                position: "bottom-right",
                icon: "❕"
            });
        } else {
            setAvailableRoles((prev) => [...prev, normalizedRole]);
            form.setValue("role", normalizedRole);
            toast.success("User role added successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
        }
    }
    
    const addTenant = (name: string) => {
        const normalizedTenant = name.trim().toLowerCase();
        if (!normalizedTenant) return;
        
        if (availableTenants.includes(normalizedTenant)) {
            toast.error("This owner company already exists!", {
                duration: 2000,
                position: "bottom-right",
                icon: "❕"
            });
        } else {
            setAvailableTenants((prev) => [...prev, normalizedTenant]);
            form.setValue("tenant", normalizedTenant);
            toast.success("Owner company name added successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
        }
    }
    

    
    return (
        <>
        <div className="mb-6">
            <h1 className="text-xl font-semibld">Settings</h1>
            <p className="text-sm text-gray-600">Manage system preferences</p>
        </div>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TabContext value={value}>
                <TabList onChange={handleValueChange}>
                    <Tab label="Personal Info" value="personal" />
                    { user && user.role === "admin" && (
                        <Tab label="Add User" value="add user" />
                    )}
                </TabList>
                <TabPanel value="personal">
                    <div className="grid grid-cols-2">
                        <div>
                            <p>First name: {user.firstName}</p>
                            <p>Last name: {user.lastName}</p>
                            <p>Position: Web Developer</p>
                        </div>
                    </div>
                </TabPanel>
                { user && user.role === "admin" && (
                <TabPanel value="add user">
                    <form onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}>
                        <div className="grid grid-cols-3 gap-4 pb-10">
                            <TextField
                                label="First Name"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 },
                                    inputLabel: { shrink: true }
                                }}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    e.preventDefault();
                                    setFName(e.target.value.trim());
                                    form.setValue("firstName", e.target.value.trim());
                                }}
                                required
                            />
                            <TextField
                                label="Last Name"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 },
                                    inputLabel: { shrink: true }
                                }}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    e.preventDefault();
                                    setLName(e.target.value.trim());
                                    form.setValue("lastName", e.target.value.trim());
                                }}
                                required
                            />
                            <TextField
                                label="Username"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 },
                                    inputLabel: { shrink: true }
                                }}
                                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                                    e.preventDefault();
                                    if (!e.target.value && fName && lName) {
                                        form.setValue("username", `${fName} ${lName}`)
                                    }
                                    // form.setValue("username", e.target.value.trim())
                                }}
                                required
                                {...form.register("username")}
                            />
                            <div className="flex flex-col">
                                <TextField
                                    type={showPw ? "text" : "password"}
                                    onFocus={() => setShowPw(true)}
                                    label="Password"
                                    color="info"
                                    margin="dense"
                                    slotProps={{
                                        htmlInput: { maxLength: 255 },
                                        inputLabel: { shrink: true }
                                    }}
                                    required
                                    {...form.register("password")}
                                    onBlur={() => setShowPw(false)}
                                />
                                <button type="button" className="underline text-blue-500 text-sm me-auto cursor-pointer" onClick={() => (generatePassword(form.setValue))}>Generate Password</button>
                            </div>
                            
                            <div>
                                <Controller
                                    name="role"
                                    control={form.control}
                                    defaultValue="user"
                                    render={({ field }) => (
                                        <FormControl fullWidth margin="dense">
                                            <InputLabel id="select-role" color="info" required>Select Role</InputLabel>
                                            <Select labelId="select-role" label="Select Role" {...field} color="info" required>
                                                {availableRoles.map((role, idx)=>(
                                                    <MenuItem key={idx} value={role}>{role}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                                <SlideDialog
                                    title="Add new role"
                                    Btn={(props) => (
                                        <Button color="info" {...props}><Plus size={16} />
                                            <div className="text-xs">
                                                Add new role
                                            </div>
                                        </Button>
                                    )}
                                    DialogForm={(props) => (
                                        <AddRoleForm {...props} addNewRole={addRole} who="role" />
                                    )}
                                />
                            </div>

                            <div>
                                <Controller
                                    name="tenant"
                                    control={form.control}
                                    defaultValue={undefined}
                                    render={({ field }) => (
                                        <FormControl fullWidth margin="dense">
                                            <InputLabel id="select-tenant" color="info" required>Select Company</InputLabel>
                                            <Select labelId="select-tenant" label="Select Company" {...field} color="info" required>
                                                {availableTenants.map((tenant, idx) => (
                                                    <MenuItem key={idx} value={tenant}>{tenant}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                                <SlideDialog
                                    title="Add owner company"
                                    Btn={(props) => (
                                        <Button color="info" {...props}><Plus size={16} />
                                            <div className="text-xs">
                                                Add new owner company
                                            </div>
                                        </Button>
                                    )}
                                    DialogForm={(props) => (
                                        <AddRoleForm {...props} addNewRole={addTenant} who="owner company" />
                                    )}
                                />                                
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Adding User..." : "Add User"}</Button>
                        </div>
                    </form>
                </TabPanel>
                )}
            </TabContext>
        </Paper>
    </>
  )
}

export default Settings