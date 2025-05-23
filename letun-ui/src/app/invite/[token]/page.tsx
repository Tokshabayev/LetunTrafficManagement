"use client";

import { use, useEffect } from "react";
import { useSelector } from "react-redux";

import { RootStore, useAppDispatch } from "@/src/app-store";
import { useRouter } from "next/navigation";
import { InvitePhone } from "@/src/components/main/invite/invite-phone";
import { InviteType } from "@/src/slices/invite/invite-state";
import { InviteNewPassword } from "@/src/components/main/invite/invite-new-password";
import { InviteOtp } from "@/src/components/main/invite/invite-otp";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import React from "react";
import { checkInviteTokenAsync, inviteActions } from "@/src/slices/invite/invite-slice";
import { useRunOnce } from "@/src/core/hooks/use-run-once";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);

    const type = useSelector<RootStore, InviteType>((state) => state.invite.type);

    const error = useSelector<RootStore, string | undefined>((state) => state.invite.requestError);

    const router = useRouter();

    if (token.trim() == "") {
        router.push("/");
    }

    const dispatch = useAppDispatch();

    useRunOnce(() => {
        dispatch(checkInviteTokenAsync(token));
    });

    useEffect(() => {
        switch (type) {
            case InviteType.success:
                router.push("/");
                break;
            case InviteType.checkFailed:
                toast.error(error ?? "Failed");
                dispatch(inviteActions.clear());
                router.push("/login");
                break;
        }
    }, [router, type, error]);

    const renderContent = () => {
        switch (type) {
            case InviteType.phone:
                return <InvitePhone />;
            case InviteType.otp:
                return <InviteOtp />;
            case InviteType.newPassword:
                return <InviteNewPassword />;
            case InviteType.checkFailed:
            case InviteType.success:
                return <></>;
            default:
                return <InvitePhone />;
        }
    };


    if (type == InviteType.init) {
        return <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
            <Loader2 className="animate-spin mt-25" />
        </div>
    }

    return (
        <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
            <div className="w-full max-w-sm mt-25">{renderContent()}</div>
        </div>
    );
}
