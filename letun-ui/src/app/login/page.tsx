"use client";

import { JSX, useEffect } from "react";
import { useSelector } from "react-redux";

import { RootStore } from "@/src/app-store";
import { LoginOtp } from "@/src/components/main/login/login-otp";
import { LoginPhone } from "@/src/components/main/login/login-phone";
import { LoginType } from "@/src/slices/login/login-state";
import { LoginPasswordVerify } from "@/src/components/main/login/login-password-verify";
import { useRouter } from "next/navigation";
import { LoginNewPassword } from "@/src/components/main/login/login-new-password";
import { LoginEmail } from "@/src/components/main/login/login-email";

export default function LoginPage(): JSX.Element {
  const type = useSelector<RootStore, LoginType>((state) => state.login.type);

  const router = useRouter();

  useEffect(() => {
    if (type == LoginType.success) {
      router.push("/");
    }
  }, [router, type]);

  const renderContent = () => {
    switch (type) {
      case LoginType.phone:
        return <LoginPhone />;
      case LoginType.email:
        return <LoginEmail />;
      case LoginType.otp:
        return <LoginOtp />;
      case LoginType.passwordVerify:
        return <LoginPasswordVerify />;
      case LoginType.newPassword:
        return <LoginNewPassword />;
      case LoginType.success:
        return <></>;
      default:
        return <LoginPhone />;
    }
  };

  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-sm mt-25">{renderContent()}</div>
    </div>
  );
}
