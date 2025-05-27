import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import axios from "axios";
import { t } from "i18next";
import { AuthContext } from "../../config/AuthContext";
import { useModalLogin } from "../../context/modalLoginContext";
import { useConfirmModal } from "../../context/commonConfirm";
import { useCommonNoification } from "../../context/commonNoti";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import * as SecureStore from "expo-secure-store";

const EditAddress = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "", address: "" });
  const [editingAddress, setEditingAddress] = useState(null);
  const axiosInstance = useAxios();
  const [suggestions, setSuggestions] = useState([]);
  const { isGuest } = useContext(AuthContext);
  const { showModalLogin } = useModalLogin();
  const { showConfirm } = useConfirmModal();
  const { showModal } = useCommonNoification();
  const [isEdit, setIsEdit] = useState(false);
  const country = SecureStore.getItem('country');

  const requireAuthAndNetWork = useRequireAuthAndNetwork();
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

      if (country) {
        params.components = `country:${country}`;
      }

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

  const selectAddress = async (prediction) => {
    const formattedAddress = await getPlaceDetails(prediction.place_id);
    if (formattedAddress) {
      editingAddress
        ? setEditingAddress({ ...editingAddress, address: formattedAddress })
        : setNewAddress({ ...newAddress, address: formattedAddress });
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (isGuest)
      showModalLogin(
        t("errors.loginRequired"),
        t("errors.loginRequiredMessage"),
        true
      );

    fetchAddresses();
    loadSelectedAddress();
  }, []);

  const loadSelectedAddress = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setSelectedId(parsedAddress.id);
      }
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.loadSelectedAddressFailed"),
        "Failed"
      );
    }
  };

  const saveSelectedAddress = async (address) => {
    try {
      await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.saveSelectedAddressFailed"),
        "Failed"
      );
    }
  };

  const fetchAddresses = async () => {
    if (isGuest) return;
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      setAddresses(response.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.fetchAddressesFailed"),
        "Failed"
      );
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showModal(
          t("modal.error"),
          t("errors.locationPermissionDenied"),
          "Failed"
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        let addr = reverseGeocode[0];
        let fullAddress = `${addr.name || ""}, ${addr.street || ""}, ${addr.city || ""
          }, ${addr.region || ""}, ${addr.country || ""}`;

        const existingCurrentLocation = addresses.find(
          (addr) => addr.title === t("currentLocation")
        );
        const newLocation = {
          title: t("currentLocation"),
          address: fullAddress,
        };
        if (existingCurrentLocation) {
          await handleUpdateCurrentAddress({
            ...existingCurrentLocation,
            address: fullAddress,
          });
        } else {
          await handleCreateAddress(newLocation);
        }
        setCurrentAddress(null);
        setSelectedId(null);
      }
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.fetchLocationFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrentAddress = async (addresData) => {
    try {
      const response = await axiosInstance.put("/address", addresData);
      if (response.status === 200) {
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === addresData.id
              ? { ...addr, address: addresData.address }
              : addr
          )
        );
        showModal(t("modal.success"),
          t("updateCurrentLocationSuccess"),
        );
      }
    } catch (error) {
      if (error.response.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.updateCurrentLocationFailed"),
        "Failed"
      );
    }
  };

  const handleCreateAddress = async (addressData) => {
    if (addresses.length >= 5) {
      showModal(
        t("modal.warning"),
        t("errors.maxAddresses"),
        t("Warning")
      );
      setModalVisible(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/address", addressData);
      if (response.status === 201) {
        setAddresses((prev) => [...prev, response.data]);
        setModalVisible(false);
        setNewAddress({ title: "", address: "" });
        showModal(t("modal.success"),
          t("saveAddressSuccess"),
        );
      }
    } catch (error) {
      if (error.response.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.saveAddressFailed"),
        "Failed"
      );
    }
  };

  const handleUpdateAddress = async () => {
    setLoading(true);
    if (!editingAddress.title || !editingAddress.address) {
      showModal(
        t("modal.error"),
        t("errors.incompleteAddress"),
        "Failed"
      );

      return;
    }
    try {
      const response = await axiosInstance.put("/address", editingAddress);
      if (response.status === 200) {
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddress.id ? response.data : addr
          )
        );
        setModalVisible(false);
        setIsEdit(false);
        setEditingAddress(null);
        showModal(t("modal.success"),
          t("updateAddressSuccess"),
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.updateAddressFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    showConfirm(t("deleteAddress"), t("deleteAddressMessage"), () =>
      requireAuthAndNetWork(async () => {
        try {
          const response = await axiosInstance.delete(`/address/${id}`);
          if (response.status === 200) {
            setAddresses(addresses.filter((addr) => addr.id !== id));
            if (selectedId === id) {
              setSelectedId(null);
              await AsyncStorage.removeItem("selectedAddress");
            }
            showModal(t("modal.success"),
              t("deleteAddressSuccess"),
            );
          }
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            return;
          }
          showModal(
            t("modal.error"),
            t("errors.deleteAddressFailed"),
            "Failed"
          );
        }
      })
    );
  };

  const handleSearch = (query) => {
    if (isEdit) {
      setEditingAddress({ ...editingAddress, address: query });
    } else {
      setNewAddress({ ...newAddress, address: query });
    }
    fetchAddressSuggestions(query);
  };

  const renderAddressItem = (item) => (
    <View
      key={item.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        justifyContent: "space-between",
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setSelectedId(item.id);
          saveSelectedAddress(item);
        }}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
      >
        <Ionicons
          name={selectedId === item.id ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={selectedId === item.id ? "#A64B2A" : "gray"}
        />
        <Ionicons
          name={
            item.type === "home"
              ? "home"
              : item.type === "work"
                ? "business"
                : "location-outline"
          }
          size={20}
          color="black"
          style={{ marginLeft: 10 }}
        />
        <Text style={{ marginLeft: 10, fontSize: 16, color: "#333", flex: 1, fontFamily: "nunito-regular" }}>
          {item.address}
        </Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          onPress={() => {
            setIsEdit(true);
            setEditingAddress(item);
            setModalVisible(true);
          }}
        >
          <Text
            style={{ color: "#A9411D", fontFamily: "nunito-bold", marginRight: 15 }}
          >
            {t("edit")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("address")} />
      {!isGuest && (
        <>
          <ScrollView style={{ marginBottom: 80 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#666", fontSize: 16, fontFamily: "nunito-regular" }}>
                {t("addressList")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={{ color: "#A64B2A", fontFamily: "nunito-bold" }}>
                  {t("addNew")}
                </Text>
              </TouchableOpacity>
            </View>

            {addresses.map(renderAddressItem)}

            <Modal visible={modalVisible} animationType="slide" transparent>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {editingAddress ? t("editAddress") : t("addNewAddress")}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder={t("addressLabel")}
                    value={
                      editingAddress ? editingAddress.title : newAddress.title
                    }
                    onChangeText={(text) =>
                      editingAddress
                        ? setEditingAddress({ ...editingAddress, title: text })
                        : setNewAddress({ ...newAddress, title: text })
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t("address")}
                    // value={
                    //   editingAddress ? editingAddress.address : newAddress.address
                    // }
                    // onChangeText={(text) =>
                    //   editingAddress
                    //     ? setEditingAddress({ ...editingAddress, address: text })
                    //     : setNewAddress({ ...newAddress, address: text })
                    // }
                    // onSubmitEditing={(event) => {
                    //   event.persist();
                    //   fetchAddressSuggestions(event.nativeEvent.text);
                    // }}
                    // returnKeyType="search"

                    value={
                      editingAddress
                        ? editingAddress.address
                        : newAddress.address
                    }
                    onChangeText={handleSearch}
                    onSubmitEditing={(event) => {
                      event.persist();
                      fetchAddressSuggestions(event.nativeEvent.text);
                    }}
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
                        setEditingAddress(null);
                        setSuggestions([]);
                      }}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelText}>{t("cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={
                        editingAddress
                          ? handleUpdateAddress
                          : () => handleCreateAddress(newAddress)
                      }
                      style={styles.saveButton}
                    >
                      <Text style={styles.saveText}>
                        {editingAddress ? t("update") : t("save")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>

          <TouchableOpacity
            onPress={getCurrentLocation}
            style={{
              position: "absolute",
              bottom: 50,
              left: 20,
              right: 20,
              backgroundColor: "#A64B2A",
              padding: 15,
              borderRadius: 10,
              alignItems: "center",
              elevation: 5,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                style={{ color: "white", fontFamily: "nunito-bold", fontSize: 16 }}
              >
                {t("useCurrentLocation")}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
    fontFamily: "nunito-regular"
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
    fontFamily: "nunito-regular"
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
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
  },
  saveText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
});

export default EditAddress;
