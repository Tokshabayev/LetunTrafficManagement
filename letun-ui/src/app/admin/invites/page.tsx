"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { useRunOnce } from "@/src/core/hooks/use-run-once";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/app-store";

import { AppHeader } from "@/src/components/header/app-header";
import { uploadInvitesAsync } from "@/src/slices/invites/invites-slice";
import { InvitesTable } from "@/src/components/main/invites/invites-table";

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();

  useRunOnce(() => {
    dispatch(uploadInvitesAsync());
  });

  return (
    <>
      <AppHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Invites Table</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>{" "}
      </AppHeader>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <InvitesTable />
          </div>
        </div>
      </div>
    </>
  );
}
