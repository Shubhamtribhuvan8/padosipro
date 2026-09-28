import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "./theme";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = useCallback((message, tone = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setToast(null);
      });
    }, 2800);
  }, [opacity]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: insets.top + 12, opacity },
            toast.tone === "error" ? styles.error : styles.success,
          ]}
        >
          <Feather
            name={toast.tone === "error" ? "alert-circle" : "check-circle"}
            size={16}
            color={toast.tone === "error" ? colors.danger : colors.green}
          />
          <Text style={[styles.text, toast.tone === "error" && styles.errorText]}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    alignSelf: "center",
    maxWidth: 400,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  success: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerLine,
  },
  text: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
  },
});
