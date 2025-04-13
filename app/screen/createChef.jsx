import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router"; // Import router for navigation
import Toast from "react-native-toast-message"; // Import Toast for notifications
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";

const CreateChefScreen = () => {
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [maxServingSize, setMaxServingSize] = useState("");
  const [specialties, setSpecialties] = useState({
    north: false,
    center: false,
    south: false,
  });
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [hasCertificate, setHasCertificate] = useState(null);
  const [certification, setCertification] = useState(""); // URL for the certificate image

  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/profile"); 
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const toggleSpecialty = (region) => {
    setSpecialties((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  const handleSubmit = async () => {
    // Construct the specialization string from selected specialties
    const selectedSpecialties = [];
    if (specialties.north)
      selectedSpecialties.push("Northern Vietnamese Cuisine");
    if (specialties.center)
      selectedSpecialties.push("Central Vietnamese Cuisine");
    if (specialties.south)
      selectedSpecialties.push("Southern Vietnamese Cuisine");
    const specialization =
      selectedSpecialties.join(", ") || "General Vietnamese Cuisine";

    // Prepare the POST body
    const payload = {
      bio,
      description,
      address,
      country,
      price: parseFloat(price) || 0,
      maxServingSize: parseInt(maxServingSize) || 0,
      specialization,
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      certification: hasCertificate ? certification : "",
    };

    try {
      const response = await axiosInstance.post(
        `/chefs/register/${user.userId}`,
        payload
      );
      console.log("Chef registered successfully:", response.data);

      // Show success toast
      Toast.show({
        type: "success",
        text1: "🎉 You’ve Successfully Registered!",
        text2:
          "Thanks for registering. Your profile is under review — we’ll notify you soon.",
        position: "top",
      });

      setTimeout(() => {
        router.push("/screen/login");
      }, 1500);
    } catch (error) {
      let errorMessage = "Failed to register chef";
      if (error.response) {
        console.log(`Error ${error.response.status}:`, error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else {
        console.log("Error:", error.message);
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "top",
      });
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Register Chef" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Bio (Short Introduction)"
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Description (Additional Details)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (e.g., per service)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Max Serving Size (number of people)"
            value={maxServingSize}
            onChangeText={setMaxServingSize}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Years of Experience"
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            keyboardType="numeric"
          />

          <View style={styles.specialtySection}>
            <Text style={styles.sectionTitle}>
              Specialty (Vietnamese Cuisine)
            </Text>
            <View style={styles.specialtyButtons}>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.north && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("north")}
              >
                <Text style={styles.buttonText}>Northern</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.center && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("center")}
              >
                <Text style={styles.buttonText}>Central</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.south && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("south")}
              >
                <Text style={styles.buttonText}>Southern</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.certificateSection}>
            <Text style={styles.sectionTitle}>
              Do you have a culinary certificate?
            </Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Have Certificate</Text>
              <Switch
                value={hasCertificate === true}
                onValueChange={(value) => setHasCertificate(value)}
                trackColor={{ false: "#ccc", true: "#A9411D" }}
                thumbColor={hasCertificate ? "#fff" : "#fff"}
              />
            </View>

            {hasCertificate === true && (
              <View style={styles.uploadSection}>
                <Text style={styles.uploadTitle}>Certificate Image URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the URL of your certificate image"
                  value={certification}
                  onChangeText={setCertification}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  specialtySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  specialtyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specialtyButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#A9411D",
    borderColor: "#A9411D",
  },
  buttonText: {
    fontSize: 16,
    color: "black",
  },
  certificateSection: {
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
  },
  submitContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  submitButton: {
    backgroundColor: "#A9411D",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreateChefScreen;
