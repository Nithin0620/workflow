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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { GlowField } from "@/components/ui/GlowField";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Login failed. Please check your credentials.";
      Alert.alert("Authentication Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6 justify-center"
        >
          {/* Top Ambient Glow */}
          <View className="items-center mb-10">
            <LinearGradient
              colors={["rgba(99, 102, 241, 0.25)", "rgba(168, 85, 247, 0.05)", "transparent"]}
              className="absolute -top-16 w-72 h-44 rounded-full blur-3xl opacity-70"
            />

            {/* Logo */}
            <View className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700/80 items-center justify-center mb-5 shadow-lg shadow-indigo-500/10">
              <Sparkles size={24} color="#818cf8" />
            </View>

            <Text className="text-white text-3xl font-bold tracking-tight">
              Welcome back
            </Text>
            <Text className="text-zinc-400 text-sm mt-1.5 text-center">
              Sign in to access your projects and sprint boards
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800/80">
            {/* Email Input */}
            <View>
              <Text className="text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                Work Email
              </Text>
              <GlowField className="flex-row items-center bg-zinc-900/90 px-3.5 py-3">
              {({ onFocus, onBlur }) => (
                <>
                  <Mail size={18} color="#71717a" className="mr-2.5" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder="name@company.com"
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    className="flex-1 text-base text-white ml-2"
                  />
                </>
              )}
            </GlowField>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                Password
              </Text>
              <GlowField className="flex-row items-center bg-zinc-900/90 px-3.5 py-3">
              {({ onFocus, onBlur }) => (
                <>
                  <Lock size={18} color="#71717a" className="mr-2.5" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder="••••••••"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    className="flex-1 text-base text-white ml-2"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? (
                      <EyeOff size={18} color="#71717a" />
                    ) : (
                      <Eye size={18} color="#71717a" />
                    )}
                  </Pressable>
                </>
              )}
            </GlowField>
            </View>

            {/* Submit Button */}
            <Button
              label={loading ? "Signing in..." : "Continue with Email"}
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              className="mt-2 bg-indigo-600 border-indigo-500 text-white"
            />
          </View>

          {/* Footer Switch */}
          <View className="flex-row items-center justify-center mt-8 gap-1.5">
            <Text className="text-zinc-500 text-sm">
              Don't have an account?
            </Text>
            <Link href="/(public)/register" asChild>
              <Pressable>
                <Text className="text-indigo-400 text-sm font-semibold hover:underline">
                  Create one
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
