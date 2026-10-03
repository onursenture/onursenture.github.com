"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";

// A working Toggle for /system/ that changes nothing but itself.
export function ToggleDemo() {
  const [value, setValue] = useState<"one" | "two" | "three">("one");
  return (
    <Toggle
      label="Example toggle"
      value={value}
      onChange={setValue}
      options={[
        { value: "one", label: "One" },
        { value: "two", label: "Two" },
        { value: "three", label: "Three" },
      ]}
    />
  );
}
