/**
 * TimePicker - Business hours and time range selection
 * Allows selecting start/end times and days of the week
 */

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeRangeValue } from "../types";

interface TimePickerProps {
  value: TimeRangeValue | null;
  onChange: (value: TimeRangeValue) => void;
  disabled?: boolean;
}

/**
 * Day configuration
 */
const days = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
];

/**
 * Hour options (24-hour format)
 */
const hours = Array.from({ length: 24 }, (_, i) => {
  const hour12 = i % 12 || 12;
  const period = i < 12 ? "AM" : "PM";
  return {
    value: i,
    label: `${hour12}:00 ${period}`,
    label24: `${i.toString().padStart(2, "0")}:00`,
  };
});

/**
 * Preset time ranges for quick selection
 */
const presets = [
  {
    id: "business",
    label: "Business Hours (9-5 Mon-Fri)",
    value: {
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      days: [1, 2, 3, 4, 5],
    },
  },
  {
    id: "extended",
    label: "Extended Hours (8-8 Mon-Fri)",
    value: {
      startHour: 8,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      days: [1, 2, 3, 4, 5],
    },
  },
  {
    id: "weekdays",
    label: "Weekdays (All Day)",
    value: {
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
      days: [1, 2, 3, 4, 5],
    },
  },
  {
    id: "weekends",
    label: "Weekends Only",
    value: {
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
      days: [0, 6],
    },
  },
  {
    id: "custom",
    label: "Custom...",
    value: null,
  },
];

/**
 * Default value for time range
 */
const defaultValue: TimeRangeValue = {
  startHour: 9,
  startMinute: 0,
  endHour: 17,
  endMinute: 0,
  days: [1, 2, 3, 4, 5],
};

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const currentValue = value || defaultValue;

  // Detect if current value matches a preset
  const matchedPreset = useMemo(() => {
    if (!value) return null;
    for (const preset of presets) {
      if (!preset.value) continue;
      if (
        preset.value.startHour === value.startHour &&
        preset.value.endHour === value.endHour &&
        preset.value.days.length === value.days.length &&
        preset.value.days.every((d) => value.days.includes(d))
      ) {
        return preset.id;
      }
    }
    return "custom";
  }, [value]);

  const handlePresetChange = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset?.value) {
      onChange(preset.value);
    }
  };

  const handleStartHourChange = (hourStr: string) => {
    const hour = parseInt(hourStr, 10);
    onChange({ ...currentValue, startHour: hour });
  };

  const handleEndHourChange = (hourStr: string) => {
    const hour = parseInt(hourStr, 10);
    onChange({ ...currentValue, endHour: hour });
  };

  const handleDayToggle = (day: number) => {
    const newDays = currentValue.days.includes(day)
      ? currentValue.days.filter((d) => d !== day)
      : [...currentValue.days, day].sort((a, b) => a - b);
    onChange({ ...currentValue, days: newDays });
  };

  return (
    <div className="flex-1 space-y-3">
      {/* Preset selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Quick Select</Label>
        <Select
          value={matchedPreset || "custom"}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a preset..." />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time range selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Start Time</Label>
          <Select
            value={currentValue.startHour.toString()}
            onValueChange={handleStartHourChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour.value} value={hour.value.toString()}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">End Time</Label>
          <Select
            value={currentValue.endHour.toString()}
            onValueChange={handleEndHourChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour.value} value={hour.value.toString()}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Days of week */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Days</Label>
        <div className="flex gap-1">
          {days.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleDayToggle(day.value)}
              disabled={disabled}
              className={`flex items-center justify-center w-10 h-8 text-xs rounded border transition-colors ${
                currentValue.days.includes(day.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={day.label}
            >
              {day.short}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
        {formatTimeRangePreview(currentValue)}
      </div>
    </div>
  );
}

/**
 * Format time range for preview
 */
function formatTimeRangePreview(value: TimeRangeValue): string {
  const formatTime = (hour: number): string => {
    const hour12 = hour % 12 || 12;
    const period = hour < 12 ? "AM" : "PM";
    return `${hour12}:00 ${period}`;
  };

  const formatDays = (dayNums: number[]): string => {
    if (dayNums.length === 0) return "no days";
    if (dayNums.length === 7) return "every day";

    // Check for weekdays
    const weekdays = [1, 2, 3, 4, 5];
    if (
      dayNums.length === 5 &&
      weekdays.every((d) => dayNums.includes(d)) &&
      !dayNums.includes(0) &&
      !dayNums.includes(6)
    ) {
      return "weekdays";
    }

    // Check for weekends
    if (dayNums.length === 2 && dayNums.includes(0) && dayNums.includes(6)) {
      return "weekends";
    }

    // List individual days
    return dayNums.map((d) => days[d]?.short ?? String(d)).join(", ");
  };

  const timeStr = `${formatTime(value.startHour)} to ${formatTime(value.endHour)}`;
  const daysStr = formatDays(value.days);

  return `Access allowed from ${timeStr} on ${daysStr}`;
}
