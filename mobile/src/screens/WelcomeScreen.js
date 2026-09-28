import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { request } from "../api";
import { Logo } from "../components/chrome";
import { ErrorBanner, Field, PrimaryButton, Screen, Subtitle, Title } from "../components/ui";
import { validateWelcome } from "../format";
import { useToast } from "../toast";

export default function WelcomeScreen({ navigation }) {
  const toast = useToast();
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ready = mobile.replace(/\s+/g, "").length === 10 && email.includes("@");

  async function submit() {
    const next = validateWelcome(email, mobile);
    setFields(next);
    setError("");
    if (Object.keys(next).length) {
      toast(Object.values(next)[0], "error");
      return;
    }
    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\s+/g, "");
      const cleanEmail = email.trim().toLowerCase();
      await request("/api/auth/otp", {
        method: "POST",
        body: { email: cleanEmail, mobile: cleanMobile },
      });
      toast("Code sent to your email.");
      navigation.navigate("Otp", { email: cleanEmail, mobile: cleanMobile });
    } catch (err) {
      setError(err.message);
      if (err.fields) setFields(err.fields);
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={<PrimaryButton label="Get OTP" onPress={submit} loading={loading} disabled={!ready || loading} />}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}>
          <Logo />
          <Text style={styles.word}>PadosiPro</Text>
        </View>
        <Title>Welcome</Title>
        <Subtitle>Enter your mobile number and email. We'll send the OTP to your email.</Subtitle>
        <ErrorBanner message={error} />
        <Field
          label="Mobile number"
          icon="phone"
          prefix="+91"
          value={mobile}
          onChangeText={(text) => setMobile(text.replace(/\D/g, "").slice(0, 10))}
          keyboardType="phone-pad"
          placeholder="98765 43210"
          error={fields.mobile}
          maxLength={10}
        />
        <Field
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          error={fields.email}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    marginTop: 12,
    marginBottom: 28,
    gap: 10,
  },
  word: {
    color: "#667085",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
});
