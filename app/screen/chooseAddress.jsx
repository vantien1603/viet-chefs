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
import { useCommonNoification } from "../../context/commonNoti";
import { useSelectedItems } from "../../context/itemContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";


const ChooseAddressScreen = () => {
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const axiosInstance = useAxios();
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: "",
    address: "",
    placeId: "",
  });
  const country = SecureStore.getItem('country');
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { showModal } = useCommonNoification();
  const { address, setAddress, isLong, chefLong, chefLat } = useSelectedItems();
  const MAX_DISTANCE_KM = 50;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [distanceError, setDistanceError] = useState("");

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await axiosInstance.get("/address/my-addresses");
        setAddresses(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal(t("modal.error"), t("errors.fetchAddressesFailed"), "Failed");
      }
    };
    fetchAddress();

    // Request current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // setLocationError("Quyền truy cập vị trí bị từ chối");
        setErrorMessage(t("errors.locationPermissionDenied"));
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
      const params = {
        input: query,
        key: process.env.API_GEO_KEY,
        language: "vi",
        location: `${chefLat},${chefLong}`,
        radius: 30000,
        strictbounds: true,
      };

      if (country) {
        params.components = `country:${country}`;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        { params }
      );
      console.log(response.data);

      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
      }
    } catch (error) {
      console.error(
        "Error fetching suggestions from Google Places:",
        error?.response?.data
      );
      setErrorMessage(t("errors.fetchSuggestionsFailed"));
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
      setErrorMessage(t("errors.fetchPlaceDetailsFailed"));
      return null;
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6378;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const selectAddress = async (prediction) => {
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      const { formatted_address, geometry } = details;
      const { lat, lng } = geometry.location;
      const distance = calculateDistance(chefLat, chefLong, lat, lng);
      console.log("detial", details);

      if (distance > MAX_DISTANCE_KM) {
        showModal(t("modal.error"), t("errors.distanceExceeded"), "Failed");
        return;
      }

      setNewAddress({ ...newAddress, address: formatted_address });

      // setNewAddress({
      //   title: newAddress.title,
      //   address: formatted_address,
      //   placeId: prediction.place_id,
      // });
      setSuggestions([]);
      setSearchQuery(formatted_address);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setNewAddress({ ...newAddress, address: query });
    fetchAddressSuggestions(query);
  };

  const createAddress = async () => {
    if (!newAddress.title || !newAddress.address) {
      showModal(t("modal.error"), t("errors.incompleteAddress"), "Failed");
      return;
    }

    if (addresses.length >= 5) {
      showModal(t("modal.error"), t("errors.maxAddresses"), "Failed");
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
        showModal(t("modal.success"), t("createAddressSuccess"),);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), error.response.data.message || t("errors.createAddressFailed"), "Failed");
    }
  };

  const handleConfirm = async () => {
    if (selectedAddressIndex === null) {
      showModal(t("modal.error"), t("errors.noAddressSelected"), "Failed");
      return;
    }
    const selectedAddress = addresses[selectedAddressIndex];
    setAddress(selectedAddress.address);
    console.log(selectedAddress);
    const distance = calculateDistance(chefLat, chefLong, selectedAddress.latitude, selectedAddress.longitude);
    console.log(distance);
    if (distance > 10) {
      showModal("Error", "Địa chỉ phải nằm trong bán kính 50km", "Failed");
      return;
    }
    await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
    isLong ? router.replace("/screen/longTermBooking") : router.replace("/screen/booking")
  };

  useEffect(() => {
    if (address && addresses.length > 0) {
      const index = addresses.findIndex(
        (item) =>
          item.address === address?.address && item.title === address?.title
      );
      if (index !== -1) {
        setSelectedAddressIndex(index);
      }
    }
  }, [addresses, address]);

  const renderAddressItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.addressContainer}
      onPress={() => setSelectedAddressIndex(index)}
    >
      <Ionicons
        name={
          selectedAddressIndex === index
            ? "radio-button-on"
            : "radio-button-off"
        }
        size={24}
        color={selectedAddressIndex === index ? "#A64B2A" : "#999"}
      />
      <View style={styles.addressDetails}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header
        title={t("chooseAddress")}
        onLeftPress={() =>
          isLong
            ? router.replace("/screen/longTermBooking")
            : router.replace("/screen/booking")
        }
      />
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>{t("address")}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addNewText}>{t("addNew")}</Text>
        </TouchableOpacity>
      </View>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("addNewAddress")}</Text>

            <Text style={styles.inputLabel}>{t("addressLabel")}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title ex: home, work,..."
              placeholderTextColor="#999"
              value={newAddress.title}
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, title: text })
              }
            />

            <Text style={styles.inputLabel}>{t("address")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("address")}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />

            {suggestions.length > 0 && (
              <ScrollView
                style={styles.suggestionContainer}
                nestedScrollEnabled={true}
              >
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
              <TouchableOpacity
                onPress={createAddress}
                style={styles.saveButton}
              >
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
    fontFamily: "nunito-bold",
    color: "#333",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  editText: {
    color: "#A64B2A",
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
    color: "#666",
  },
  addNewText: {
    color: "#A64B2A",
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
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
