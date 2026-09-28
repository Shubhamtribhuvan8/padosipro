import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Brand, ErrorBanner, Field, Notice, PrimaryButton, Screen, Subtitle, TextButton, Title } from "../components/ui";
import { useAuth } from "../auth";
import { ApiError } from "../api";
import { colors, fonts } from "../theme";
import { validateLogin } from "../validate";

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const notice = route.params?.notice ?? "";

  async function onSubmit() {
    const nextFields = validateLogin({ email, password });
    setFields(nextFields);
    setFormError("");
    if (Object.keys(nextFields).length) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setFields(apiError?.fields ?? {});
      setFormError(error.message);
      if (apiError?.code === "EMAIL_NOT_VERIFIED") {
        navigation.navigate("Verify", { email: email.trim().toLowerCase(), resend: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Brand />
      <Title>Welcome</Title>
      <Subtitle>Sign in with the email you verified.</Subtitle>
      <Notice message={notice} />
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
        autoComplete="password"
        placeholder="Your password"
        error={fields.password}
      />
      <View style={styles.gap} />
      <PrimaryButton label="Log in" onPress={onSubmit} loading={loading} />
      <TextButton label="New here? Create an account" onPress={() => navigation.navigate("Register")} />
      <Text style={styles.footnote}>A calmer way to get things handled.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: 8 },
  footnote: {
    marginTop: 28,
    textAlign: "center",
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});
