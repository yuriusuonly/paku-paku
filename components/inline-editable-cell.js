import { useEffect, useRef, useState } from "react";
import { Text, TextInput } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Inline editable text cell for table fields.
 * @module components/inline-editable-cell
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function InlineEditableCell({
  value,
  onSave,
  placeholder = "",
  numeric = false,
  multiline = false,
  disabled = false,
  saving = false,
  accessibilityLabel
}) {
  const stringValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(stringValue);
  const [focused, setFocused] = useState(false);
  const committingRef = useRef(false);
  const committedDraftRef = useRef(null);

  useEffect(() => {
    if (!focused) {
      setDraft(stringValue);
      committedDraftRef.current = null;
    }
  }, [stringValue, focused]);

  const commit = async () => {
    setFocused(false);
    if (committingRef.current || committedDraftRef.current === draft || draft === stringValue) {
      return;
    }

    committingRef.current = true;
    committedDraftRef.current = draft;
    try {
      await onSave(draft);
    } catch {
      setDraft(stringValue);
      committedDraftRef.current = null;
    } finally {
      committingRef.current = false;
    }
  };

  const handleChange = (next) => {
    setDraft(numeric ? next.replace(/[^\d-]/g, "") : next);
  };

  const handleKeyPress = (event) => {
    if (!multiline) return;
    const key = event?.nativeEvent?.key;
    const shiftKey = event?.nativeEvent?.shiftKey;
    if (key === "Enter" && !shiftKey) {
      event.preventDefault?.();
      void commit();
    }
  };

  if (disabled || saving) {
    return (
      <Text
        className={`font-outfit w-full ${cx.radius.sm} px-2 py-1 text-sm font-bold ${cx.textInk} ${saving ? "opacity-60" : ""}`}
      >
        {stringValue || placeholder || "-"}
      </Text>
    );
  }

  return (
    <TextInput
      value={draft}
      onChangeText={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => { void commit(); }}
      onSubmitEditing={multiline ? undefined : () => { void commit(); }}
      onKeyPress={handleKeyPress}
      blurOnSubmit={!multiline}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel || placeholder || "Editable value"}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      className={`font-outfit w-full ${cx.radius.sm} border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm font-bold ${cx.textInk} ${multiline ? "min-h-[72px]" : ""}`}
    />
  );
}
