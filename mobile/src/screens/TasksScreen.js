import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { request } from "../api";
import { useAuth } from "../auth";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  PrimaryButton,
  Screen,
  Subtitle,
  TextButton,
  Title,
} from "../components/ui";
import { colors, fonts } from "../theme";

export default function TasksScreen() {
  const navigation = useNavigation();
  const { token, me, setMe } = useAuth();
  const editing = navigation.canGoBack();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(() => new Set((me?.selectedTasks ?? []).map((task) => task.id)));
  const [query, setQuery] = useState("");
  const [step, setStep] = useState("pick");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const result = await request("/api/tasks", { token });
      setCategories(result.categories ?? []);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        tasks: category.tasks.filter((task) => {
          if (!needle) return true;
          return (
            task.name.toLowerCase().includes(needle) ||
            task.description.toLowerCase().includes(needle) ||
            category.name.toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((category) => category.tasks.length > 0);
  }, [categories, query]);

  const chosen = useMemo(() => {
    const rows = [];
    for (const category of categories) {
      for (const task of category.tasks) {
        if (selected.has(task.id)) rows.push({ ...task, categoryName: category.name });
      }
    }
    return rows;
  }, [categories, selected]);

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      const next = await request("/api/tasks/selection", {
        method: "PUT",
        token,
        body: { taskIds: [...selected] },
      });
      setMe(next);
      if (editing) navigation.navigate("Home");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <Screen>
        <LoadingState label="Loading tasks" />
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen>
        <Title>Tasks</Title>
        <Subtitle>We could not load the catalogue.</Subtitle>
        <ErrorBanner message={error} />
        <PrimaryButton label="Try again" onPress={load} />
      </Screen>
    );
  }

  if (step === "confirm") {
    return (
      <Screen
        footer={
          <View style={styles.footerStack}>
            <ErrorBanner message={error} />
            <PrimaryButton label="Confirm tasks" onPress={confirm} loading={saving} />
            <TextButton label="Back to tasks" onPress={() => setStep("pick")} />
          </View>
        }
      >
        <Title>Confirm your tasks</Title>
        <Subtitle>Your Lifestyle Manager will start from this list. You can change it later.</Subtitle>
        {chosen.map((task) => (
          <View key={task.id} style={styles.confirmCard}>
            <Text style={styles.category}>{task.categoryName}</Text>
            <Text style={styles.taskName}>{task.name}</Text>
            <Text style={styles.taskBody}>{task.description}</Text>
          </View>
        ))}
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={selected.size ? `Review ${selected.size} selected` : "Pick at least one"}
          disabled={selected.size === 0}
          onPress={() => setStep("confirm")}
        />
      }
    >
      {editing ? <TextButton label="Back" onPress={() => navigation.goBack()} /> : null}
      <Title>What should we handle?</Title>
      <Subtitle>Pick any that apply. You can change this whenever.</Subtitle>
      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setQuery("")}>
            <Feather name="x" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {visible.length === 0 ? (
        <EmptyState
          title="No matches"
          message="Try a different name or category."
          actionLabel="Clear search"
          onAction={() => setQuery("")}
        />
      ) : (
        visible.map((category) => (
          <View key={category.id} style={styles.section}>
            <Text style={styles.category}>{category.name}</Text>
            {category.tasks.map((task) => {
              const on = selected.has(task.id);
              return (
                <Pressable
                  key={task.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggle(task.id)}
                  style={[styles.task, on && styles.taskOn]}
                >
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on ? <Feather name="check" size={14} color={colors.white} /> : null}
                  </View>
                  <View style={styles.taskCopy}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskBody}>{task.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 18,
  },
  category: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  task: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  taskOn: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D0D5DD",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  taskCopy: { flex: 1 },
  taskName: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  taskBody: {
    marginTop: 4,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 10,
  },
  footerStack: { gap: 4 },
});
