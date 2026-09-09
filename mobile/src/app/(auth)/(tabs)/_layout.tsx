import { Tabs } from "expo-router";
import { View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LayoutGrid, FolderKanban, MessagesSquare, Settings } from "lucide-react-native";

function AnimatedIcon({
  color,
  focused,
  Icon,
}: {
  color: string;
  focused: boolean;
  Icon: typeof LayoutGrid;
}) {
  const scale = useSharedValue(focused ? 1 : 0);

  scale.value = withSpring(focused ? 1 : 0, {
    damping: 12,
    stiffness: 180,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + scale.value * 0.15 }],
  }));

  return (
    <View className="items-center justify-center">
      <Animated.View style={animatedStyle}>
        <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#71717a",
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#27272a",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: (props) => (
            <AnimatedIcon {...props} color={String(props.color)} Icon={LayoutGrid} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: (props) => (
            <AnimatedIcon {...props} color={String(props.color)} Icon={FolderKanban} />
          ),
        }}
      />
      <Tabs.Screen
        name="discussions"
        options={{
          title: "Discussions",
          tabBarIcon: (props) => (
            <AnimatedIcon {...props} color={String(props.color)} Icon={MessagesSquare} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: (props) => (
            <AnimatedIcon {...props} color={String(props.color)} Icon={Settings} />
          ),
        }}
      />

      {/* Sub-routes nested inside tabs so the bottom bar remains visible across the workspace */}
      <Tabs.Screen name="workspace/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/analytics" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/search" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/project/[projectId]/index" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/project/[projectId]/issue/[issueId]" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/project/[projectId]/issue/new" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/discussions/index" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/discussions/[channelId]" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/whiteboards/index" options={{ href: null }} />
      <Tabs.Screen name="workspace/[id]/whiteboards/[whiteboardId]" options={{ href: null }} />
    </Tabs>
  );
}
