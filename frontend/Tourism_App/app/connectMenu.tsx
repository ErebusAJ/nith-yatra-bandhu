import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import TravelCard from "./components/connect-cards";
import { SafeAreaView } from "react-native-safe-area-context";
import Taskbar from "./components/taskbar";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Connect = () => {
  const navigation = useNavigation();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [postedTrips, setPostedTrips] = useState([]);

  const predefinedImages = {
    LADAKH: "https://images.wanderon.in/blogs/new/2023/12/leh-ladakh.jpg",
    ARGENTINA:
      "https://www.shiftcities.org/sites/default/files/styles/og_image/public/2021-12/argentina%20%284%29%20small.png?itok=_oDpZyN3",
    JAPAN:
      "https://www.state.gov/wp-content/uploads/2019/04/Japan-2107x1406.jpg",
    SWITZERLAND:
      "https://cdn.britannica.com/65/162465-050-9CDA9BC9/Alps-Switzerland.jpg",
    BALI: "https://digital.ihg.com/is/image/ihg/intercontinental-bali-9719167392-2x1",
    ICELAND:
      "https://res.cloudinary.com/enchanting/q_70,f_auto,w_838,h_474,c_fit/exodus-web/2021/12/kirkjufellsfoss_iceland.jpg",
    NORWAY:
      "https://i.natgeofe.com/k/679e983c-4461-4398-bb6d-9b508fe3e4de/norway-northern-lights.jpg",
    CANADA:
      "https://keystoneacademic-res.cloudinary.com/image/upload/f_auto/q_auto/g_auto/c_fill/w_1280/element/11/110845_shutterstock_255015211.jpg",
  };

  const getRandomImage = () =>
    `https://source.unsplash.com/random/300x200/?travel`;
  const getRandomProfile = (index) =>
    `https://randomuser.me/api/portraits/${
      index % 2 === 0 ? "men" : "women"
    }/${index}.jpg`;

  // Fetch logged-in user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.ID) {
            setCurrentUserId(parsedData.ID);
          } else {
            console.warn("User ID missing in stored data");
          }
        } else {
          console.warn("No user data found in storage");
        }
      } catch (error) {
        console.error("Error retrieving user ID:", error);
      }
    };

    getUserId();
  }, []);

  // Fetch posted trips from AsyncStorage
  useEffect(() => {
    const fetchPostedTrips = async () => {
      try {
        let storedTrips = await AsyncStorage.getItem("postedTrips");
        storedTrips = storedTrips ? JSON.parse(storedTrips) : [];
        setPostedTrips(storedTrips);
      } catch (error) {
        console.error("Error fetching posted trips:", error);
      }
    };

    fetchPostedTrips();
  }, []);

  const handleConnect = async (receiverId, tripName) => {
    if (!currentUserId) {
      Alert.alert("Error", "You need to be logged in to connect with others");
      return;
    }

    if (sentRequests[receiverId]) {
      Alert.alert("Info", "You've already sent a request to this user.");
      return;
    }

    setIsLoading((prev) => ({ ...prev, [receiverId]: true }));

    try {
      const groupResponse = await axios.post(
        "https://yatra-bandhu-aj.onrender.com/travel-group",
        {
          name: tripName || "New Travel Group",
          description: "Let's plan a trip together!",
          createdBy: currentUserId,
        }
      );

      if (!groupResponse.data || !groupResponse.data.groupId) {
        throw new Error("Invalid response from server: groupId missing");
      }

      const newGroupId = groupResponse.data.groupId;
      await AsyncStorage.setItem("groupId", newGroupId);

      const requestResponse = await axios.post(
        `https://yatra-bandhu-aj.onrender.com/travel-group/${newGroupId}/request`,
        {
          senderId: currentUserId,
          receiverId: receiverId,
        }
      );

      setSentRequests((prev) => ({ ...prev, [receiverId]: true }));
      Alert.alert("Success", "Connection Request Sent!");

      navigation.navigate("Notifications", { groupId: newGroupId });
    } catch (error) {
      console.error("Error during connection process:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong."
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [receiverId]: false }));
    }
  };

  const travelersData = [
    { id: "user123", name: "Jessie", tripName: "LADAKH" },
    { id: "user456", name: "Andrew", tripName: "ARGENTINA" },
    { id: "user789", name: "Joseph", tripName: "JAPAN" },
    { id: "user101", name: "Kelly", tripName: "SWITZERLAND" },
    { id: "user202", name: "Sophia", tripName: "BALI" },
    { id: "user303", name: "Michael", tripName: "ICELAND" },
    { id: "user404", name: "Emma", tripName: "NORWAY" },
    { id: "user505", name: "Daniel", tripName: "CANADA" },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>🌍 Connect</Text>
        <Text style={styles.subheading}>
          Meet like-minded travelers and explore together!
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {postedTrips.map((trip, index) => (
          <TravelCard
            key={`posted-${index}`}
            image={predefinedImages[trip.location] || getRandomImage()}
            title={trip.location}
            profileImage={getRandomProfile(index)}
            name="You"
            description={`Explore ${trip.location} from ${trip.startDate} to ${trip.endDate}.`}
            tripDates={`${trip.startDate} - ${trip.endDate}`}
            groupSize="1/4"
            profiles={[getRandomProfile(index + 10)]}
            onConnect={() => console.log("Connect clicked")}
          />
        ))}

        {travelersData.map((traveler, index) => (
          <TravelCard
            key={`traveler-${index}`}
            image={predefinedImages[traveler.tripName] || getRandomImage()}
            title={traveler.tripName}
            profileImage={getRandomProfile(index)}
            name={traveler.name}
            description={`Join ${traveler.name} on a trip to ${traveler.tripName}!`}
            tripDates="TBD"
            groupSize="1/4"
            profiles={[getRandomProfile(index + 10)]}
            onConnect={() => handleConnect(traveler.id, traveler.tripName)}
            isLoading={isLoading[traveler.id]}
          />
        ))}
      </ScrollView>

      <View style={styles.taskbarContainer}>
        <Taskbar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subheading: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  taskbarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    elevation: 5,
  },
});

export default Connect;
