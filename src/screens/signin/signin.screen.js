import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { isValidEmail } from "../../shared/validation/email.js";
import { getHomeRouteForRole } from "../../domain/auth/roles.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Shared sign-in screen.
 * @module screens/signin/signin.screen
 */

/**
 * @returns {JSX.Element} Sign-in screen.
 */
export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  useEffect(() => {
    if (hydrated && status === "authenticated" && user) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [hydrated, status, user, router]);

  const onSubmit = async () => {
    clearError();
    setLocalError("");

    const trimmedEmail = email.trim().toLowerCase();
    const emailError = !isValidEmail(trimmedEmail);
    const passwordMissing = !password;
    if (emailError || passwordMissing) {
      setFieldErrors({ email: emailError, password: passwordMissing });
      setLocalError(emailError ? "Enter a valid email address." : "Enter your password.");
      return;
    }

    setFieldErrors({ email: false, password: false });
    setSubmitting(true);
    const result = await signIn({ email: trimmedEmail, password });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors({ email: true, password: true });
      setLocalError(result.error || "Unable to sign in.");
    }
  };

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Preparing sign-in..." />
      </ScreenContainer>
    );
  }

  const showStoreError = !localError && storeError;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View className="mx-auto w-full max-w-md">
        <Link href="/" asChild>
          <Text className={`font-outfit mb-8 text-sm font-semibold ${cx.textPrimary}`}>← Back to storefront</Text>
        </Link>

        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Sign in</Text>
        <Text className={`font-outfit mt-3 text-base leading-relaxed ${cx.textInk70}`}>
          Sign in with your email and password.
        </Text>

        <View className="mt-8 gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: false }));
            }}
            placeholder="example@email.com"
            autoCapitalize="none"
            autoComplete="email"
            error={fieldErrors.email || showStoreError}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: false }));
            }}
            placeholder="******"
            secureTextEntry
            enablePasswordToggle
            autoComplete="password"
            error={fieldErrors.password || showStoreError}
          />

          <Alert variant="error" message={localError || storeError} />

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={submitting || status === "loading"}
            className="mt-2"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
