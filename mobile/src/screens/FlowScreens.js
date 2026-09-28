import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { request } from "../api";
import { useAuth } from "../auth";
import { BackButton, OptionCard } from "../components/chrome";
import { ErrorBanner, Field, PrimaryButton, Screen, Subtitle, Title } from "../components/ui";
import { validateDetails } from "../format";
import { useToast } from "../toast";
import { colors, fonts } from "../theme";

const URGENCIES = [
  { id: "standard", name: "Standard", description: "Within a few days is fine", icon: "calendar" },
  { id: "same-day", name: "Same day", description: "Today if possible", icon: "sun" },
  { id: "express", name: "Express", description: "As soon as you can", icon: "zap" },
  { id: "scheduled", name: "Scheduled", description: "I have a specific time", icon: "clock" },
];

export function CategoriesScreen({ navigation, route }) {
  const categories = route.params?.categories ?? [];
  const [selected, setSelected] = useState(null);
  return (
    <Screen
      footer={
        <PrimaryButton
          label="Continue"
          disabled={!selected}
          onPress={() => navigation.navigate("Services", { category: selected })}
        />
      }
    >
      <BackButton onPress={() => navigation.goBack()} />
      <Title>What do you need help with?</Title>
      <Subtitle>Pick a category, then choose a service. You can add details next.</Subtitle>
      {categories.map((item) => (
        <OptionCard
          key={item.id}
          title={item.name}
          subtitle={item.blurb}
          icon={item.icon}
          badge={item.soon ? "Soon" : null}
          selected={selected?.id === item.id}
          onPress={() => setSelected(item)}
        />
      ))}
    </Screen>
  );
}

export function ServicesScreen({ navigation, route }) {
  const { category } = route.params;
  const [selected, setSelected] = useState(null);
  return (
    <Screen
      footer={
        <PrimaryButton
          label="Continue"
          disabled={!selected}
          onPress={() => navigation.navigate("Urgency", { category, service: selected })}
        />
      }
    >
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.kicker}>{category.name}</Text>
      <Title>What kind of help?</Title>
      <Subtitle>{category.blurb}</Subtitle>
      {category.services.map((item) => (
        <OptionCard
          key={item.id}
          title={item.name}
          subtitle={item.description}
          selected={selected?.id === item.id}
          onPress={() => setSelected(item)}
        />
      ))}
    </Screen>
  );
}

export function UrgencyScreen({ navigation, route }) {
  const { category, service } = route.params;
  const [selected, setSelected] = useState(null);
  return (
    <Screen
      footer={
        <PrimaryButton
          label="Next"
          disabled={!selected}
          onPress={() => navigation.navigate("Details", { category, service, urgency: selected })}
        />
      }
    >
      <BackButton onPress={() => navigation.goBack()} />
      <Title>When do you need this?</Title>
      <Subtitle>Pick what feels closest. You can always add detail next.</Subtitle>
      {URGENCIES.map((item) => (
        <OptionCard
          key={item.id}
          title={item.name}
          subtitle={item.description}
          icon={item.icon}
          selected={selected?.id === item.id}
          onPress={() => setSelected(item)}
        />
      ))}
    </Screen>
  );
}

export function DetailsScreen({ navigation, route }) {
  const { category, service, urgency } = route.params;
  const { token } = useAuth();
  const toast = useToast();
  const [details, setDetails] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ready = details.trim().length >= 3;

  async function submit() {
    const next = validateDetails(details, urgency.id, scheduledFor);
    setFields(next);
    if (Object.keys(next).length) {
      toast(Object.values(next)[0], "error");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await request("/api/requests", {
        method: "POST",
        token,
        body: {
          categoryId: category.id,
          serviceId: service.id,
          urgency: urgency.id,
          details: details.trim(),
          scheduledFor: scheduledFor.trim(),
        },
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: "Home" },
          { name: "Submitted", params: { request: result.request } },
        ],
      });
    } catch (err) {
      setError(err.message);
      if (err.fields) setFields(err.fields);
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<PrimaryButton label="Leave it with us" onPress={submit} loading={loading} disabled={!ready} />}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.pill}>
        <Text style={styles.pillText}>{category.name}</Text>
      </View>
      <Title>Tell us a little more</Title>
      <Subtitle>One or two lines is enough. We'll take it from there.</Subtitle>
      <ErrorBanner message={error} />
      {urgency.id === "scheduled" ? (
        <Field
          label="When"
          value={scheduledFor}
          onChangeText={setScheduledFor}
          placeholder="Friday, 4 pm"
          error={fields.scheduledFor}
        />
      ) : null}
      <View style={[styles.note, fields.details && styles.noteError]}>
        <TextInput
          value={details}
          onChangeText={setDetails}
          multiline
          placeholder="e.g. AC in the guest room is leaking onto the floor"
          placeholderTextColor={colors.muted}
          style={styles.noteInput}
          maxLength={500}
        />
      </View>
      {fields.details ? <Text style={styles.fieldError}>{fields.details}</Text> : null}
    </Screen>
  );
}

export function SubmittedScreen({ navigation, route }) {
  const requestItem = route.params?.request;
  return (
    <Screen footer={<PrimaryButton label="Back to home" onPress={() => navigation.navigate("Home")} />}>
      <View style={styles.done}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Title>We're on it</Title>
        <Subtitle>
          Pilot LM has your request{requestItem ? ` for ${requestItem.serviceName}` : ""} and will handle the rest.
          You'll see updates on your home screen.
        </Subtitle>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 13,
    marginBottom: 8,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#FBF6E8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  pillText: {
    color: "#B54708",
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  note: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
  },
  noteError: {
    borderColor: colors.danger,
  },
  noteInput: {
    minHeight: 110,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  fieldError: {
    marginTop: 6,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  done: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkMark: {
    color: colors.green,
    fontSize: 20,
    fontFamily: fonts.semibold,
  },
});
