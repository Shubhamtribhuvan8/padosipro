import { useState } from "react";
import { View } from "react-native";
import { request } from "../api";
import { Brand, ErrorBanner, Field, PrimaryButton, Screen, Subtitle, TextButton, Title } from "../components/ui";
import { validateRegister } from "../validate";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fields, setFields] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const nextFields = validateRegister({ email, password, confirmPassword });
    setFields(nextFields);
    setFormError("");
    if (Object.keys(nextFields).length) return;
    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      await request("/api/auth/register", {
        method: "POST",
        body: { email: normalized, password, confirmPassword },
      });
      navigation.replace("Verify", { email: normalized });
    } catch (error) {
      setFields(error.fields ?? {});
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <Title>Create your account</Title>
      <Subtitle>We'll send a 6-digit code to verify this email. It expires in 10 minutes.</Subtitle>
      <ErrorBanner message={formError} />
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        error={fields.email}
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="8+ characters, a letter and a number"
        error={fields.password}
      />
      <Field
        label="Confirm password"
        icon="lock"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Repeat your password"
        error={fields.confirmPassword}
      />
      <View style={{ height: 8 }} />
      <PrimaryButton label="Create account" onPress={onSubmit} loading={loading} />
      <TextButton label="Already have an account? Log in" onPress={() => navigation.navigate("Login")} />
    </Screen>
  );
}
