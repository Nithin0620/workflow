import { Link } from "expo-router";
import { Text, View, ScrollView, Pressable } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeInView } from "@/components/ui/FadeInView";
import { useReduceMotion } from "@/lib/use-reduce-motion";

const features = [
  {
    title: "Fractional Kanban Engine",
    desc: "Drag-and-drop with fractional indexing. Reorder without limits.",
  },
  {
    title: "Real-time Collaboration",
    desc: "See changes as they happen. No refresh needed.",
  },
  {
    title: "Sprint Cycles",
    desc: "Plan, track, and ship with built-in sprint management.",
  },
  {
    title: "Command Palette",
    desc: "Keyboard-first navigation. Access anything in milliseconds.",
  },
  {
    title: "Multi-Project Management",
    desc: "Organize work across projects with custom issue keys.",
  },
  {
    title: "RBAC Security",
    desc: "Role-based access control at workspace and project level.",
  },
];

export default function Landing() {
  const reduceMotion = useReduceMotion();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
              <Text className="text-black font-bold text-sm">W</Text>
            </View>
            <Text className="text-white font-semibold text-lg">Workflow</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Link href="/(public)/login" asChild>
              <Pressable>
                <Text className="text-neutral-400 text-sm font-medium">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Hero */}
        <View className="px-6 pt-16 pb-20 items-center">
          <FadeInView className="flex-row items-center gap-2 bg-neutral-900 rounded-full px-4 py-2 mb-8">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <Text className="text-neutral-400 text-xs font-mono">
              BUILT FOR HIGH-VELOCITY TEAMS
            </Text>
          </FadeInView>

          <FadeInView delay={80}>
            <Text className="text-white text-4xl font-extrabold text-center leading-tight mb-4">
              The real-time workspace for modern engineering.
            </Text>
          </FadeInView>

          <FadeInView delay={160}>
            <Text className="text-neutral-400 text-base text-center leading-relaxed mb-10 max-w-md">
              Manage issues, sprint cycles, and cross-team roadmaps with
              keyboard-first speed, instant drag-and-drop Kanban, and real-time
              collaboration.
            </Text>
          </FadeInView>

          <Animated.View
            entering={reduceMotion ? undefined : ZoomIn.duration(400).delay(240).springify()}
            className="flex-row gap-3 w-full max-w-sm"
          >
            <Link href="/(public)/register" asChild>
              <Pressable className="flex-1 bg-white rounded-lg py-3.5 items-center">
                <Text className="text-black font-semibold text-sm">
                  Get Started Free
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>

        {/* Domain Hierarchy */}
        <View className="px-6 py-16 items-center bg-neutral-950">
          <FadeInView>
            <Text className="text-neutral-500 text-xs font-mono mb-6 tracking-wider">
              HIERARCHY
            </Text>
            <View className="flex-row items-center gap-3">
            {["Organization", "Workspace", "Project", "Issue"].map(
              (item, i) => (
                <View key={item} className="flex-row items-center gap-3">
                  <View className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
                    <Text className="text-white text-sm font-medium">
                      {item}
                    </Text>
                  </View>
                  {i < 3 && (
                    <Text className="text-neutral-600 text-lg">/</Text>
                  )}
                </View>
              )
            )}
          </View>
          </FadeInView>
        </View>

        {/* Features */}
        <View className="px-6 py-16">
          <FadeInView>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Everything you need to ship
            </Text>
            <Text className="text-neutral-500 text-sm text-center mb-10">
              One workspace for your entire engineering team.
            </Text>
          </FadeInView>

          <View className="gap-4">
            {features.map((f, i) => (
              <FadeInView key={f.title} delay={i * 60} duration={350}>
                <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <Text className="text-white font-semibold text-base mb-1">
                    {f.title}
                  </Text>
                  <Text className="text-neutral-400 text-sm leading-relaxed">
                    {f.desc}
                  </Text>
                </View>
              </FadeInView>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View className="px-6 py-16 items-center border-t border-neutral-800">
          <FadeInView>
            <Text className="text-white text-2xl font-bold text-center mb-3">
              Build and ship software with Workflow.
            </Text>
            <Text className="text-neutral-400 text-sm text-center mb-8">
              Free forever for small teams.
            </Text>
          </FadeInView>
          <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(400).springify()}>
            <Link href="/(public)/register" asChild>
              <Pressable className="bg-white rounded-lg px-8 py-3.5">
                <Text className="text-black font-semibold text-sm">
                  Get Started for Free
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 border-t border-neutral-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-md bg-white items-center justify-center">
                <Text className="text-black font-bold text-xs">W</Text>
              </View>
              <Text className="text-neutral-500 text-xs">
                Workflow &copy; 2026
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
