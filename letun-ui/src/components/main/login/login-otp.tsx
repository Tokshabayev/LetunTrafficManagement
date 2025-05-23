"use client";
import React, { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/src/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/src/core/helpers/utils";
import { Button } from "@/src/components/ui/button";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootStore } from "@/src/app-store";
import {
  loginActions,
  submitOtpAsync,
  submitPhoneAsync,
} from "@/src/slices/login/login-slice";
import { LoginState } from "@/src/slices/login/login-state";

const FormSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export function LoginOtp({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const dispatch = useDispatch<AppDispatch>();

  const [timer, setTimer] = useState(60);
  const [isResendAvailable, setIsResendAvailable] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer > 0) {
      setIsResendAvailable(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendAvailable(true);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResendOtp = () => {
    dispatch(submitPhoneAsync());
    setTimer(60);
  };

  const state = useSelector<RootStore, LoginState>((state) => state.login);

  const isLoading = state.isLoading;
  const isValid = state.isStepValid;
  const error = state.requestError;
  const hasError = (error?.length ?? 0) > 0;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    if (hasError) {
      form.setError("pin", {
        message: error!,
      });
    }
  }, [hasError, error, form]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form className="space-y-6">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      onChange={(e) => {
                        dispatch(loginActions.setOtp(e));
                      }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        dispatch(submitOtpAsync());
                      }}
                    >
                      <InputOTPGroup>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Please enter the one-time password sent to your phone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
                dispatch(submitOtpAsync());
              }}
              onClick={(e) => {
                e.preventDefault();
                dispatch(submitOtpAsync());
              }}
              disabled={isLoading || !isValid}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              Login
            </Button>
            <div className="flex items-center justify-between">
              <Button variant="ghost">
                <ChevronLeft />
                Back
              </Button>

              <Button
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  handleResendOtp();
                }}
                disabled={!isResendAvailable}
              >
                {isResendAvailable ? "Resend OTP" : `Resend in ${timer}s`}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
