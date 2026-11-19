import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "../../stores/auth.store.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { isCustomerRole } from "../../domain/auth/roles.js";

/**
 * Protected customer route group layout.
 *
 * Route groups do not affect URLs; `/menu`, `/cart`, and `/checkout` require the
 * shared guest profile. There is no signup.
 * @module app/(customer)/_layout
 */

/**
 * @returns {JSX.Element} Customer route group layout.
 */
export default function CustomerLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Preparing the storefront..." />
      </ScreenContainer>
    );
  }

  if (status !== "authenticated" || !isCustomerRole(user?.role)) {
    return <Redirect href="/signin" />;
  }

  return <Slot />;
}
