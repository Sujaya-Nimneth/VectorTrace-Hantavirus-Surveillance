import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

/** Shared "you can't be here" card used by the gated routes. */
export function GateCard({
  icon: Icon,
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
    <div className="p-12 max-w-md mx-auto text-center">
      <div className="bg-card border border-border rounded-lg p-8">
        <Icon className="size-10 mx-auto mb-3 text-alert" />
        <h2 className="font-bold text-[15px]">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground mt-1.5">{body}</p>
        <Link
          to={action.to}
          className={
            action.primary
              ? "mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              : "mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold border border-input hover:bg-muted"
          }
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
