"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/src/components/ui/breadcrumb";
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
        </Breadcrumb>
      </AppHeader>

      <main className="flex flex-1 flex-col items-center text-center px-4 py-20">
        <img className="w-[300px] h-[300px]" src="/letun.png" alt="" />
        <h1 className="text-4xl tracking-tight sm:text-5xl">
          Welcome to the Letun Flight Tracking System (LFTS)
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Monitor and control drone flights in real time. Visualize telemetry, check for no-fly zone violations, and more — all in one place.
        </p>
      </main>
    </>
  );
}
