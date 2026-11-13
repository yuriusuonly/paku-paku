import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer sign-up screen.
 * @module screens/signup/signup-screen
 */

/**
 * Sign-up form.
 *
 * @returns {JSX.Element} Sign-up screen.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: false, password: false });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (hydrated && status === "authenticated" && user) {
      router.replace("/");
    }
  }, [hydrated, status, user, router]);

  const onSubmit = async () => {
    clearError();
    setLocalError("");
    setSuccess("");

    const usernameMissing = !username.trim();
    const passwordMissing = !password;
    if (usernameMissing || passwordMissing) {
      setFieldErrors({ username: usernameMissing, password: passwordMissing });
      setLocalError("Enter a username and password.");
      return;
    }

    setFieldErrors({ username: false, password: false });
    setSubmitting(true);
    const result = await signUp({ username, password });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors({ username: true, password: true });
      setLocalError(result.error || "Unable to create account.");
      return;
    }

    if (result.requiresSignIn) {
      setSuccess("Account created. Please sign in.");
    }
  };

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Preparing sign-up..." />
      </ScreenContainer>
    );
  }

  const errorMessage = localError || storeError;
  const showStoreError = !localError && storeError;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View className="mx-auto w-full max-w-md">
        <Link href="/" asChild>
          <Text className={`font-outfit mb-8 text-sm font-semibold ${cx.textPrimary}`}>
            ← Back to menu
          </Text>
        </Link>

        <Text className={`font-outfit text-3xl md:text-4xl font-black tracking-tight ${cx.textInk}`}>
          Sign up
        </Text>
        <Text className={`font-outfit mt-3 text-base leading-relaxed ${cx.textInk70}`}>
          Sign up for a customer account to sign in.
        </Text>

        <View className="mt-8 gap-4">
          <TextField
            label="Username"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: false }));
            }}
            placeholder="yourname"
            autoCapitalize="none"
            autoComplete="username"
            error={fieldErrors.username || showStoreError}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: false }));
            }}
            placeholder="At least 6 characters"
            secureTextEntry
            autoComplete="new-password"
            error={fieldErrors.password || showStoreError}
          />

          {errorMessage ? (
            <Text className={`font-outfit text-sm ${cx.textError}`}>{errorMessage}</Text>
          ) : null}
          <Alert variant="success" message={success} />

          <Button
            label="Sign up"
            onPress={onSubmit}
            loading={submitting || status === "loading"}
            className="mt-2"
          />
        </View>

        <View className="mt-6 flex-row items-center gap-2">
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Already have an account?</Text>
          <Link href="/signin" asChild>
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Sign in</Text>
          </Link>
        </View>
      </View>
    </ScreenContainer>
  );
}
