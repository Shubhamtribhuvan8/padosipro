import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { request } from "../api";
import { useAuth } from "../auth";
import { Eyebrow } from "../components/chrome";
import { LoadingState, Screen } from "../components/ui";
import { firstName, greeting, relativeTime, shortCategory } from "../format";
import { useToast } from "../toast";
import { colors, fonts } from "../theme";

export default function HomeScreen({ navigation }) {
  const { token, me, refresh } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextCatalogue] = await Promise.all([
        request("/api/catalogue", { token }),
        refresh(),
      ]);
      setCatalogue(nextCatalogue.categories);
    } catch (error) {
      toast(error.message, "error");
    }
  }, [token, refresh, toast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const requests = me?.requests ?? [];
  const needle = query.trim().toLowerCase();
  const categories = (catalogue ?? []).filter((category) => {
    if (!needle) return true;
    const hay = `${category.name} ${category.blurb} ${category.services.map((service) => service.name).join(" ")}`.toLowerCase();
    return hay.includes(needle);
  });

  if (!catalogue) {
    return (
      <Screen>
        <LoadingState label="Loading your home" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <View style={styles.header}>
        <Text style={styles.hello}>
          {greeting()}, {firstName(me?.profile, me?.user?.email)}
        </Text>
        <Pressable accessibilityLabel="Account" onPress={() => navigation.navigate("Account")} style={styles.account}>
          <Feather name="user" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {requests.length ? (
        <>
          <Eyebrow>{requests.length === 1 ? "YOUR REQUEST" : "YOUR REQUESTS"}</Eyebrow>
          {requests.slice(0, 3).map((item) => (
            <Pressable key={item.id} style={styles.request} onPress={() => navigation.navigate("Request", { id: item.id })}>
              <View style={styles.requestCopy}>
                <Text style={styles.requestTitle}>{shortCategory(item.categoryName)}</Text>
                <Text style={styles.requestBody}>We are looking at it</Text>
                <Text style={styles.requestMeta}>Updated {relativeTime(item.updatedAt)}</Text>
              </View>
              <Text style={styles.view}>View ›</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={styles.prompt}>What do you need help with?</Text>
      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="AC leaking, cook for weekends..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <Eyebrow>EXPLORE</Eyebrow>
      <View style={styles.chips}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.chip}
            onPress={() => navigation.navigate("Services", { category })}
          >
            <Feather name={safeIcon(category.icon)} size={14} color={colors.green} />
            <Text style={styles.chipText}>{category.name}</Text>
            {category.soon ? <Text style={styles.soon}>Soon</Text> : null}
          </Pressable>
        ))}
      </View>
      {!categories.length ? <Text style={styles.empty}>No matches. Try another word.</Text> : null}

      <Pressable onPress={() => navigation.navigate("Categories", { categories: catalogue })} style={styles.browse}>
        <Text style={styles.browseText}>Browse everything we do</Text>
        <Feather name="arrow-right" size={16} color={colors.green} />
      </Pressable>

      <View style={styles.lm}>
        <View>
          <Text style={styles.lmLabel}>Your Lifestyle Manager</Text>
          <Text style={styles.lmName}>Pilot LM</Text>
        </View>
        <View style={styles.chat}>
          <Feather name="message-circle" size={14} color={colors.green} />
          <Text style={styles.chatText}>Chat</Text>
        </View>
      </View>
    </Screen>
  );
}

function safeIcon(name) {
  const known = new Set([
    "file-text", "home", "map-pin", "heart", "users", "calendar", "briefcase", "wifi",
    "package", "coffee", "scissors", "sun", "layers", "book", "shield",
  ]);
  return known.has(name) ? name : "grid";
}

const styles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  hello: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  account: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  request: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestCopy: {
    flex: 1,
  },
  requestTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  requestBody: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  requestMeta: {
    marginTop: 6,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  view: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  prompt: {
    marginTop: 18,
    marginBottom: 12,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
  search: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  soon: {
    color: "#B54708",
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  empty: {
    marginTop: 8,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  browse: {
    marginTop: 16,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  browseText: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  lm: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lmLabel: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  lmName: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  chat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatText: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
});
