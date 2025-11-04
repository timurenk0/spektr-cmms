"use client"


import { useAuth } from "@/COMPONENTS/utils/authContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod"

const formSchema = z.object({
    username: z.string().min(1, { error: "Username is required" }),
    password: z.string().min(1, { error: "Password is required" })
});
type LoginFormValues = z.infer<typeof formSchema>;

const Login = () => {
    const [showPw, setShowPw] = useState(false);
    const { user, setUser } = useAuth();
    const router = useRouter();
    
    
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: ""
        }
    });

    const showPassword = () => {
        setShowPw(!showPw);
    };

    const mutation = useMutation({
        mutationFn: async (values: LoginFormValues) => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values)
            });
            
            const data = await response.json().catch(() => null);
            
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
            
            return data;
        },
        onSuccess: (data) => {
            setUser(data.user);

            toast.success("Login successful", {
                duration: 1000,
                position: "bottom-right",
                icon: "👤"
            });
            router.push("/");
        },
        onError: (error) => {
            toast.error(`Failed to login: ${error.message}`, {
                duration: 3000,
                position: "bottom-right",
                icon: "❌"
            })
        }
    });

    const onSubmit = (values: LoginFormValues) => {
        mutation.mutate(values);
    }
    
  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center bg-white px-4">
        <form
            onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
            className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:w-[30vw] max-h-[90vh] bg-[#ffffffa6] border-2 border-green-600 p-6 sm:p-8 rounded-xl space-y-4 overflow-auto"
        >
            <Image src="/spektr-logo.png" width={256} height={256} alt="SpektrGroup logo" className="mx-auto" />
            <p className="text-center text-sm text-gray-600">Owned and managed by SpektrGroup</p>
            <TextField
                label="Username"
                color="info"
                margin="dense"
                required
                fullWidth
                {...form.register("username")}
            />
            <TextField
                type={showPw ? "text" : "password"}
                label="Password"
                color="info"
                margin="dense"
                required
                fullWidth
                {...form.register("password")}
            />
            <Button variant="text" color="inherit" sx={{ fontSize: "10px" }} onClick={showPassword}>Show Password</Button>
            <Button
                type="submit"
                className="w-full"
                sx={{ marginTop: "16px" }}
                disabled={mutation.isPending}
            >
                {mutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
        </form>
    </div>
  )
}

export default Login