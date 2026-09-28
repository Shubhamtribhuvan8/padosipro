import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "padosipro.token";

export async function saveToken(token) {
  if (Platform.OS === "web") {
    localStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function loadToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

export async function clearToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
