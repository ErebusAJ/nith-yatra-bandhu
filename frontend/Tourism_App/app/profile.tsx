import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const [profileImage, setProfileImage] = useState(
    require("../assets/images/default-avatar.png")
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/sign-in");
          return;
        }
        const response = await fetch(
          "https://yatra-bandhu-aj.onrender.com/auth/user",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setUser({
            name: data.Name || "N/A",
            email: data.Email || "N/A",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#113f67" />
      ) : user ? (
        <>
          {/* Background Cover */}
          <View style={styles.headerBackground} />

          {/* Profile Section */}
          <View style={styles.profileContainer}>
            <Image source={profileImage} style={styles.profileImage} />
            <Text style={styles.username}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push("/profile-edit")}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Options Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/History")}
            >
              <Ionicons name="time-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Show History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/Request")}
            >
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="lock-closed-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Privacy & Security</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="globe-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Language</Text>
              <Text style={styles.optionText}>English</Text>
            </TouchableOpacity>

            {/* New Buttons */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="card-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Your Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="document-text-outline" size={22} color="#333" />
              <Text style={styles.menuText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.lastItem]}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#333"
              />
              <Text style={styles.menuText}>About Us</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.errorText}>Failed to load user data</Text>
      )}
    </SafeAreaView>
  );
};

export default Profile;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "30%",
    backgroundColor: "#10316b",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 50,
    backgroundColor: "#FFF",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignSelf: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#10316b",
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  editProfileButton: {
    marginTop: 10,
    backgroundColor: "#10316b",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "#113f67",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
