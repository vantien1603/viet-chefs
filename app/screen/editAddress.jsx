import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";

const EditAddress = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "", address: "" });
  const [editingAddress, setEditingAddress] = useState(null);
  const axiosInstance = useAxios();

  useEffect(() => {
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
      console.error("Error loading selected address:", error);
    }
  };

  const saveSelectedAddress = async (address) => {
    try {
      await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    } catch (error) {
      console.error("Error saving selected address:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      setAddresses(response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load addresses",
      });
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "You need to enable location services.",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        let addr = reverseGeocode[0];
        let fullAddress = `${addr.name || ""}, ${addr.street || ""}, ${addr.city || ""}, ${addr.region || ""}, ${addr.country || ""}`;
        
        const newLocation = {
          title: "Current Location",
          address: fullAddress,
        };
        await handleCreateAddress(newLocation);
        setCurrentAddress(null);
        setSelectedId(null);
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not fetch location",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (addressData) => {
    try {
      const response = await axiosInstance.post("/address", addressData);
      if (response.status === 201) {
        setAddresses([...addresses, response.data]);
        setModalVisible(false);
        setNewAddress({ title: "", address: "" });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Address created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating address:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create address",
      });
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress.title || !editingAddress.address) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }
    try {
      const response = await axiosInstance.put("/address", editingAddress);
      if (response.status === 200) {
        setAddresses(addresses.map((addr) => (addr.id === editingAddress.id ? response.data : addr)));
        setModalVisible(false);
        setEditingAddress(null);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Address updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating address:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update address",
      });
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const response = await axiosInstance.delete(`/address/${id}`);
      if (response.status === 200) {
        setAddresses(addresses.filter((addr) => addr.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
          await AsyncStorage.removeItem("selectedAddress"); // Xóa địa chỉ đã chọn nếu bị xóa
        }
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Address deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete address",
      });
    }
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
          saveSelectedAddress(item); // Lưu địa chỉ được chọn vào AsyncStorage
        }}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
      >
        <Ionicons
          name={selectedId === item.id ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={selectedId === item.id ? "#A64B2A" : "gray"}
        />
        <Ionicons
          name={item.type === "home" ? "home" : item.type === "work" ? "business" : "location-outline"}
          size={20}
          color="black"
          style={{ marginLeft: 10 }}
        />
        <Text style={{ marginLeft: 10, fontSize: 16, color: "#333", flex: 1 }}>
          {item.address}
        </Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          onPress={() => {
            setEditingAddress(item);
            setModalVisible(true);
          }}
        >
          <Text style={{ color: "#A9411D", fontWeight: "bold", marginRight: 15 }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={"Address"} />
      <ScrollView style={{ marginBottom: 80 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: "#666", fontSize: 16 }}>Addresses</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={{ color: "#A64B2A", fontWeight: "bold" }}>Add New</Text>
          </TouchableOpacity>
        </View>

        {addresses.map(renderAddressItem)}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: "white", margin: 20, padding: 20, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 10,
                  marginBottom: 10,
                  borderRadius: 5,
                }}
                placeholder="Title (e.g., Home, Work)"
                value={editingAddress ? editingAddress.title : newAddress.title}
                onChangeText={(text) =>
                  editingAddress
                    ? setEditingAddress({ ...editingAddress, title: text })
                    : setNewAddress({ ...newAddress, title: text })
                }
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 10,
                  marginBottom: 20,
                  borderRadius: 5,
                }}
                placeholder="Address"
                value={editingAddress ? editingAddress.address : newAddress.address}
                onChangeText={(text) =>
                  editingAddress
                    ? setEditingAddress({ ...editingAddress, address: text })
                    : setNewAddress({ ...newAddress, address: text })
                }
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setEditingAddress(null);
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={{ color: "gray" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingAddress ? handleUpdateAddress : () => handleCreateAddress(newAddress)}
                  style={{
                    backgroundColor: "#A64B2A",
                    padding: 10,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {editingAddress ? "Update" : "Save"}
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
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Use Current Location
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default EditAddress;