"use client"


import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextField } from "@mui/material";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod"
import { authenticate } from "../lib/actions";

const formSchema = z.object({
    username: z.string().min(1, { error: "Username is required" }),
    password: z.string().min(1, { error: "Password is required" })
});
type LoginFormValues = z.infer<typeof formSchema>;

const Login = () => {
    const [showPw, setShowPw] = useState(false);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)
    
    
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

  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center bg-white px-4">
        <form
            action={formAction}
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
            <input type="hidden" name="redirectTo" defaultValue={callbackUrl} />
            <Button
                type="submit"
                className="w-full"
                sx={{ marginTop: "16px" }}
                disabled={isPending}
            >
                {isPending ? "Signing In..." : "Sign In"}
            </Button>
        </form>
    </div>
  )
}

export default Login