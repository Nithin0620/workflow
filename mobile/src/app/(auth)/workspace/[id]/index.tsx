import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useState, useEffect, useCallback } from "react";
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
  FolderKanban,
  MessagesSquare,
  Palette,
  BarChart3,
  Search,
  Users,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { Workspace, Project } from "@/types/api";
import { Header } from "@/components/ui/Header";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SkeletonHero, SkeletonCard } from "@/components/ui/Skeleton";

export default function WorkspaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [wsRes, projRes] = await Promise.all([
        api.workspaces.get(id),
        api.projects.list(id),
      ]);
      setWorkspace(wsRes.workspace);
      setProjects(projRes.projects || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load workspace.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title={workspace?.name || "Workspace"}
        subtitle={workspace?.slug ? `@${workspace.slug}` : undefined}
        showBack
      />

      {loading ? (
        <View className="p-5 gap-4">
          <SkeletonHero />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-rose-400 text-sm text-center mb-4">{error}</Text>
          <Pressable
            onPress={load}
            className="bg-white rounded-xl px-6 py-2.5 active:bg-zinc-200"
          >
            <Text className="text-black font-semibold text-sm">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerClassName="p-5 pb-16 gap-3.5"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
          ListHeaderComponent={
            <View className="gap-5 mb-3">
              {/* Workspace Hero */}
              <Animated.View entering={SlideInUp.duration(500).springify()}>
                <LinearGradient
                  colors={["rgba(99, 102, 241, 0.2)", "rgba(24, 24, 27, 0.4)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-3xl border border-indigo-500/20 p-5"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 items-center justify-center">
                        <Sparkles size={16} color="#818cf8" />
                      </View>
                      <Text className="text-white text-xl font-bold tracking-tight">
                        {workspace?.name}
                      </Text>
                    </View>
                    {workspace?.role && (
                      <Badge label={workspace.role} variant="purple" size="sm" />
                    )}
                  </View>

                  {workspace?.description ? (
                    <Text className="text-zinc-300 text-xs leading-relaxed mb-4">
                      {workspace.description}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center gap-4 pt-3 border-t border-zinc-800/60">
                    <View className="flex-row items-center gap-1.5">
                      <FolderKanban size={13} color="#9ca3af" />
                      <Text className="text-zinc-400 text-xs">
                        {projects.length} {projects.length === 1 ? "project" : "projects"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Users size={13} color="#9ca3af" />
                      <Text className="text-zinc-400 text-xs">
                        {workspace?._count?.members ?? 0} members
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Module Nav Grid */}
              <Animated.View entering={FadeInDown.delay(150).duration(400).springify()} className="gap-2">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
                  Workspace Modules
                </Text>

                <View className="flex-row flex-wrap justify-between gap-2.5">
                  {[
                    { label: "Discussions", sub: `${workspace?._count?.discussionChannels ?? 0} channels`, icon: MessagesSquare, color: "indigo", href: "discussions" },
                    { label: "Whiteboards", sub: "Visual canvases", icon: Palette, color: "purple", href: "whiteboards" },
                    { label: "Analytics", sub: "Sprint velocity", icon: BarChart3, color: "emerald", href: "analytics" },
                    { label: "Search", sub: "Find issues", icon: Search, color: "sky", href: "search" },
                  ].map((mod, i) => (
                    <Animated.View
                      key={mod.label}
                      entering={FadeInDown.delay(200 + i * 60).duration(400).springify()}
                      className="w-[48%]"
                    >
                      <Link href={`/(auth)/workspace/${workspace?.id}/${mod.href}` as any} asChild>
                        <Pressable className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 active:bg-zinc-900">
                          <View className={`w-9 h-9 rounded-xl bg-${mod.color}-950/60 border border-${mod.color}-800/40 items-center justify-center mb-2.5`}>
                            <mod.icon size={17} color={mod.color === "indigo" ? "#818cf8" : mod.color === "purple" ? "#c084fc" : mod.color === "emerald" ? "#34d399" : "#38bdf8"} />
                          </View>
                          <Text className="text-white font-semibold text-sm">{mod.label}</Text>
                          <Text className="text-zinc-400 text-[11px] mt-0.5">{mod.sub}</Text>
                        </Pressable>
                      </Link>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Projects List Header */}
              <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} className="flex-row items-center justify-between mt-1 px-1">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Active Projects ({projects.length})
                </Text>
              </Animated.View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-12 px-6 bg-zinc-950 rounded-2xl border border-zinc-900">
              <Text className="text-white text-base font-semibold mb-1">
                No Projects Yet
              </Text>
              <Text className="text-zinc-400 text-xs text-center">
                Create a project from the web dashboard to start tracking issues.
              </Text>
            </View>
          }
          renderItem={({ item: p, index }: { item: Project; index: number }) => (
            <Animated.View entering={FadeInDown.delay(450 + index * 80).duration(400).springify()}>
              <Card
                onPress={() => {
                  if (workspace?.id) {
                    router.push(`/(auth)/workspace/${workspace.id}/project/${p.id}` as any);
                  }
                }}
                className="bg-zinc-950/90 border border-zinc-800/80 p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3.5 flex-1">
                    <View className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
                      <Text className="text-indigo-400 font-bold text-xs">
                        {p.key || p.name.substring(0, 3).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base tracking-tight" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text className="text-zinc-400 text-xs mt-0.5">
                        {p.key} · {p._count?.issues ?? 0} issues
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color="#71717a" />
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
