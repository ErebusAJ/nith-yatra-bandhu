"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import Taskbar from "./components/taskbar";

interface ChatGroup {
  id: string;
  name: string;
  memberCount: number;
  location: string;
  createdAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

const ChatGroupsScreen = () => {
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatGroups();
  }, []);

  const loadChatGroups = async () => {
    try {
      setLoading(true);
      const storedGroups = await AsyncStorage.getItem("chatGroups");
      const parsedGroups = storedGroups ? JSON.parse(storedGroups) : [];
      setChatGroups(parsedGroups);
    } catch (error) {
      console.error("Error loading chat groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (groupId: string) => {
    router.push({ pathname: "/chatRoom", params: { groupId } });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  const renderGuideCard = () => (
    <TouchableOpacity
      style={styles.guideCard}
      onPress={() => router.push("/Travelguide")}
    >
      <Ionicons
        name="person-add"
        size={28}
        color="#fff"
        style={styles.guideIcon}
      />
      <View>
        <Text style={styles.guideText}>Hire a Travel Guide</Text>
        <Text style={styles.guideSubText}>
          Get a local expert to assist your journey
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: ChatGroup }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigateToChat(item.id)}
    >
      <View style={styles.groupIconContainer}>
        <Ionicons name="people" size={28} color="#fff" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupLocation}>
          <Ionicons name="location-outline" size={14} color="#777" />{" "}
          {item.location}
        </Text>
        <View style={styles.groupMeta}>
          <Text style={styles.groupMembers}>
            {item.memberCount} {item.memberCount === 1 ? "member" : "members"}
          </Text>
          <Text style={styles.groupDate}>
            Created {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Groups</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadChatGroups}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffa952" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : (
        <FlatList
          data={chatGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderGuideCard}
        />
      )}
      <Taskbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  refreshButton: { padding: 8 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10316b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  guideIcon: { marginRight: 12 },
  guideText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  guideSubText: { fontSize: 14, color: "#ddd" },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf5e4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffa952",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  groupLocation: {
    fontSize: 14,
    color: "#777",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  groupMeta: { flexDirection: "row", justifyContent: "space-between" },
  groupMembers: { fontSize: 13, color: "#777" },
  groupDate: { fontSize: 13, color: "#999" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#777" },
  listContainer: { padding: 16, paddingBottom: 80 },
});

export default ChatGroupsScreen;
