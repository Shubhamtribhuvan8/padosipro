import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { request } from "../api";
import { useAuth } from "../auth";
import { BackButton } from "../components/chrome";
import { LoadingState, Screen } from "../components/ui";
import { formatDate } from "../format";
import { useToast } from "../toast";
import { colors, fonts } from "../theme";

export default function RequestScreen({ navigation, route }) {
  const { token } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState(null);

  useEffect(() => {
    let alive = true;
    request(`/api/requests/${route.params.id}`, { token })
      .then((result) => {
        if (alive) setItem(result.request);
      })
      .catch((error) => toast(error.message, "error"));
    return () => {
      alive = false;
    };
  }, [route.params.id, token, toast]);

  if (!item) {
    return (
      <Screen>
        <LoadingState label="Opening request" />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>{item.categoryName}</Text>
      <View style={styles.status}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>Pending</Text>
      </View>
      <Text style={styles.lm}>Pilot LM is handling this for you.</Text>
      <Text style={styles.details}>{item.details}</Text>
      <Text style={styles.meta}>
        Requested {formatDate(item.createdAt)} · Updated {formatDate(item.updatedAt)}
      </Text>
      <Text style={styles.activity}>Activity</Text>
      <View style={styles.row}>
        <View style={styles.bullet} />
        <View>
          <Text style={styles.event}>Created · Pending</Text>
          <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  status: {
    alignSelf: "flex-start",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.green,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  lm: {
    marginTop: 16,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  details: {
    marginTop: 14,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    marginTop: 8,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  activity: {
    marginTop: 28,
    marginBottom: 12,
    color: "#B54708",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  bullet: {
    marginTop: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  event: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
});
