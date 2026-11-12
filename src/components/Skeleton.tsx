import { Skeleton as CoreSkeleton } from "@astryxdesign/core/Skeleton";

export function Skeleton({
  width = "100%",
  height = 20,
  radius = 2,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
  radius?: "none" | 0 | 1 | 2 | 3 | 4 | "rounded";
}) {
  return <CoreSkeleton width={width} height={height} radius={radius} />;
}
