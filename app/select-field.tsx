"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { Children, isValidElement, type ReactNode } from "react";

type OptionProps = {
  value?: string;
  disabled?: boolean;
  children?: ReactNode;
};

type SelectChangeEvent = { target: { value: string } };

type SelectFieldProps = {
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
};

/** A styled, keyboard-accessible select whose option text renders consistently in RTL locales. */
export function SelectField({
  value,
  onChange,
  children,
  className,
  "aria-label": ariaLabel,
  disabled = false,
}: SelectFieldProps) {
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child) || child.type !== "option") return [];
    return [{
      value: child.props.value ?? "",
      label: child.props.children,
      disabled: child.props.disabled,
    }];
  });

  return (
    <Select.Root
      value={value}
      items={options.map(({ value: optionValue, label }) => ({ value: optionValue, label }))}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onChange({ target: { value: String(nextValue) } });
      }}
    >
      <Select.Trigger
        type="button"
        aria-label={ariaLabel}
        data-value={value}
        className={["select-field-trigger", className].filter(Boolean).join(" ")}
      >
        <Select.Value className="select-field-value" />
        <Select.Icon className="select-field-icon"><ChevronDown size={15} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="select-field-positioner" sideOffset={4}>
          <Select.Popup className="select-field-popup">
            <Select.List>
              {options.map((option, index) => (
                <Select.Item
                  key={`${option.value}-${index}`}
                  value={option.value}
                  data-value={option.value}
                  disabled={option.disabled}
                  className="select-field-option"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="select-field-indicator"><Check size={14} aria-hidden="true" /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
