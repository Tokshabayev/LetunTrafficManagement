"use client";
import { Loader2 } from "lucide-react";

import { cn } from "@/src/core/helpers/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import {
    submitPasswordAsync
} from "@/src/slices/login/login-slice";
import { AppDispatch } from "@/src/app-store";
import { RootStore } from "@/src/app-store";
import { z } from "zod";
import { Form } from "@/src/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { InviteState, InviteType } from "@/src/slices/invite/invite-state";
import { inviteActions } from "@/src/slices/invite/invite-slice";

const FormSchema = z.object({
    password: z.string().trim(),
    passwordConfirm: z.string().trim(),
});

export function InviteNewPassword({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const dispatch = useDispatch<AppDispatch>();

    const state = useSelector<RootStore, InviteState>((state) => state.invite);

    let password = "";
    let passwordConfirm = "";
    if (state.type == InviteType.newPassword) {
        password = state.password ?? "";
        passwordConfirm = state.passwordConfirm ?? "";
    }

    const isLoading = state.isLoading;
    const isValid = state.isStepValid;
    const error = state.requestError;
    const hasError = (error?.length ?? 0) > 0;

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    useEffect(() => {
        if (hasError) {
            form.setError("password", {
                message: error!,
            });
        }
    }, [hasError, error, form]);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Form {...form}>
                <form>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Password</FormLabel>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter your password"
                                                required
                                                disabled={isLoading}
                                                {...field}
                                                value={password}
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    form.setFocus("passwordConfirm");
                                                }}
                                                onChange={(e) => {
                                                    dispatch(inviteActions.setNewPassword(e.target.value));
                                                }}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="passwordConfirm"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Password Confirm</FormLabel>
                                            <Input
                                                id="passwordConfirm"
                                                type="password"
                                                placeholder="Confirm your password"
                                                required
                                                disabled={isLoading}
                                                {...field}
                                                value={passwordConfirm}
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    dispatch(submitPasswordAsync());
                                                }}
                                                onChange={(e) => {
                                                    dispatch(inviteActions.setNewPasswordConfirm(e.target.value));
                                                }}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    dispatch(submitPasswordAsync());
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    dispatch(submitPasswordAsync());
                                }}
                                disabled={isLoading || !isValid}
                            >
                                {isLoading && <Loader2 className="animate-spin" />}
                                Login
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
