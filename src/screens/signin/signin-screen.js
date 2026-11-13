import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Sign-in screen.
 * @module screens/signin/signin-screen
 */

/**
 * Username/password sign-in form.
 *
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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: false, password: false });

  useEffect(() => {
    if (hydrated && status === "authenticated" && user) {
      router.replace(user.role === "admin" ? "/admin" : "/");
    }
  }, [hydrated, status, user, router]);

  const onSubmit = async () => {
    clearError();
    setLocalError("");

    const usernameMissing = !username.trim();
    const passwordMissing = !password;
    if (usernameMissing || passwordMissing) {
      setFieldErrors({ username: usernameMissing, password: passwordMissing });
      setLocalError("Enter your username and password.");
      return;
    }

    setFieldErrors({ username: false, password: false });
    setSubmitting(true);
    const result = await signIn({ username, password });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors({ username: true, password: true });
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

  const errorMessage = localError || storeError;
  const showStoreError = !localError && storeError;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View className="mx-auto w-full max-w-md">
          <Link href="/" asChild>
            <Text className={`font-outfit mb-8 text-sm font-semibold ${cx.textPrimary}`}>
              ← Back to menu
            </Text>
          </Link>

          <Text className={`font-outfit text-3xl md:text-4xl font-black tracking-tight ${cx.textInk}`}>
            Sign in
          </Text>
          <Text className={`font-outfit mt-3 text-base leading-relaxed ${cx.textInk70}`}>
            Use your account username and password.
          </Text>

          <View className="mt-8 gap-4">
            <TextField
              label="Username"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: false }));
              }}
              placeholder="root"
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
              placeholder="••••"
              secureTextEntry
              enablePasswordToggle
              autoComplete="password"
              error={fieldErrors.password || showStoreError}
            />

            {errorMessage ? (
              <Text className={`font-outfit text-sm ${cx.textError}`}>{errorMessage}</Text>
            ) : null}

            <Button
              label="Sign in"
              onPress={onSubmit}
              loading={submitting || status === "loading"}
              className="mt-2"
            />
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>Need an account?</Text>
            <Link href="/signup" asChild>
              <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Sign up</Text>
            </Link>
          </View>

          <Text className={`font-outfit mt-4 text-xs leading-relaxed ${cx.textInk50}`}>
            Administrator seed (local): username <Text className="font-semibold">root</Text>, password <Text className="font-semibold">admin</Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
