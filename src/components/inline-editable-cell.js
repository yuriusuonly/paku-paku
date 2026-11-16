import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Inline editable text cell for table fields.
 * @module components/inline-editable-cell
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function InlineEditableCell({ value, onSave, placeholder = "", numeric = false, multiline = false }) {
  const stringValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(stringValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(stringValue);
  }, [stringValue, focused]);

  const commit = async () => {
    setFocused(false);
    if (draft === stringValue) return;
    try {
      await onSave(draft);
    } catch {
      setDraft(stringValue);
    }
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

  return (
    <TextInput
      value={draft}
      onChangeText={setDraft}
      onFocus={() => setFocused(true)}
      onBlur={() => { void commit(); }}
      onSubmitEditing={multiline ? undefined : () => { void commit(); }}
      onKeyPress={handleKeyPress}
      blurOnSubmit={!multiline}
      placeholder={placeholder}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm font-bold ${cx.textInk} ${multiline ? "min-h-[72px]" : ""}`}
    />
  );
}
