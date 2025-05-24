"use client";

import * as React from "react";
import {
  Bot,
  GalleryVerticalEnd,
  Map,
  SquareTerminal,
} from "lucide-react";

import { NavAdmin } from "@/src/components/nav/nav-admin";
import { NavProjects } from "@/src/components/nav/nav-projects";
import { NavUser } from "@/src/components/nav/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/src/components/ui/sidebar";
import { AppDispatch, RootState } from "@/src/app-store";
import { useDispatch, useSelector } from "react-redux";
import { initUserAsync, userSelectors } from "@/src/slices/user/user-slice";
import { NavHeader } from "./nav-header";
import { useRunOnce } from "@/src/core/hooks/use-run-once";
import { UserStateType } from "@/src/slices/user/user-state";
import User from "@/src/models/users/user";

const data = {
  company: {
    name: "Letun",
    logo: GalleryVerticalEnd,
    plan: "Orki Letyagi inc.",
    url: "/",
  },
  navAdmin: [
    {
      title: "Accounts",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Invites",
          url: "/admin/invites",
        },
      ],
    },
    {
      title: "Main",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Drones",
          url: "/admin/drones",
        },
        {
          title: "Flights",
          url: "/admin/flights",
        },
      ],
    },
  ],
  myLetun: [
    {
      name: "Missions",
      url: "/missions",
      icon: Map,
    },
  ],
};

interface NavUserData {
  name: string;
  email: string;
  avatar: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch<AppDispatch>();
  const type = useSelector((state: RootState) => state.user.type);

  useRunOnce(() => {
    if (type != UserStateType.loaded) {
      dispatch(initUserAsync());
    }
  });

  const user = useSelector<RootState, User | undefined>((state) =>
    userSelectors.selectUser(state)
  );

  let userData: NavUserData | undefined;

  if (user != undefined) {
    userData = {
      name: user.name,
      email: user.email,
      avatar: "/avatars/shadcn.jpg",
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <NavHeader data={data.company} />
      <SidebarContent>
        {user?.roleCode === "admin" && <NavAdmin items={data.navAdmin} />}
        <NavProjects projects={data.myLetun} />
      </SidebarContent>
      {user && <SidebarFooter>
        <NavUser user={userData!} />
      </SidebarFooter>}

      <SidebarRail />
    </Sidebar>
  );
}
