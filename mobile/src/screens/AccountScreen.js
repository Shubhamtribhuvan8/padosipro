import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { request } from "../api";
import { useAuth } from "../auth";
import { BackButton } from "../components/chrome";
import { Field, PrimaryButton, Screen } from "../components/ui";
import { useToast } from "../toast";
import { colors, fonts } from "../theme";

export default function AccountScreen({ navigation }) {
  const { token, me, setMe, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(me?.profile?.name ?? "");
  const [address, setAddress] = useState(me?.profile?.address ?? "");
  const [businessName, setBusinessName] = useState(me?.profile?.businessName ?? "");
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const phone = me?.user?.mobile ? `+91 ${me.user.mobile}` : "";

  async function save() {
    setLoading(true);
    setFields({});
    try {
      const next = await request("/api/profile", {
        method: "PUT",
        token,
        body: { name, address, businessName },
      });
      setMe(next);
      toast("Account saved.");
    } catch (error) {
      if (error.fields) setFields(error.fields);
      toast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<PrimaryButton label="Save" onPress={save} loading={loading} disabled={name.trim().length < 2} />}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.kicker}>Signed in as</Text>
        <Text style={styles.phone}>{phone}</Text>
        <Text style={styles.email}>{me?.user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Your LM</Text>
        <Text style={styles.strong}>Pilot LM</Text>
        <Text style={styles.line}>Mumbai</Text>
      </View>

      <Field label="Name" value={name} onChangeText={setName} error={fields.name} autoCapitalize="words" />
      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        error={fields.address}
        multiline
        placeholder="Society, road, flat"
      />
      <Field
        label="Business name (optional)"
        value={businessName}
        onChangeText={setBusinessName}
        error={fields.businessName}
        placeholder="Leave blank for a household"
      />
      <Text style={styles.hint}>Business name is optional. Most homes are not a business, so you can leave it blank.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Feather name="users" size={16} color={colors.green} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.strong}>Household</Text>
            <Text style={styles.line}>Family members your LM should know about</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.muted} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Wallet</Text>
        <Text style={styles.strong}>Coming soon</Text>
        <Text style={styles.line}>
          Wallet top-up isn't turned on yet. Your Lifestyle Manager can still handle requests and send you the bill directly in the meantime.
        </Text>
      </View>

      <Pressable
        onPress={logout}
        style={styles.signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 30,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  kicker: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  phone: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  email: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  strong: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  line: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: -6,
    marginBottom: 16,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  signOut: {
    alignSelf: "center",
    paddingVertical: 16,
  },
  signOutText: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
