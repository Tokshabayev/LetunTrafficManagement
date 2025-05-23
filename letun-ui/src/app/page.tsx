"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Separator } from "@/src/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/src/components/ui/sidebar";
import { useRunOnce } from "@/src/core/hooks/use-run-once";
import { useDispatch } from "react-redux";
import { initUserAsync } from "../slices/user/user-slice";
import { AppDispatch } from "../app-store";
import { AppSidebar } from "../components/nav/app-sidebar";
import { DataTable } from "@/src/components/dashboard/data-table";
import { SectionCards } from "@/src/components/dashboard/section-cards";
import { ChartAreaInteractive } from "@/src/components/dashboard/chart-area-interactive";

import data from "./data.json";
import { AppHeader } from "../components/header/app-header";

export default function Page() {
  return (
    <>
      <AppHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>{" "}
      </AppHeader>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </>
  );
}
