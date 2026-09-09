import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, SlideInUp } from "react-native-reanimated";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  AlertTriangle,
  GitMerge,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { GetWorkspaceAnalyticsResponse } from "@/types/api";
import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonCard, SkeletonHero } from "@/components/ui/Skeleton";

const RANGES = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="bg-zinc-950 border border-zinc-800/80 p-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </Text>
        {icon}
      </View>
      <Text className="text-white text-2xl font-bold tracking-tight">{value}</Text>
    </Card>
  );
}

export default function Analytics() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<GetWorkspaceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(30);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.analytics.get(id, { timeRangeDays: range });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load workspace analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, range]);

  useEffect(() => {
    load();
  }, [load]);

  const switchRange = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRange(r);
    setLoading(true);
  };

  const k = data?.kpis;
  const maxDaily = Math.max(
    1,
    ...(data?.charts.dailyThroughput.map((d) => Math.max(d.created, d.completed)) ?? [1])
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        title="Analytics"
        subtitle={data?.workspace.name ? `${data.workspace.name} · Velocity` : "Metrics"}
        showBack
      />

      {loading && !data ? (
        <View className="p-5 gap-4">
          <SkeletonHero />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error && !data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-rose-400 text-sm text-center mb-4">{error}</Text>
          <Pressable
            onPress={load}
            className="bg-white rounded-xl px-6 py-2.5 active:bg-zinc-200"
          >
            <Text className="text-black font-semibold text-sm">Retry</Text>
          </Pressable>
        </View>
      ) : data && k ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-16 gap-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#818cf8"
              colors={["#818cf8"]}
            />
          }
        >
          {/* Time Range Selector */}
          <View className="flex-row items-center self-start bg-zinc-950 border border-zinc-800 rounded-2xl p-1 gap-1">
            {RANGES.map((r) => {
              const isSelected = range === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => switchRange(r.value)}
                  className={`px-3.5 py-1.5 rounded-xl ${
                    isSelected ? "bg-white" : "bg-transparent active:bg-zinc-900"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-black" : "text-zinc-400"
                    }`}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* KPI Grid */}
          <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="flex-row flex-wrap justify-between gap-3">
            <View className="w-[48%]">
              <Kpi
                label="Completion Rate"
                value={`${k.completionRate}%`}
                icon={<TrendingUp size={15} color="#10b981" />}
              />
            </View>
            <View className="w-[48%]">
              <Kpi
                label="Issues Done"
                value={`${k.doneIssues}/${k.totalIssues}`}
                icon={<CheckCircle2 size={15} color="#818cf8" />}
              />
            </View>
            <View className="w-[48%]">
              <Kpi
                label="Cycle Time"
                value={`${k.avgCycleTimeDays}d`}
                icon={<Clock size={15} color="#f59e0b" />}
              />
            </View>
            <View className="w-[48%]">
              <Kpi
                label="Story Points"
                value={`${k.completedStoryPoints}/${k.totalStoryPoints}`}
                icon={<Layers size={15} color="#38bdf8" />}
              />
            </View>
          </Animated.View>

          {/* Daily Throughput Chart Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
            <Card className="bg-zinc-950 border border-zinc-800/80 p-5">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white font-bold text-base tracking-tight">
                  Throughput Velocity
                </Text>
                <Text className="text-zinc-400 text-xs mt-0.5">
                  Created vs. Completed issues
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-indigo-500" />
                  <Text className="text-zinc-400 text-[11px]">Created</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-zinc-400 text-[11px]">Done</Text>
                </View>
              </View>
            </View>

            {/* Bar Visualizer */}
            <View className="flex-row items-end gap-[3px] h-28 pt-2">
              {data.charts.dailyThroughput.map((d) => (
                <View key={d.date} className="flex-1 flex-row items-end gap-[1px]">
                  <View
                    className="flex-1 bg-indigo-500/80 rounded-t-sm"
                    style={{ height: `${Math.max((d.created / maxDaily) * 100, 4)}%` }}
                  />
                  <View
                    className="flex-1 bg-emerald-500/80 rounded-t-sm"
                    style={{ height: `${Math.max((d.completed / maxDaily) * 100, 4)}%` }}
                  />
                </View>
              ))}
            </View>
          </Card>
          </Animated.View>

          {/* Member Workload */}
          {data.charts.memberWorkload.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="gap-2.5">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
                Team Workload
              </Text>
              <Card className="bg-zinc-950 border border-zinc-800/80 p-4 gap-3">
                {data.charts.memberWorkload.map((m) => (
                  <View
                    key={m.userId}
                    className="flex-row items-center justify-between py-2 border-b border-zinc-900 last:border-b-0"
                  >
                    <View className="flex-row items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <View>
                        <Text className="text-white text-sm font-semibold">
                          {m.name}
                        </Text>
                        <Text className="text-zinc-400 text-xs">
                          {m.openCount} open · {m.doneCount} completed
                        </Text>
                      </View>
                    </View>
                    <Badge
                      label={`${m.storyPoints} pts`}
                      variant="purple"
                      size="sm"
                      dot={false}
                    />
                  </View>
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Bottlenecks */}
          {data.bottlenecks.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} className="gap-2.5">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-1">
                Bottlenecks ({data.bottlenecks.length})
              </Text>
              <View className="gap-2">
                {data.bottlenecks.map((b) => (
                  <Card key={b.id} className="bg-zinc-950 border border-amber-900/40 p-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-indigo-400 font-mono text-xs font-bold">
                        {b.key}
                      </Text>
                      <Badge
                        label={`${b.daysInStatus}d stale`}
                        variant="warning"
                        size="sm"
                      />
                    </View>
                    <Text className="text-white text-sm font-semibold">
                      {b.title}
                    </Text>
                  </Card>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}