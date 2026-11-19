import { Redirect } from "expo-router";

/**
 * Staff area root; opens the order taking screen.
 * @module app/(staff)/staff/index
 */

export default function StaffIndex() {
  return <Redirect href="/staff/order-taking" />;
}
