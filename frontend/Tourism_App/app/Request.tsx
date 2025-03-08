import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

// Default groupId for testing - replace with your actual default
const DEFAULT_GROUP_ID = "defaultGroupId";

const NotificationScreen = (props) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Safely access route params, with fallback if route is undefined
  const route = props.route || {};
  const { groupId } = route.params || {};
  const [currentGroupId, setCurrentGroupId] = useState(
    groupId || DEFAULT_GROUP_ID
  );

  useEffect(() => {
    fetchRequests();
  }, [currentGroupId]);

  const fetchRequests = async () => {
    if (!currentGroupId) {
      console.warn("No group ID available");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://yatra-bandhu-aj.onrender.com/travel-group/${currentGroupId}/request`
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, senderId) => {
    setLoading(true);
    try {
      await axios.post("https://yatra-bandhu-aj.onrender.com/accept-request", {
        requestId,
      });

      // Get current user ID from your auth context or storage
      const currentUserId = await getCurrentUserId(); // Implement this function based on your auth system

      // Auto-create a chat group
      await axios.post("https://yatra-bandhu-aj.onrender.com/travel-group", {
        name: "New Travel Group",
        members: [senderId, currentUserId],
      });

      // Remove request from UI
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );

      Alert.alert("Success", "Request Accepted! Chat Group Created.");
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async (requestId) => {
    setLoading(true);
    try {
      await axios.post("https://yatra-bandhu-aj.onrender.com/deny-request", {
        requestId,
      });

      // Remove request from UI
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );

      Alert.alert("Success", "Request denied");
    } catch (error) {
      console.error("Error denying request:", error);
      Alert.alert("Error", "Failed to deny request");
    } finally {
      setLoading(false);
    }
  };

  // Mock function - replace with your actual implementation
  const getCurrentUserId = async () => {
    // This should fetch the current user's ID from your authentication system
    // For example: return await AsyncStorage.getItem('userId');
    return "currentUserId";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {loading && <Text style={styles.loadingText}>Loading...</Text>}
      {!loading && requests.length === 0 && (
        <Text style={styles.emptyText}>No notifications to display</Text>
      )}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text>{item.senderName} wants to connect</Text>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(item.id, item.senderId)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => handleDeny(item.id)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchRequests}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  requestItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttons: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  denyButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
  },
  loadingText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
    color: "#666",
  },
});

export default NotificationScreen;
