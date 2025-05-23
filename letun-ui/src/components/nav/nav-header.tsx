import { LucideIcon } from "lucide-react";
import { SidebarHeader, SidebarMenuButton } from "../ui/sidebar";

export const NavHeader = ({
  data,
}: {
  data: {
    name: string;
    plan: string;
    url: string;
    logo: LucideIcon;
  };
}) => {
  return (
    <>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={() => {
            window.location.href = data.url;
          }}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <data.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{data.name}</span>
            <span className="truncate text-xs">{data.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>{" "}
    </>
  );
};
