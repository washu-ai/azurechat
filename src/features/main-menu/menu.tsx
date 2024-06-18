"use client";

import { Button } from "@/components/ui/button";
import {
  History,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  PanelRightClose,
  Triangle, 
  BookOpen,
  ClipboardSignature
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../theme/theme-toggle";
import { UserProfile } from "../user-profile";

import { useSession } from "next-auth/react";
import { UpdateIndicator } from "../change-log/update-indicator";
import { useMenuContext } from "./menu-context";
import { FEEDBACK_LINK } from "../theme/customise";

export const MainMenu = () => {
  const { data: session } = useSession();
  const { isMenuOpen, toggleMenu } = useMenuContext();
  return (
    <div className="flex flex-col justify-between p-2">
      <div className="flex gap-2  flex-col  items-center">
        <Button
          onClick={toggleMenu}
          className="rounded-full w-[40px] h-[40px] p-1 text-primary"
          variant={"outline"}
        >
          {isMenuOpen ? <PanelLeftClose /> : <PanelRightClose />}
        </Button>

        <Button
          asChild
          className="rounded-full w-[40px] h-[40px] p-2 text-primary"
          variant={"outline"}
        >
          <Link href="/" title="Chat">
            <MessageCircle />
          </Link>
        </Button>
        {session?.user?.isAdmin ? (
          <Button
            asChild
            className="rounded-full w-[40px] h-[40px] p-2 text-primary"
            variant={"outline"}
          >
            <Link href="/reporting" title="Reporting">
              <LayoutDashboard />
            </Link>
          </Button>
        ) : (
          <></>
        )}
        <Button
          asChild
          className="rounded-full w-[40px] h-[40px] p-2 text-primary"
          variant={"outline"}
        >
          <Link href={FEEDBACK_LINK} target="_blank" title="feedback" className="relative">
            <ClipboardSignature />
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <ThemeToggle />
        <UserProfile />
      </div>
    </div>
  );
};
