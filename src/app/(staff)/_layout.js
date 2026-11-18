import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "../../stores/auth.store.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";

/**
 * Protected staff route group layout.
 * @module app/(staff)/_layout
 */

/**
 * @returns {JSX.Element} Staff route group layout.
 */
export default function StaffLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking staff access..." />
      </ScreenContainer>
    );
  }

  if (status !== "authenticated" || user?.role !== "admin") {
    return <Redirect href="/signin" />;
  }

  return <Slot />;
}
