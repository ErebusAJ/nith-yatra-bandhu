import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const EditProfileView = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState(
    "https://www.bootdey.com/img/Content/avatar/avatar3.png"
  );

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "User not authenticated!");
        router.replace("/sign-in");
        return;
      }

      try {
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
          setName(data.Name || "");
          setPhone(data.PhoneNumber || "");
          if (data.ProfileImage) setProfileImage(data.ProfileImage);
        } else {
          console.error("Error fetching user:", data);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChangeProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (!/^\d{12}$/.test(aadhar)) {
      Alert.alert("Invalid Aadhar", "Aadhar number must be exactly 12 digits.");
      return;
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Error", "User not authenticated!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://yatra-bandhu-aj.onrender.com/auth/user",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            old_password: oldPassword,
            new_password: newPassword,
            phone_no: phone,
            profile_image: profileImage,
          }),
        }
      );

      if (response.status === 204) {
        Alert.alert("Success", "Profile updated successfully!");
        router.push("/profile");
      } else {
        const data = await response.json();
        Alert.alert("Update Failed", data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#113f67", "#79c2d0", "#fff"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Profile Image */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeProfileImage}>
            <Image style={styles.avatar} source={{ uri: profileImage }} />
          </TouchableOpacity>
          <Text style={styles.changeImageText}>Change Profile Picture</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Aadhar Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            maxLength={12}
            value={aadhar}
            onChangeText={setAadhar}
          />

          <Text style={styles.label}>Old Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter Old Password"
            value={oldPassword}
            onChangeText={setOldPassword}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter New Password"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        {/* Update Button */}
        <TouchableOpacity onPress={handleUpdate} disabled={loading}>
          <LinearGradient colors={["#113f67", "#79c2d0"]} style={styles.button}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#79c2d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  changeImageText: {
    color: "#113f67",
    marginTop: 5,
    fontSize: 14,
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    marginTop: 15,
    fontSize: 16,
    color: "#113f67",
    fontWeight: "bold",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    marginTop: 5,
  },
  button: {
    marginTop: 30,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    width: "90%",
    padding: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default EditProfileView;
