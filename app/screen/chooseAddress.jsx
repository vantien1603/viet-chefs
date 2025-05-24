import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import axios from "axios";
import { API_GEO_KEY } from "@env";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_DISTANCE_KM = 50;

const ChooseAddressScreen = () => {
  const params = useLocalSearchParams();
  const { source, chefId, selectedPackage, numPeople } = params;
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const axiosInstance = useAxios();
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: "",
    address: "",
    placeId: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); 
  const [locationError, setLocationError] = useState("");
  const [distanceError, setDistanceError] = useState(""); 

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await axiosInstance.get("/address/my-addresses");
        setAddresses(response.data);
      } catch (error) {
        console.log("err", error);
        setErrorMessage("Không thể tải danh sách địa chỉ");
      }
    };
    fetchAddress();

    // Request current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Quyền truy cập vị trí bị từ chối");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const fetchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: query,
            key: API_GEO_KEY,
            language: "vi",
            components: "country:vn",
          },
        }
      );
      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
      }
    } catch (error) {
      console.error("Error fetching suggestions from Google Places:", error?.response?.data);
      setErrorMessage("Không thể tải gợi ý địa chỉ");
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: API_GEO_KEY,
            fields: "formatted_address,geometry",
            language: "vi",
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6378;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const selectAddress = async (prediction) => {
    if (!currentLocation) {
      setLocationError("Vui lòng cho phép truy cập vị trí");
      return;
    }

    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      const { formatted_address, geometry } = details;
      const { lat, lng } = geometry.location;
      const distance = calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng);
      if (distance > MAX_DISTANCE_KM) {
        setDistanceError("Địa chỉ phải nằm trong bán kính 50km từ vị trí hiện tại");
        return;
      }
      setDistanceError(""); // Clear distance error if valid
      setNewAddress({
        title: newAddress.title,
        address: formatted_address,
        placeId: prediction.place_id,
      });
      setSuggestions([]);
      setSearchQuery(formatted_address);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setNewAddress({ ...newAddress, address: query });
    setDistanceError(""); // Clear distance error while typing
    fetchAddressSuggestions(query); // Fetch suggestions as the user types
  };

  const createAddress = async () => {
    if (!newAddress.title || !newAddress.address || !newAddress.placeId) {
      setErrorMessage("Vui lòng chọn địa chỉ từ gợi ý");
      return;
    }

    if (addresses.length >= 5) {
      setErrorMessage("Bạn chỉ được tạo tối đa 5 địa chỉ");
      setModalVisible(false);
      return;
    }

    try {
      const addressData = {
        title: newAddress.title,
        address: newAddress.address,
      };
      const response = await axiosInstance.post("/address", addressData);
      if (response.status === 201) {
        setAddresses((prev) => [...prev, response.data]);
        setModalVisible(false);
        setNewAddress({ title: "", address: "", placeId: "" });
        setSearchQuery("");
        setSuggestions([]);
        setErrorMessage(""); // Clear error on success
      }
    } catch (error) {
      console.log("err", error);
      setErrorMessage("Không thể tạo địa chỉ mới");
    }
  };

  const handleConfirm = async () => {
    if (selectedAddressIndex === null) {
      return;
    }

    const selectedAddress = addresses[selectedAddressIndex];
    try {
      await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
    } catch (error) {
      console.error("Error saving selected address:", error);
      setErrorMessage("Không thể lưu địa chỉ đã chọn");
    }

    if (source === "longTerm") {
      router.push({
        pathname: "/screen/longTermBooking",
        params: { chefId, selectedPackage, numPeople, address: selectedAddress.address },
      });
    } else {
      router.push({
        pathname: "/screen/booking",
        params: {
          chefId: params.chefId,
          selectedMenu: params.selectedMenu,
          selectedDishes: params.selectedDishes,
          dishNotes: params.dishNotes,
          sessionDate: params.sessionDate,
          startTime: params.startTime,
          address: selectedAddress.address,
          numPeople: params.numPeople,
          requestDetails: params.requestDetails,
          menuId: params.menuId,
          selectedAddress: JSON.stringify(selectedAddress),
        },
      });
    }
  };

  const renderAddressItem = ({ item, index }) => (
    <View style={styles.addressContainer}>
      <TouchableOpacity onPress={() => setSelectedAddressIndex(index)}>
        <Ionicons
          name={selectedAddressIndex === index ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={selectedAddressIndex === index ? "#A64B2A" : "#999"}
        />
      </TouchableOpacity>
      <View style={styles.addressDetails}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => { /* Edit logic here */ }}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("chooseAddress")} />

      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name="add" size={24} color="black" />
            <Text style={styles.addNewText}>{t("addNew")}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t("confirm")}</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("addNewAddress")}</Text>

            <Text style={styles.inputLabel}>{t("addressLabel")}</Text>
            <View style={styles.titleButtonContainer}>
              <TouchableOpacity
                style={[styles.titleButton, newAddress.title === "Home" && styles.titleButtonSelected]}
                onPress={() => setNewAddress({ ...newAddress, title: "Home" })}
              >
                <Text
                  style={[styles.titleButtonText, newAddress.title === "Home" && styles.titleButtonTextSelected]}
                >
                  {t("home")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleButton, newAddress.title === "Work" && styles.titleButtonSelected]}
                onPress={() => setNewAddress({ ...newAddress, title: "Work" })}
              >
                <Text
                  style={[styles.titleButtonText, newAddress.title === "Work" && styles.titleButtonTextSelected]}
                >
                  {t("work")}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t("address")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("address")}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />

            {distanceError ? <Text style={styles.errorText}>{distanceError}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {suggestions.length > 0 && (
              <ScrollView style={styles.suggestionContainer} nestedScrollEnabled={true}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.place_id}-${index}`}
                    onPress={() => selectAddress(item)}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewAddress({ title: "", address: "", placeId: "" });
                  setSearchQuery("");
                  setSuggestions([]);
                  setErrorMessage("");
                  setDistanceError("");
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createAddress} style={styles.saveButton}>
                <Text style={styles.saveText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addressContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#EBE5DD",
    alignItems: "center",
    borderBottomColor: "#CCCCCC",
    borderBottomWidth: 1,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  editText: {
    color: "#A64B2A",
    fontWeight: "bold",
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#EBE5DD",
    borderBottomColor: "#CCCCCC",
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  addNewText: {
    color: "#A64B2A",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  titleButtonContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  titleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#F9F9F9",
  },
  titleButtonSelected: {
    borderColor: "#A64B2A",
    backgroundColor: "#FFF5F5",
  },
  titleButtonText: {
    fontSize: 16,
    color: "#666",
  },
  titleButtonTextSelected: {
    color: "#A64B2A",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  suggestionContainer: {
    maxHeight: 250,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
    flex: 1,
    alignItems: "center",
  },
  cancelText: {
    color: "gray",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#A64B2A",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});

export default ChooseAddressScreen;