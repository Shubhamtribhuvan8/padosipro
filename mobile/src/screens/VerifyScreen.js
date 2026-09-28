import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { request } from "../api";
import { Brand, ErrorBanner, OtpInput, PrimaryButton, Screen, Subtitle, TextButton, Title } from "../components/ui";
import { colors, fonts } from "../theme";

export default function VerifyScreen({ navigation, route }) {
  const email = route.params?.email ?? "";
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!route.params?.resend || !email) return;
    request("/api/auth/resend", { method: "POST", body: { email } }).catch((error) => {
      if (error.retryAfterSeconds) setSecondsLeft(error.retryAfterSeconds);
      else setFormError(error.message);
    });
  }, [email, route.params?.resend]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  async function onSubmit() {
    setFormError("");
    if (!/^\d{6}$/.test(code)) {
      setFormError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await request("/api/auth/verify", { method: "POST", body: { email, code } });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login", params: { email, notice: "Email verified. Please log in." } }],
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setFormError("");
    setResending(true);
    try {
      const result = await request("/api/auth/resend", { method: "POST", body: { email } });
      setCode("");
      setSecondsLeft(result.retryAfterSeconds ?? 30);
    } catch (error) {
      if (error.retryAfterSeconds) setSecondsLeft(error.retryAfterSeconds);
      setFormError(error.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <Title>Enter OTP</Title>
      <Subtitle>We've sent the OTP to {email || "your email"}.</Subtitle>
      <ErrorBanner message={formError} />
      <OtpInput value={code} onChange={setCode} />
      <View style={styles.gap} />
      <PrimaryButton label="Verify email" onPress={onSubmit} loading={loading} disabled={code.length !== 6} />
      {secondsLeft > 0 ? (
        <Text style={styles.countdown}>Resend code in 0:{String(secondsLeft).padStart(2, "0")}</Text>
      ) : (
        <TextButton label={resending ? "Sending…" : "Resend code"} onPress={resending ? undefined : onResend} />
      )}
      <TextButton label="Back to log in" onPress={() => navigation.navigate("Login", { email })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: 20 },
  countdown: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
