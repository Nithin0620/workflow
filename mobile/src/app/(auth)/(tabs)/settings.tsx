import { useState } from "react";
import {
  Text,
  View,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  User,
  Bell,
  LogOut,
  Shield,
  Server,
  Sparkles,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/ui/Header";
import { GlowField } from "@/components/ui/GlowField";

export default function SettingsTab() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveName = async () => {
    const clean = name.trim();
    if (!clean || clean.length < 2) {
      Alert.alert("Invalid Name", "Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await api.profile.update({ name: clean });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      Alert.alert(
        "Update Failed",
        e instanceof ApiError ? e.message : "Could not update name."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header title="Settings" subtitle="Account & Preferences" />

      <ScrollView contentContainerClassName="p-5 pb-16 gap-5">
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <Card className="bg-zinc-950 border border-zinc-800/80 p-5">
            <View className="flex-row items-center gap-4 mb-5">
              <Avatar
                name={user?.name || "User"}
                image={user?.image}
                size="lg"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-lg tracking-tight" numberOfLines={1}>
                    {user?.name || "Workflow Member"}
                  </Text>
                </View>
                <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                  {user?.email || "No email available"}
                </Text>
                <View className="mt-2">
                  <Badge label="Authenticated" variant="success" size="sm" />
                </View>
              </View>
            </View>

            {/* Edit Display Name */}
            <View className="pt-4 border-t border-zinc-900">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Display Name
              </Text>
              <View className="flex-row items-center gap-2.5">
                <GlowField className="flex-1 bg-zinc-900/90 px-3.5 py-2.5">
                  {({ onFocus, onBlur }) => (
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      placeholder="Your full name"
                      placeholderTextColor="#52525b"
                      className="text-white text-sm"
                    />
                  )}
                </GlowField>
                <Button
                  label={saved ? "Saved" : "Save"}
                  onPress={saveName}
                  loading={saving}
                  size="sm"
                  icon={saved ? <Check size={14} color="#10b981" /> : undefined}
                  className={saved ? "border-emerald-800 bg-emerald-950/40 text-emerald-400" : "bg-white text-black"}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Nav Group */}
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="gap-2.5">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
            General
          </Text>

          <Link href="/(auth)/notifications" asChild>
            <Pressable className="flex-row items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 active:bg-zinc-900">
              <View className="flex-row items-center gap-3.5">
                <View className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
                  <Bell size={18} color="#a1a1aa" />
                </View>
                <View>
                  <Text className="text-white font-semibold text-sm">
                    Notifications
                  </Text>
                  <Text className="text-zinc-400 text-xs mt-0.5">
                    View mentions, assignments, and alerts
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#71717a" />
            </Pressable>
          </Link>
        </Animated.View>

        {/* System & Connection Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="gap-2.5">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
            Environment
          </Text>

          <Card className="bg-zinc-950 border border-zinc-800/80 p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <Server size={15} color="#71717a" />
                <Text className="text-zinc-300 text-xs">Backend API</Text>
              </View>
              <Badge label="REST v1 Active" variant="success" size="sm" />
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-zinc-900">
              <Text className="text-zinc-400 text-xs">App Version</Text>
              <Text className="text-zinc-300 text-xs font-mono">1.0.0 (Native)</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
          <Button
            label="Sign Out"
            variant="danger"
            size="lg"
            icon={<LogOut size={16} color="#f43f5e" />}
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure you want to log out of your account?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: logout },
              ]);
            }}
            className="mt-2"
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
