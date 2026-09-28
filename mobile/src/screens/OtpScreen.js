import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { request } from "../api";
import { useAuth } from "../auth";
import { BackButton, Logo } from "../components/chrome";
import { ErrorBanner, PrimaryButton, Screen, Subtitle, Title } from "../components/ui";
import { maskEmail } from "../format";
import { useToast } from "../toast";
import { colors, fonts } from "../theme";

export default function OtpScreen({ navigation, route }) {
  const { email } = route.params;
  const { acceptSession } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function verify() {
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      toast("Enter the 6-digit code.", "error");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await request("/api/auth/verify", {
        method: "POST",
        body: { email, code },
      });
      toast("You're in.");
      await acceptSession(result);
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (seconds > 0) return;
    try {
      const result = await request("/api/auth/resend", { method: "POST", body: { email } });
      setSeconds(result.retryAfterSeconds || 30);
      setCode("");
      setError("");
      toast("A new code is on its way.");
    } catch (err) {
      setSeconds(err.retryAfterSeconds || 30);
      toast(err.message, "error");
    }
  }

  const shown = hidden ? "•".repeat(code.length) : code.split("").join(" ");

  return (
    <Screen footer={<PrimaryButton label="Verify" onPress={verify} loading={loading} disabled={code.length !== 6} />}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.brand}>
        <Logo />
      </View>
      <Title>Enter OTP</Title>
      <Subtitle>
        We've sent a code to the email on your account ({maskEmail(email)}). It expires in 10 minutes.
      </Subtitle>
      <ErrorBanner message={error} />
      <Text style={styles.label}>6-digit code</Text>
      <View style={[styles.box, error && styles.boxError]}>
        <Text style={[styles.digits, !code && styles.placeholder]}>{code ? shown : " "}</Text>
        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          autoFocus
          caretHidden
          style={styles.capture}
          accessibilityLabel="6-digit code"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show code" : "Hide code"}
          onPress={() => setHidden((value) => !value)}
          hitSlop={8}
          style={styles.eye}
        >
          <Feather name={hidden ? "eye" : "eye-off"} size={18} color={colors.muted} />
        </Pressable>
      </View>
      <Pressable onPress={resend} disabled={seconds > 0} style={styles.resend}>
        <Text style={[styles.resendText, seconds > 0 && styles.resendWait]}>
          {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    marginBottom: 8,
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  box: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    justifyContent: "center",
    paddingLeft: 16,
    paddingRight: 48,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digits: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 20,
    letterSpacing: 2,
  },
  placeholder: {
    color: "transparent",
  },
  capture: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
  },
  eye: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  resend: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingVertical: 4,
  },
  resendText: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  resendWait: {
    color: colors.muted,
    fontFamily: fonts.medium,
  },
});
