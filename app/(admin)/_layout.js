import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "../../stores/auth.store.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { isAdminRole } from "../../domain/auth/roles.js";

/**
 * Protected administrator route group layout.
 *
 * Route groups do not affect URLs; every route inside `(admin)` requires an
 * authenticated admin profile.
 * @module app/(admin)/_layout
 */

/**
 * @returns {JSX.Element} Admin route group layout.
 */
export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  if (status !== "authenticated" || !isAdminRole(user?.role)) {
    return <Redirect href="/signin" />;
  }

  return <Slot />;
}
