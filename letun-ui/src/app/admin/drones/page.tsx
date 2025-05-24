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
import { DronesTable } from "@/src/components/main/drones/drones-table";
import { uploadDronesAsync } from "@/src/slices/drones/drones-slice";

export default function Page() {
    const dispatch = useDispatch<AppDispatch>();

    useRunOnce(() => {
        dispatch(uploadDronesAsync());
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
                            <BreadcrumbPage>Drones Table</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>{" "}
            </AppHeader>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <DronesTable />
                    </div>
                </div>
            </div>
        </>
    );
}
