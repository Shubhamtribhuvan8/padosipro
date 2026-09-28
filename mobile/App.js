import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { AuthProvider, useAuth } from "./src/auth";
import { PrimaryButton, Screen } from "./src/components/ui";
import AccountScreen from "./src/screens/AccountScreen";
import { CategoriesScreen, DetailsScreen, ServicesScreen, SubmittedScreen, UrgencyScreen } from "./src/screens/FlowScreens";
import HomeScreen from "./src/screens/HomeScreen";
import OtpScreen from "./src/screens/OtpScreen";
import RequestScreen from "./src/screens/RequestScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import { ToastProvider } from "./src/toast";
import { colors, fonts } from "./src/theme";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer>
            <Root />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { token, status, bootError, retry } = useAuth();

  if (status === "booting") {
    return (
      <View style={styles.boot}>
        <Image source={require("./assets/logo.png")} style={styles.logo} />
        <Text style={styles.bootText}>PadosiPro</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <Screen>
        <Text style={styles.bootTitle}>We could not restore your session</Text>
        <Text style={styles.bootBody}>{bootError}</Text>
        <PrimaryButton label="Try again" onPress={retry} />
      </Screen>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {!token ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Services" component={ServicesScreen} />
          <Stack.Screen name="Urgency" component={UrgencyScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="Submitted" component={SubmittedScreen} />
          <Stack.Screen name="Request" component={RequestScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  bootText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  bootTitle: {
    marginTop: 24,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
  },
  bootBody: {
    marginTop: 8,
    marginBottom: 24,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
});
