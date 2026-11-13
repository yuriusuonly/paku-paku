import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { LoadingState } from "../../components/loading-state.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth-store.js";

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

    if (!username.trim() || !password) {
      setLocalError("Enter a username and password.");
      return;
    }

    setSubmitting(true);
    const result = await signUp({ username, password });
    setSubmitting(false);

    if (!result.ok) {
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
        <LoadingState message="Preparing sign-up..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View className="mx-auto w-full max-w-md">
          <Link href="/" asChild>
            <Text className="font-outfit mb-8 text-sm font-semibold text-[#FE2C55]">
              ← Back to menu
            </Text>
          </Link>

          <Text className="font-outfit text-3xl md:text-4xl font-black tracking-tight text-[#161823]">
            Sign up
          </Text>
          <Text className="font-outfit mt-3 text-base leading-relaxed text-[#161823]/70">
            Sign up for a customer account to sign in.
          </Text>

          <View className="mt-8 gap-4">
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="yourname"
              autoCapitalize="none"
              autoComplete="username"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoComplete="new-password"
            />

            <Alert variant="error" message={localError || storeError} />
            <Alert variant="success" message={success} />

            <Button
              label="Sign up"
              onPress={onSubmit}
              loading={submitting || status === "loading"}
              className="mt-2"
            />
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <Text className="font-outfit text-sm text-[#161823]/70">Already have an account?</Text>
            <Link href="/sign-in" asChild>
              <Text className="font-outfit text-sm font-semibold text-[#FE2C55]">Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
