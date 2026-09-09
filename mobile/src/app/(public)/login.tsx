import { useState } from "react";
import { Link } from "expo-router";
import {
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : "Login failed. Try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-10 h-10 rounded-xl bg-black items-center justify-center mb-4">
              <Text className="text-white font-bold text-lg">W</Text>
            </View>
            <Text className="text-black text-2xl font-bold">
              Sign in to your account
            </Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Welcome back. Enter your credentials.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-neutral-700 text-sm font-medium mb-1.5">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                placeholderTextColor="#a3a3a3"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5 text-base text-black"
              />
            </View>

            <View>
              <Text className="text-neutral-700 text-sm font-medium mb-1.5">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#a3a3a3"
                secureTextEntry
                autoComplete="password"
                className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5 text-base text-black"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="bg-black rounded-lg py-3.5 items-center mt-2"
            >
              <Text className="text-white font-semibold text-sm">
                {loading ? "Signing in..." : "Sign in to Workflow"}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-neutral-500 text-sm">
              Don't have an account?
            </Text>
            <Link href="/(public)/register" asChild>
              <Pressable>
                <Text className="text-black text-sm font-semibold underline">
                  Create one
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
