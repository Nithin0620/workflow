import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/api";

const AUTH_TOKEN_KEY = "workflow_auth_token";
const AUTH_USER_KEY = "workflow_auth_user";

// In-memory fallback if AsyncStorage is unavailable
let memoryToken: string | null = null;
let memoryUser: User | null = null;

export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch {
    // Fallback to memory
  }
  return memoryToken;
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Memory token already set
  }
}

export async function removeAuthToken(): Promise<void> {
  memoryToken = null;
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Memory token already cleared
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as User;
    }
  } catch {
    // Fallback to memory
  }
  return memoryUser;
}

export async function setStoredUser(user: User): Promise<void> {
  memoryUser = user;
  try {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Memory user already set
  }
}

export async function clearAuth(): Promise<void> {
  memoryToken = null;
  memoryUser = null;
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  } catch {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // Memory already cleared
    }
  }
}
