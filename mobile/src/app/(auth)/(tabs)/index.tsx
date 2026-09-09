import { useState, useEffect, useCallback } from "react";
import { Link, useRouter } from "expo-router";
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, SlideInUp } from "react-native-reanimated";
import {
  Sparkles,
  Bell,
  Search,
  Plus,
  FolderKanban,
  Users,
  ChevronRight,
  Briefcase,
  Layers,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Workspace } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SkeletonCard, SkeletonHero } from "@/components/ui/Skeleton";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const load = useCallback(async () => {
    try {
      const [wsRes, notifRes] = await Promise.allSettled([
        api.workspaces.list(),
        api.notifications.list(),
      ]);

      if (wsRes.status === "fulfilled") {
        setWorkspaces(wsRes.value.workspaces || []);
      }
      if (notifRes.status === "fulfilled") {
        setUnreadNotifications(notifRes.value.unreadCount || 0);
      }
    } catch (e) {
      console.log("[Home] Load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const totalProjects = workspaces.reduce((acc, w) => acc + (w._count?.projects ?? 0), 0);
  const totalMembers = workspaces.reduce((acc, w) => acc + (w._count?.members ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80">
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center">
            <Sparkles size={16} color="#818cf8" />
          </View>
          <View>
            <Text className="text-white font-bold text-base tracking-tight">Workflow</Text>
            <Text className="text-zinc-400 text-[11px]">Workspace Hub</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Notifications Button */}
          <Link href="/(auth)/notifications" asChild>
            <Pressable
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}
              className="relative w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:bg-zinc-800"
            >
              <Bell size={17} color="#a1a1aa" />
              {unreadNotifications > 0 && (
                <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-black" />
              )}
            </Pressable>
          </Link>

          {/* User Avatar */}
          <Link href="/(auth)/(tabs)/settings" asChild>
            <Pressable>
              <Avatar name={user?.name || "User"} image={user?.image} size="sm" />
            </Pressable>
          </Link>
        </View>
      </View>

      <FlatList
        data={workspaces}
        keyExtractor={(w) => w.id}
        contentContainerClassName="p-5 pb-12 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#818cf8"
            colors={["#818cf8"]}
          />
        }
        ListHeaderComponent={
          <View className="gap-5 mb-2">
            {/* Welcome Card */}
            <Animated.View entering={SlideInUp.duration(500).springify()}>
              <LinearGradient
                colors={["rgba(79, 70, 229, 0.25)", "rgba(24, 24, 27, 0.4)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl border border-indigo-500/20 p-5 overflow-hidden"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                      Overview
                    </Text>
                    <Text className="text-white text-xl font-bold tracking-tight mt-0.5">
                      Hi, {user?.name?.split(" ")[0] || "there"} 👋
                    </Text>
                  </View>
                  <Badge label="Active Team" variant="success" size="sm" />
                </View>

                {/* Quick Metrics */}
                <View className="flex-row items-center justify-between pt-3 border-t border-zinc-800/60 mt-1">
                  <View className="flex-1">
                    <Text className="text-zinc-400 text-xs">Workspaces</Text>
                    <Text className="text-white text-lg font-bold mt-0.5">{workspaces.length}</Text>
                  </View>
                  <View className="w-[1px] h-7 bg-zinc-800" />
                  <View className="flex-1 items-center">
                    <Text className="text-zinc-400 text-xs">Projects</Text>
                    <Text className="text-white text-lg font-bold mt-0.5">{totalProjects}</Text>
                  </View>
                  <View className="w-[1px] h-7 bg-zinc-800" />
                  <View className="flex-1 items-end">
                    <Text className="text-zinc-400 text-xs">Team Members</Text>
                    <Text className="text-white text-lg font-bold mt-0.5">{totalMembers}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Section Header */}
            <Animated.View entering={FadeInDown.delay(150).duration(400).springify()} className="flex-row items-center justify-between mt-2">
              <Text className="text-white font-bold text-base tracking-tight">
                Your Workspaces
              </Text>
              <Text className="text-zinc-400 text-xs font-medium">
                {workspaces.length} total
              </Text>
            </Animated.View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="gap-4">
              <SkeletonHero />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View className="items-center justify-center py-16 px-6 bg-zinc-950/60 rounded-3xl border border-zinc-900">
              <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center mb-3">
                <Briefcase size={22} color="#71717a" />
              </View>
              <Text className="text-white text-base font-semibold mb-1">
                No Workspaces Found
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                Create a workspace on the web dashboard to start managing your projects, sprints, and issues.
              </Text>
            </View>
          )
        }
        renderItem={({ item: w, index }: { item: Workspace; index: number }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 80).duration(400).springify()}>
            <Card
              onPress={() => router.push(`/(auth)/(tabs)/workspace/${w.id}` as any)}
              className="bg-zinc-950/90 border border-zinc-800/80 p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3.5 flex-1">
                  <View className="w-11 h-11 rounded-2xl bg-gradient-to-br bg-zinc-800 border border-zinc-700/60 items-center justify-center shadow-sm">
                    <Text className="text-white font-bold text-base">
                      {w.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-semibold text-base tracking-tight" numberOfLines={1}>
                        {w.name}
                      </Text>
                      {w.role && (
                        <Badge
                          label={w.role}
                          variant={w.role === "OWNER" ? "purple" : "neutral"}
                          size="sm"
                        />
                      )}
                    </View>
                    <Text className="text-zinc-400 text-xs mt-1" numberOfLines={1}>
                      {w.description || `${w.slug} workspace`}
                    </Text>
                  </View>
                </View>

                <ChevronRight size={18} color="#71717a" />
              </View>

              {/* Workspace meta details */}
              <View className="flex-row items-center gap-4 mt-4 pt-3 border-t border-zinc-900/90">
                <View className="flex-row items-center gap-1.5">
                  <FolderKanban size={13} color="#9ca3af" />
                  <Text className="text-zinc-400 text-xs">
                    {w._count?.projects ?? 0} {w._count?.projects === 1 ? "project" : "projects"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Users size={13} color="#9ca3af" />
                  <Text className="text-zinc-400 text-xs">
                    {w._count?.members ?? 0} {w._count?.members === 1 ? "member" : "members"}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
