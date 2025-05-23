"use client";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { cn } from "@/src/core/helpers/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/src/app-store";
import { RootStore } from "@/src/app-store";
import { z } from "zod";
import { Form, FormDescription } from "@/src/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useMask } from "@react-input/mask";
import { inviteActions, submitInvitePhoneAsync } from "@/src/slices/invite/invite-slice";
import { InviteState, InviteType } from "@/src/slices/invite/invite-state";
import { formatPhoneNumberOptions } from "@/src/core/formatters/phone-number";

const FormSchema = z.object({
    phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, {
        message: "Your phone number is invalid",
    }),
});

export function InvitePhone({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const dispatch = useDispatch<AppDispatch>();

    const state = useSelector<RootStore, InviteState>((state) => state.invite);

    let phone = "";
    if (state.type == InviteType.phone) {
        phone = state.phone ?? "";
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
            form.setError("phone", {
                message: error!,
            });
        }
    }, [hasError, error, form]);

    const inputRef = useMask(formatPhoneNumberOptions);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Form {...form}>
                <form>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <a
                                href="#"
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                                    <GalleryVerticalEnd className="size-6" />
                                </div>
                                <span className="sr-only">tava co.</span>
                            </a>
                            <h1 className="text-xl font-bold">letun</h1>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Phone Number</FormLabel>
                                            <Input
                                                id="phone"
                                                type="phone"
                                                placeholder="+7 (7##) ### ## ##"
                                                required
                                                disabled={isLoading}
                                                {...field}
                                                ref={inputRef}
                                                value={phone}
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    dispatch(submitInvitePhoneAsync());
                                                }}
                                                onChange={(e) => {
                                                    dispatch(inviteActions.setPhone(e.target.value));
                                                }}
                                            />
                                            <FormMessage />
                                            <FormDescription>
                                                Please enter your phone number to continue
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    dispatch(submitInvitePhoneAsync());
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    dispatch(submitInvitePhoneAsync());
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
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </div>
        </div>
    );
}
