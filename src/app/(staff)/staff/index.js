import { Redirect } from "expo-router";

/**
 * Staff area root; opens the counter verification screen.
 * @module app/(staff)/staff/index
 */

export default function StaffIndex() {
  return <Redirect href="/staff/orders" />;
}
