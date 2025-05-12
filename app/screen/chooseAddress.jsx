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
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import axios from "axios";
import Toast from "react-native-toast-message";
import { API_GEO_KEY } from "@env";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChooseAddressScreen = () => {
  const params = useLocalSearchParams();
  const { source, chefId, selectedPackage, numPeople } = params; // Add source and other params
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const axiosInstance = useAxios();
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "", address: "" });
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await axiosInstance.get("/address/my-addresses");
        setAddresses(response.data);
        console.log(response.data);
      } catch (error) {
        console.log("err", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải danh sách địa chỉ",
        });
      }
    };
    fetchAddress();
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
      console.error(
        "Error fetching suggestions from Google Places:",
        error?.response?.data
      );
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
            fields: "formatted_address",
            language: "vi",
          },
        }
      );
      return response.data.result.formatted_address;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const selectAddress = async (prediction) => {
    const formattedAddress = await getPlaceDetails(prediction.place_id);
    if (formattedAddress) {
      setNewAddress({ ...newAddress, address: formattedAddress });
      setSuggestions([]);
      setSearchQuery(formattedAddress);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setNewAddress({ ...newAddress, address: query });
  };

  const createAddress = async () => {
    if (!newAddress.title || !newAddress.address) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    if (addresses.length >= 5) {
      Toast.show({
        type: "error",
        text1: "Giới hạn",
        text2: "Bạn chỉ được tạo tối đa 5 địa chỉ",
      });
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
        setNewAddress({ title: "", address: "" });
        setSearchQuery("");
        setSuggestions([]);
      }
    } catch (error) {
      console.log("err", error);
    }
  };

  const handleConfirm = async () => {
    if (selectedAddressIndex === null) {
      return;
    }

    const selectedAddress = addresses[selectedAddressIndex];

    // Save selected address to AsyncStorage
    try {
      await AsyncStorage.setItem(
        "selectedAddress",
        JSON.stringify(selectedAddress)
      );
      console.log("Saved selected address:", selectedAddress.address);
    } catch (error) {
      console.error("Error saving selected address:", error);
    }

    if (source === "longTerm") {
      // Navigate back to LongTermBookingScreen
      router.push({
        pathname: "/screen/longTermBooking",
        params: {
          chefId,
          selectedPackage,
          numPeople,
          address: selectedAddress.address,
        },
      });
    } else {
      // Navigate to regular booking screen
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
          name={
            selectedAddressIndex === index
              ? "radio-button-on"
              : "radio-button-off"
          }
          size={24}
          color={selectedAddressIndex === index ? "#A64B2A" : "#999"}
        />
      </TouchableOpacity>
      <View style={styles.addressDetails}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("chooseAddress")} />

      {/* Address Section */}
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

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t("confirm")}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Adding New Address */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("addNewAddress")}</Text>

            {/* Title Selection with Home/Work Buttons */}
            <Text style={styles.inputLabel}>{t("addressLabel")}</Text>
            <View style={styles.titleButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.titleButton,
                  newAddress.title === "Home" && styles.titleButtonSelected,
                ]}
                onPress={() => setNewAddress({ ...newAddress, title: "Home" })}
              >
                <Text
                  style={[
                    styles.titleButtonText,
                    newAddress.title === "Home" &&
                      styles.titleButtonTextSelected,
                  ]}
                >
                  {t("home")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.titleButton,
                  newAddress.title === "Work" && styles.titleButtonSelected,
                ]}
                onPress={() => setNewAddress({ ...newAddress, title: "Work" })}
              >
                <Text
                  style={[
                    styles.titleButtonText,
                    newAddress.title === "Work" &&
                      styles.titleButtonTextSelected,
                  ]}
                >
                  {t("work")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address Input */}
            <Text style={styles.inputLabel}>{t("address")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("address")}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={(event) => {
                event.persist();
                fetchAddressSuggestions(event.nativeEvent.text);
              }}
              returnKeyType="search"
            />

            {/* Address Suggestions */}
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

            {/* Modal Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewAddress({ title: "", address: "" });
                  setSearchQuery("");
                  setSuggestions([]);
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  addNewText: {
    color: "#A64B2A",
    fontWeight: "bold",
    fontSize: 16,
  },
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
});

export default ChooseAddressScreen;
