import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { StatusDot } from "@astryxdesign/core/StatusDot";

type Tone = "alert" | "teal" | "info" | "warning";

const TONE_DOT: Record<Tone, "error" | "accent" | "neutral" | "warning"> = {
  alert: "error",
  teal: "accent",
  info: "neutral",
  warning: "warning",
};

export function MetricCard({
  label,
  value,
  delta,
  tone,
  invertDelta = false,
  windowLabel = "vs prior 30d",
}: {
  label: string;
  value: string;
  /** null = no prior baseline (first period with data) — rendered as "New". */
  delta: number | null;
  tone: Tone;
  invertDelta?: boolean;
  windowLabel?: string;
}) {
  const isPositiveDelta = delta !== null && delta > 0;
  const isZeroDelta = delta === 0;
  const deltaVariant =
    delta === null
      ? "accent"
      : isZeroDelta
        ? "neutral"
        : isPositiveDelta
          ? invertDelta
            ? "success"
            : "error"
          : invertDelta
            ? "error"
            : "success";

  const deltaText = delta === null ? "New" : `${delta > 0 ? "+" : ""}${delta}% 30d`;

  return (
    <VStack gap={1.5} minHeight={84} justify="between">
      <HStack justify="between" align="center" gap={2}>
        <Text type="label" color="secondary" maxLines={1}>
          {label}
        </Text>
        <StatusDot variant={TONE_DOT[tone]} label={label} />
      </HStack>

      <Text type="display-3" weight="semibold" hasTabularNumbers>
        {value}
      </Text>

      <HStack gap={1.5} align="center">
        <StatusDot variant={deltaVariant} label={deltaText} />
        <Text type="supporting" size="xsm" weight="medium" hasTabularNumbers>
          {deltaText}
        </Text>
        <Text type="supporting" size="xsm" color="secondary">
          {windowLabel}
        </Text>
      </HStack>
    </VStack>
  );
}
