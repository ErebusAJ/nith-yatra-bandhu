import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import LocationStep from "./multistep_Planner/location";
import DateStep from "./multistep_Planner/date";
import TripPlanningScreen from "./multistep_Planner/kindOfTrip";
import InterestSelection from "./multistep_Planner/interest";
import { Image } from "expo-image";
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  Feather,
} from "@expo/vector-icons";

// Loading steps
const loadingSteps = [
  {
    text: "Scanning Locations",
    icon: "location-searching",
    type: MaterialIcons,
  },
  { text: "Fetching live weather data", icon: "cloud-sun", type: FontAwesome5 },
  { text: "Finding top rated stays", icon: "hotel", type: MaterialIcons },
  { text: "Assembling Your Travel Blueprint", icon: "map", type: Ionicons },
  { text: "Finalizing your itinerary", icon: "check-circle", type: Feather },
];

const MultiStepForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (loading) {
      let stepIndex = 0;
      setCompletedSteps([stepIndex]);

      const stepInterval = setInterval(() => {
        stepIndex++;
        setCompletedSteps((prev) => [...prev, stepIndex]);
        setCurrentLoadingStep(stepIndex);

        if (stepIndex === loadingSteps.length) {
          clearInterval(stepInterval);
          setTimeout(() => {
            setLoading(false);
            router.push({ pathname: "/itinerary", params: formData });
          }, 1000);
        }
      }, 1200);

      return () => clearInterval(stepInterval);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setCompletedSteps([]);
    setCurrentLoadingStep(0);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <LocationStep
            onLocationChange={(loc) => handleInputChange("location", loc)}
          />
        );
      case 2:
        return (
          <DateStep
            onDateChange={(start, end) =>
              handleInputChange("date", `${start} to ${end}`)
            }
          />
        );
      case 3:
        return (
          <TripPlanningScreen
            onTripSelect={(data) =>
              setFormData((prev) => ({ ...prev, ...data }))
            }
          />
        );
      case 4:
        return (
          <InterestSelection
            onInterestChange={(interests) =>
              handleInputChange("interests", interests)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          {/* Loader GIF */}
          <Image
            source={require("../assets/images/loading2.gif")}
            style={styles.loaderIcon}
          />

          {/* Loader Title */}
          <Text style={styles.loaderTitle}>Generating Itinerary...</Text>

          {/* Loading Steps */}
          {loadingSteps.map((step, index) => {
            const IconComponent = step.type;
            return (
              <View key={index} style={styles.loadingStep}>
                {/* Icon */}
                <View style={styles.iconColumn}>
                  <IconComponent
                    name={step.icon}
                    size={24}
                    color={
                      completedSteps.includes(index) ? "#ffa952" : "#cccccc"
                    }
                  />
                </View>

                {/* Step Text */}
                <View style={styles.textColumn}>
                  <Text
                    style={[
                      styles.loaderMessage,
                      completedSteps.includes(index) && styles.completedMessage,
                    ]}
                  >
                    {step.text}
                  </Text>
                </View>

                {/* Checkmark */}
                <View style={styles.checkColumn}>
                  <Text style={styles.checkmark}>
                    {completedSteps.includes(index) ? "✅" : "○"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <>
          {renderStepContent()}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>
                {step < 4 ? "Next" : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default MultiStepForm;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10316b",
    marginBottom: 15,
  },
  loadingStep: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconColumn: {
    width: 40,
    alignItems: "center",
  },
  textColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  checkColumn: {
    width: 40,
    alignItems: "center",
  },
  loaderMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777",
  },
  completedMessage: {
    color: "#10316b",
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loaderIcon: {
    width: 200,
    height: 200,
    marginBottom: 15,
  },
  footer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#ffa952",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: 200,
    bottom: 35,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
