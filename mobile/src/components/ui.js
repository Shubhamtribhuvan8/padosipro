import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors, fonts } from "../theme";

export function Screen({ children, footer, refreshing = false, onRefresh }) {
  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.sheet}>
        <StatusBar style="dark" />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, footer ? styles.scrollWithFooter : null]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

export function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.logo}>
        <Feather name="home" size={18} color={colors.white} />
      </View>
      <Text style={styles.wordmark}>PadosiPro</Text>
    </View>
  );
}

export function Title({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Field({ label, error, icon, prefix, multiline, style, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon ? <Feather name={icon} size={16} color={colors.muted} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, multiline && styles.inputTextMultiline, style]}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled }) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !inactive && styles.buttonPressed,
        inactive && styles.buttonIdle,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

export function TextButton({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Feather name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function Notice({ message }) {
  if (!message) return null;
  return (
    <View style={styles.notice}>
      <Feather name="check-circle" size={16} color={colors.green} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export function OtpInput({ value, onChange }) {
  return (
    <View style={styles.otpWrap}>
      <View style={styles.otpRow} pointerEvents="none">
        {Array.from({ length: 6 }, (_, index) => {
          const active = value.length === index || (value.length === 6 && index === 5);
          return (
            <View key={index} style={[styles.otpCell, active && styles.otpCellActive]}>
              <Text style={styles.otpDigit}>{value[index] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        maxLength={6}
        autoFocus
        caretHidden
        style={styles.otpCapture}
        accessibilityLabel="Enter 6-digit code"
      />
    </View>
  );
}

export function LoadingState({ label = "Loading" }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator color={colors.green} size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyMark}>
        <Feather name="inbox" size={20} color={colors.green} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
      {actionLabel ? <TextButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.shell,
    alignItems: "center",
  },
  sheet: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    flexGrow: 1,
  },
  scrollWithFooter: {
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  brand: {
    marginTop: 8,
    marginBottom: 28,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    marginTop: 10,
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  inputRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputMultiline: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: colors.green,
  },
  inputError: {
    borderColor: colors.danger,
  },
  prefix: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputTextMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  fieldError: {
    marginTop: 6,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    backgroundColor: colors.greenPressed,
  },
  buttonIdle: {
    backgroundColor: colors.sage,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  textButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  textButtonLabel: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  banner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerLine,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  notice: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.greenSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    color: colors.green,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  otpWrap: {
    marginBottom: 8,
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
  },
  otpCell: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderColor: colors.green,
  },
  otpDigit: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 22,
  },
  otpCapture: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
    fontSize: 16,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 8,
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
});
