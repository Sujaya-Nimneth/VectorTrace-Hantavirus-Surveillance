import { FormLayout } from "@astryxdesign/core/FormLayout";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Grid } from "@astryxdesign/core/Grid";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";

import { getDiseaseProfile, type DiseaseSlug } from "@/lib/diseases";
import { getSymptomsForDisease } from "@/lib/intake-data";

type Step2Props = {
  diseaseSlug?: DiseaseSlug;
  syndrome: string;
  symptoms: string[];
  onsetDate: string;
  onChange: (patch: { syndrome?: string; symptoms?: string[]; onsetDate?: string }) => void;
};

export function Step2Clinical({
  diseaseSlug = "hantavirus",
  syndrome,
  symptoms,
  onsetDate,
  onChange,
}: Step2Props) {
  const sympSet = new Set(symptoms);
  const profile = getDiseaseProfile(diseaseSlug);
  const availableSymptoms = getSymptomsForDisease(profile.slug);

  const toggle = (k: string, checked: boolean) => {
    const next = new Set(sympSet);
    if (checked) {
      next.add(k);
    } else {
      next.delete(k);
    }
    onChange({ symptoms: Array.from(next) });
  };

  return (
    <FormLayout>
      <RadioList
        label="Clinical syndrome"
        orientation="horizontal"
        value={syndrome}
        onChange={(val) => onChange({ syndrome: val })}
      >
        {profile.syndromes.map((item) => (
          <RadioListItem
            key={item.code}
            value={item.code}
            label={`${item.code} — ${item.label}`}
            description={item.description}
          />
        ))}
      </RadioList>

      <DateInput
        label="Symptom onset date"
        isOptional
        description="Leave unset to record today's date upon submission."
        value={onsetDate ? (onsetDate as DateInputProps["value"]) : undefined}
        onChange={(val) => onChange({ onsetDate: val ?? "" })}
      />

      <VStack gap={2}>
        <Text type="label" weight="medium">
          Observed {profile.shortName} symptoms (optional)
        </Text>
        <Grid columns={{ minWidth: 200, max: 2, repeat: "fit" }} gap={2}>
          {availableSymptoms.map((s) => {
            const active = sympSet.has(s.k);
            return (
              <SelectableCard
                key={s.k}
                label={s.label}
                isSelected={active}
                onChange={(checked) => toggle(s.k, checked)}
                padding={3}
              >
                <HStack gap={2} align="center">
                  <Icon icon={s.icon} size="sm" color={active ? "accent" : "secondary"} />
                  <Text type="body" weight="medium">
                    {s.label}
                  </Text>
                </HStack>
              </SelectableCard>
            );
          })}
        </Grid>
      </VStack>
    </FormLayout>
  );
}
