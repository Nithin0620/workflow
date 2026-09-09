import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  Search,
  ArrowLeft,
  X,
  FolderKanban,
  Layers,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { SearchResultItem } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function WorkspaceSearch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q || !id) {
      setResults([]);
      setSearched(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.search.workspace(id, q);
        setResults(res.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, id]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Search Bar Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:bg-zinc-800"
        >
          <ArrowLeft size={18} color="#a1a1aa" />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5">
          <Search size={16} color="#71717a" className="mr-2" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects, issues, keys... (e.g. PROJ-12)"
            placeholderTextColor="#52525b"
            autoFocus
            className="flex-1 text-white text-sm ml-2"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} className="p-1">
              <X size={14} color="#71717a" />
            </Pressable>
          )}
        </View>

        {searching ? (
          <ActivityIndicator size="small" color="#818cf8" className="ml-1" />
        ) : null}
      </View>

      <FlatList
        keyboardShouldPersistTaps="handled"
        data={results}
        keyExtractor={(r) => `${r.type}-${r.id}`}
        contentContainerClassName="p-5 gap-3"
        ListEmptyComponent={
          !query.trim() ? (
            <View className="items-center py-20 px-6">
              <View className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-3">
                <Search size={22} color="#71717a" />
              </View>
              <Text className="text-white text-base font-semibold mb-1">
                Spotlight Search
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs leading-relaxed">
                Type any keyword, issue title, or issue key to find items instantly.
              </Text>
            </View>
          ) : searched ? (
            <View className="items-center py-20 px-6">
              <Text className="text-white text-base font-semibold mb-1">
                No Results Found
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-xs">
                No projects or issues matching "{query.trim()}".
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: r, index }: { item: SearchResultItem; index: number }) => {
          const isProject = r.type === "project";
          const href: any = isProject
            ? `/(auth)/(tabs)/workspace/${id}/project/${r.id}`
            : `/(auth)/(tabs)/workspace/${id}/project/${r.projectId}/issue/${r.id}`;

          return (
            <Link href={href} asChild>
              <Animated.View entering={FadeInDown.delay(index * 60).duration(350).springify()} exiting={FadeOut.duration(200)}>
                <Card className="bg-zinc-950/90 border border-zinc-800/80 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3.5 flex-1">
                    <View className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
                      {isProject ? (
                        <FolderKanban size={16} color="#818cf8" />
                      ) : (
                        <Layers size={16} color="#38bdf8" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold text-sm tracking-tight" numberOfLines={1}>
                          {r.title}
                        </Text>
                        <Badge
                          label={isProject ? "Project" : "Issue"}
                          variant={isProject ? "purple" : "info"}
                          size="sm"
                          dot={false}
                        />
                      </View>
                      <Text className="text-zinc-400 text-xs font-mono mt-0.5" numberOfLines={1}>
                        {r.subtitle}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color="#71717a" />
                </View>
              </Card>
              </Animated.View>
            </Link>
          );
        }}
      />
    </SafeAreaView>
  );
}