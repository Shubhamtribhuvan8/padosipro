import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

export function Logo({ size = 52 }) {
  return (
    <Image
      source={require("../../assets/logo.png")}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      accessibilityLabel="PadosiPro"
    />
  );
}

export function BackButton({ onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress} style={styles.back} hitSlop={8}>
      <Feather name="chevron-left" size={18} color={colors.green} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export function OptionCard({ title, subtitle, icon, selected, onPress, badge }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {icon ? (
        <View style={[styles.icon, selected && styles.iconSelected]}>
          <Feather name={icon} size={16} color={colors.green} />
        </View>
      ) : null}
      <View style={styles.cardCopy}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Eyebrow({ children }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginBottom: 18,
    marginLeft: -4,
  },
  backText: {
    color: colors.green,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  cardSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.green,
  },
  cardPressed: {
    opacity: 0.92,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: {
    backgroundColor: colors.white,
  },
  cardCopy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  cardSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    color: "#B54708",
    backgroundColor: "#FFFAEB",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
});
