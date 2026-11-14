import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
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

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false, confirmPassword: false });
  const [signupSuccess, setSignupSuccess] = useState(null);

  useEffect(() => {
    if (hydrated && status === "authenticated" && user && !signupSuccess) {
      router.replace("/menu");
    }
  }, [hydrated, status, user, signupSuccess, router]);

  const onSubmit = async () => {
    clearError();
    setLocalError("");
    setSignupSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailMissing = !trimmedEmail;
    const emailInvalid = trimmedEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) : false;
    const passwordMissing = !password;
    const confirmPasswordMissing = !confirmPassword;
    if (emailMissing || emailInvalid || passwordMissing || confirmPasswordMissing) {
      setFieldErrors({ email: emailMissing || emailInvalid, password: passwordMissing, confirmPassword: confirmPasswordMissing });
      setLocalError(emailInvalid ? "Enter a valid email address." : "Enter an email, password, and password confirmation.");
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ email: false, password: true, confirmPassword: true });
      setLocalError("Passwords do not match.");
      return;
    }

    setFieldErrors({ email: false, password: false, confirmPassword: false });
    setSubmitting(true);
    const result = await signUp({ email: trimmedEmail, password });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors({ email: true, password: true, confirmPassword: true });
      setLocalError(result.error || "Unable to create account.");
      return;
    }

    setSignupSuccess({
      email: trimmedEmail,
      requiresSignIn: Boolean(result.requiresSignIn),
      recoveryCode: result.recoveryCode || ""
    });
  };

  const copyRecoveryCode = async () => {
    if (!signupSuccess?.recoveryCode) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(signupSuccess.recoveryCode);
        showSuccess("Recovery code copied.");
        return;
      }
    } catch {}
    showError("Could not copy the recovery code. Please copy it manually.");
  };

  if (!hydrated) {
    return (
      <ScreenContainer>
        <CircularProgress message="Preparing sign-up..." />
      </ScreenContainer>
    );
  }

  if (signupSuccess) {
    return (
      <ScreenContainer scrollable contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View className="mx-auto w-full max-w-md">
          <Text className={`font-outfit text-3xl md:text-4xl font-black tracking-tight ${cx.textInk}`}>
            Save your recovery code
          </Text>
          <Text className={`font-outfit mt-3 text-base leading-relaxed ${cx.textInk70}`}>
            Your account has been created for{" "}
            <Text className={`font-outfit font-semibold ${cx.textInk}`}>{signupSuccess.email}</Text>.
            {signupSuccess.requiresSignIn ? " Please confirm your email if required, then sign in." : " Sign in when you’re ready."}
          </Text>

          <View className={`mt-8 gap-3 rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-5`}>
            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
              Recovery code (show once)
            </Text>
            {signupSuccess.recoveryCode ? (
              <>
                <Text selectable className={`font-outfit text-base font-bold tracking-widest ${cx.textInk}`}>
                  {signupSuccess.recoveryCode}
                </Text>
                <Text className={`font-outfit text-sm ${cx.textInk70}`}>
                  Save this code in a safe place. You can use it to recover your account if you lose access.
                </Text>
                <Pressable onPress={copyRecoveryCode} className="self-start">
                  <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Copy recovery code</Text>
                </Pressable>
              </>
            ) : (
              <Text className={`font-outfit text-sm ${cx.textInk70}`}>
                Your recovery code will be available after you confirm your email and complete account setup. Keep your account details safe.
              </Text>
            )}
          </View>

          <View className="mt-6 gap-3">
            <Button
              label="Go to sign in"
              onPress={() => router.replace({ pathname: "/signin", params: { email: signupSuccess.email } })}
            />
          </View>
        </View>
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
            ← Back home
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
              if (fieldErrors.password || fieldErrors.confirmPassword) {
                setFieldErrors((current) => ({ ...current, password: false, confirmPassword: false }));
              }
            }}
            placeholder="At least 6 characters"
            secureTextEntry
            enablePasswordToggle
            autoComplete="new-password"
            error={fieldErrors.password || showStoreError}
          />
          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (fieldErrors.confirmPassword || fieldErrors.password) {
                setFieldErrors((current) => ({ ...current, confirmPassword: false, password: false }));
              }
            }}
            placeholder="Re-enter password"
            secureTextEntry
            enablePasswordToggle
            autoComplete="new-password"
            error={fieldErrors.confirmPassword || showStoreError}
          />

          <Alert variant="error" message={errorMessage} />

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
