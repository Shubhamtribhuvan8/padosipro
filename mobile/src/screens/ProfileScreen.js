import { useState } from "react";
import { View } from "react-native";
import { request } from "../api";
import { useAuth } from "../auth";
import { Brand, ErrorBanner, Field, PrimaryButton, Screen, Subtitle, Title } from "../components/ui";
import { validateProfile } from "../validate";

export default function ProfileScreen() {
  const { token, me, setMe } = useAuth();
  const profile = me?.profile;
  const [name, setName] = useState(profile?.name ?? "");
  const [mobile, setMobile] = useState(profile?.mobile ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [fields, setFields] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const nextFields = validateProfile({ name, mobile, address, businessName });
    setFields(nextFields);
    setFormError("");
    if (Object.keys(nextFields).length) return;
    setLoading(true);
    try {
      const next = await request("/api/profile", {
        method: "PUT",
        token,
        body: {
          name: name.trim(),
          mobile: mobile.replace(/\s+/g, ""),
          address: address.trim(),
          businessName: businessName.trim(),
        },
      });
      setMe(next);
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
      <Title>A few details</Title>
      <Subtitle>So your Lifestyle Manager can coordinate visits and deliveries smoothly.</Subtitle>
      <ErrorBanner message={formError} />
      <Field
        label="Name"
        icon="user"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        placeholder="Your name"
        error={fields.name}
      />
      <Field
        label="Mobile number"
        icon="phone"
        prefix="+91"
        value={mobile}
        onChangeText={(text) => setMobile(text.replace(/\D/g, "").slice(0, 10))}
        keyboardType="phone-pad"
        placeholder="98765 43210"
        error={fields.mobile}
      />
      <Field
        label="Address"
        icon="map-pin"
        value={address}
        onChangeText={setAddress}
        placeholder="Flat, building, area"
        multiline
        error={fields.address}
      />
      <Field
        label="Business name (optional)"
        icon="briefcase"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Leave blank for a household"
        error={fields.businessName}
      />
      <View style={{ height: 8 }} />
      <PrimaryButton label="Save and continue" onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
