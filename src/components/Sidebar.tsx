import { useRouterState } from "@tanstack/react-router";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { Activity, FilePlus2, MapPin, Server } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useRoles();

  return (
    <SideNav
      collapsible
      aria-label="Surveillance navigation"
      footer={
        <HStack gap={2} align="center" paddingInline={2} paddingBlock={1}>
          <StatusDot variant="success" label="Surveillance feed active" isPulsing />
          <Text type="supporting" size="xsm">
            WHO DON · Field Ops
          </Text>
        </HStack>
      }
    >
      <SideNavSection title="Surveillance">
        <SideNavItem
          label="Dashboard"
          icon={Activity}
          href="/dashboard"
          isSelected={pathname === "/dashboard"}
        />
        <SideNavItem
          label="Geo Tracker"
          icon={MapPin}
          href="/map"
          isSelected={pathname === "/map"}
        />
        <SideNavItem
          label="Case Intake"
          icon={FilePlus2}
          href="/intake"
          isSelected={pathname === "/intake"}
        />
      </SideNavSection>

      {isAdmin && (
        <SideNavSection title="Operations">
          <SideNavItem
            label="Admin Console"
            icon={Server}
            href="/admin"
            isSelected={pathname === "/admin"}
          />
        </SideNavSection>
      )}
    </SideNav>
  );
}
