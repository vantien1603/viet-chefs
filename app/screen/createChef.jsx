import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateChefScreen = () => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState({
    north: false,
    center: false,
    south: false,
  });
  const [hasCertificate, setHasCertificate] = useState(null);
  const [certificateImage, setCertificateImage] = useState(null);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setCertificateImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setCertificateImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setCertificateImage(null); // Xóa ảnh bằng cách đặt lại state về null
  };

  const toggleSpecialty = (region) => {
    setSpecialties((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  const handleSubmit = () => {
    console.log({
      fullname,
      email,
      phoneNumber,
      experience,
      specialties,
      hasCertificate,
      certificateImage,
    });
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Register Chef" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullname}
            onChangeText={setFullname}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Years of Experience"
            value={experience}
            onChangeText={setExperience}
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  hasCertificate === true && styles.selectedButton,
                ]}
                onPress={() => setHasCertificate(true)}
              >
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  hasCertificate === false && styles.selectedButton,
                ]}
                onPress={() => setHasCertificate(false)}
              >
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
            </View>

            {hasCertificate === true && (
              <View style={styles.uploadSection}>
                <Text style={styles.uploadTitle}>Upload Certificate</Text>
                {certificateImage ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: certificateImage }}
                      style={styles.certificateImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={removeImage}
                    >
                      <Ionicons name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadButtons}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhoto}
                    >
                      <Ionicons name="camera" size={24} color="white" />
                      <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickImage}
                    >
                      <Ionicons name="image" size={24} color="white" />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  uploadSection: {
    marginTop: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  imageContainer: {
    position: "relative",
  },
  certificateImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 2,
  },
  uploadButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#A9411D",
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "white",
    marginLeft: 10,
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
