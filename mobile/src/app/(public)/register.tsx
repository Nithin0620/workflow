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

export default function Register() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : "Signup failed. Try again.";
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
              Create your account
            </Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Get started in seconds. No credit card required.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-neutral-700 text-sm font-medium mb-1.5">
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nithin"
                placeholderTextColor="#a3a3a3"
                autoCapitalize="words"
                autoComplete="name"
                className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5 text-base text-black"
              />
            </View>

            <View>
              <Text className="text-neutral-700 text-sm font-medium mb-1.5">
                Work Email
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
                placeholder="At least 6 characters"
                placeholderTextColor="#a3a3a3"
                secureTextEntry
                autoComplete="new-password"
                className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5 text-base text-black"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="bg-black rounded-lg py-3.5 items-center mt-2"
            >
              <Text className="text-white font-semibold text-sm">
                {loading ? "Creating account..." : "Create Account & Workspace"}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-8 gap-1">
            <Text className="text-neutral-500 text-sm">
              Already have an account?
            </Text>
            <Link href="/(public)/login" asChild>
              <Pressable>
                <Text className="text-black text-sm font-semibold underline">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
