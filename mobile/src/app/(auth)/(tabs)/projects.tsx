import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  FolderKanban,
  Layers,
  Users,
  ChevronRight,
  Plus,
  Lock,
  Globe,
  SlidersHorizontal,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { Workspace, Project } from "@/types/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/ui/Header";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ProjectsTab() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await api.workspaces.list();
      const ws = res.workspaces || [];
      setWorkspaces(ws);
      if (ws.length > 0 && !selectedWsId) {
        setSelectedWsId(ws[0].id);
      }
    } catch (e) {
      console.log("[ProjectsTab] Load ws error:", e);
    }
  }, [selectedWsId]);

  const loadProjects = useCallback(async (wsId: string) => {
    try {
      setLoading(true);
      const res = await api.projects.list(wsId);
      setProjects(res.projects || []);
    } catch (e) {
      console.log("[ProjectsTab] Load projects error:", e);
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (selectedWsId) {
      loadProjects(selectedWsId);
    } else {
      setLoading(false);
    }
  }, [selectedWsId, loadProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedWsId) {
      loadProjects(selectedWsId);
    } else {
      loadWorkspaces();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title="Projects"
        subtitle={selectedWsId ? workspaces.find((w) => w.id === selectedWsId)?.name : "All Projects"}
      />

      {/* Workspace Filter Chips */}
      {workspaces.length > 1 && (
        <View className="py-2.5 px-4 border-b border-zinc-900 bg-zinc-950">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={workspaces}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2"
            renderItem={({ item: w }) => {
              const isSelected = w.id === selectedWsId;
              return (
                <Pressable
                  onPress={() => setSelectedWsId(w.id)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-white border-white"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-black" : "text-zinc-400"
                    }`}
                  >
                    {w.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View className="p-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerClassName="p-5 pb-12 gap-3.5"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6 bg-zinc-950/60 rounded-3xl border border-zinc-900">
              <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center mb-3">
                <FolderKanban size={22} color="#71717a" />
              </View>
              <Text className="text-white text-base font-semibold mb-1">
                No Projects in this Workspace
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                Create your first project on the web app to organize tasks and sprint cycles.
              </Text>
            </View>
          }
          renderItem={({ item: p, index }: { item: Project; index: number }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 80).duration(400).springify()}
              exiting={FadeOut.duration(200)}
              layout={undefined}
            >
              <Card
                onPress={() => {
                  if (selectedWsId) {
                    router.push(`/(auth)/workspace/${selectedWsId}/project/${p.id}` as any);
                  }
                }}
                className="bg-zinc-950/90 border border-zinc-800/80 p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
                      <Text className="text-indigo-400 font-bold text-xs">
                        {p.key || p.name.substring(0, 3).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold text-base tracking-tight" numberOfLines={1}>
                          {p.name}
                        </Text>
                        {p.isPrivate ? (
                          <Lock size={12} color="#71717a" />
                        ) : (
                          <Globe size={12} color="#52525b" />
                        )}
                      </View>
                      <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                        {p.description || "No description provided"}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color="#71717a" />
                </View>

                {/* Project Stats Row */}
                <View className="flex-row items-center gap-4 mt-3.5 pt-3 border-t border-zinc-900">
                  <View className="flex-row items-center gap-1.5">
                    <Layers size={13} color="#9ca3af" />
                    <Text className="text-zinc-400 text-xs">
                      {p._count?.issues ?? 0} {p._count?.issues === 1 ? "issue" : "issues"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Users size={13} color="#9ca3af" />
                    <Text className="text-zinc-400 text-xs">
                      {p._count?.members ?? 0} {p._count?.members === 1 ? "member" : "members"}
                    </Text>
                  </View>
                  <View className="ml-auto">
                    <Badge
                      label={p.key || "PROJECT"}
                      variant="neutral"
                      size="sm"
                      dot={false}
                    />
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
