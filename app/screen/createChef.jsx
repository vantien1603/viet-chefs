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
  Keyboard,
} from "react-native";
import { router } from "expo-router"; // Import router for navigation
import Toast from "react-native-toast-message"; // Import Toast for notifications
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { t } from "i18next";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

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
  const [certification, setCertification] = useState("");

  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
  const { showModal } = useCommonNoification();
  const [suggestions, setSuggestions] = useState([]);

  const toggleSpecialty = (region) => {
    setSpecialties((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  const handleSubmit = async () => {
    const selectedSpecialties = [];
    if (specialties.north)
      selectedSpecialties.push("Northern Vietnamese Cuisine");
    if (specialties.center)
      selectedSpecialties.push("Central Vietnamese Cuisine");
    if (specialties.south)
      selectedSpecialties.push("Southern Vietnamese Cuisine");
    const specialization =
      selectedSpecialties.join(", ") || "General Vietnamese Cuisine";

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
      if (response.status === 200 || response.status === 201) {
        showModal(t("modal.success"), t("chefRegistration"),);
      }

      setTimeout(() => {
        router.push("/screen/login");
      }, 1500);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("registrationFailed"), "Failed");
    }
  };

  const handleSearch = (query) => {
    setUpdateDataChef((prev) => ({ ...prev, address: query }))
    fetchAddressSuggestions(query);
  };


  const fetchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const params = {
        input: query,
        key: process.env.API_GEO_KEY,
        language: "vi",
      };


      // if (country) {
      //   params.components = `country:${country}`;
      // }

      console.log(params)

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        { params }
      );

      console.log("Suggestions response:", response.data);
      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
      }
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.fetchSuggestionsFailed"),
        "Failed"
      );
    }
  };

  const selectAddress = async (prediction) => {
    const formattedAddress = await getPlaceDetails(prediction.place_id);
    if (formattedAddress) {
      setAddress(formattedAddress);
      setSuggestions([]);
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: process.env.API_GEO_KEY,
            fields: "formatted_address",
            language: "vi",
          },
        }
      );
      return response.data.result.formatted_address;
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.fetchPlaceDetailsFailed"),
        "Failed"
      );
      return null;
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("registerChef")} />
      <ScrollView style={commonStyles.containerContent} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t("bioS")}
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder={t("descriptionS")}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder={t("address")}
              value={address}
              onChangeText={handleSearch}
              onSubmitEditing={(event) => {
                event.persist();
                fetchAddressSuggestions(event.nativeEvent.text);
              }}
              returnKeyType="search"
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestionContainer}>
                <ScrollView nestedScrollEnabled={true}>
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.place_id}-${index}`}
                      onPress={() => selectAddress(item)}
                      style={styles.suggestionItem}
                    >
                      <Text style={styles.suggestionText}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder={t("country")}
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder={t("price")}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder={t("maxServingSizes")}
            value={maxServingSize}
            // onChangeText={setMaxServingSize}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              if (numericValue === "" || parseInt(numericValue) <= 10) {
                setMaxServingSize(numericValue);
              } else {
                setMaxServingSize("10"); // Clamp to 10 if input exceeds it
              }
            }}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder={t("experienceYears")}
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            keyboardType="numeric"
          />

          <View style={styles.specialtySection}>
            <Text style={styles.sectionTitle}>{t("specialty")}</Text>
            <View style={styles.specialtyButtons}>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.north && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("north")}
              >
                <Text style={[styles.buttonText, { color: specialties.north && 'white' }]}>{t("northern")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.center && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("center")}
              >
                <Text style={[styles.buttonText, { color: specialties.center && 'white' }]}>{t("central")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.specialtyButton,
                  specialties.south && styles.selectedButton,
                ]}
                onPress={() => toggleSpecialty("south")}
              >
                <Text style={[styles.buttonText, { color: specialties.south && 'white' }]}>{t("southern")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.certificateSection}>
            <Text style={styles.sectionTitle}>
              {t("haveCertificateQuestion")}
            </Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t("haveCertificate")}</Text>
              <Switch
                value={hasCertificate === true}
                onValueChange={(value) => setHasCertificate(value)}
                trackColor={{ false: "#CCCCCC", true: "#A9411D" }}
                thumbColor={hasCertificate ? "#fff" : "#fff"}
              />
            </View>

            {hasCertificate === true && (
              <View style={styles.uploadSection}>
                <Text style={{ fontFamily: "nunito-regular" }}>
                  {t("certificateImageUrl")}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("enterCertificateUrl")}
                  value={certification}
                  onChangeText={setCertification}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t("submit")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 80,
  },
  form: {
    // padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "nunito-regular"
  },
  specialtySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-regular"
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
    fontFamily: "nunito-bold",
  },
});

export default CreateChefScreen;
