import type { LucideIcon } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";

export function GateCard({
  icon: GateIcon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action: { to: string; label: string; primary?: boolean };
}) {
  return (
    <Center minHeight="60vh" padding={6}>
      <EmptyState
        headingLevel={1}
        icon={<Icon icon={GateIcon} size="lg" color="secondary" />}
        title={title}
        description={body}
        actions={
          <Button
            label={action.label}
            variant={action.primary ? "primary" : "secondary"}
            href={action.to}
          />
        }
      />
    </Center>
  );
}
