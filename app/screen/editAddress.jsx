import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
  Alert, // Thêm Alert để hiển thị confirm
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [suggestions, setSuggestions] = useState([]);

  const GOOGLE_PLACES_API_KEY = process.env.API_GEO_KEY;

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
            key: GOOGLE_PLACES_API_KEY,
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
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_PLACES_API_KEY,
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
      editingAddress
        ? setEditingAddress({ ...editingAddress, address: formattedAddress })
        : setNewAddress({ ...newAddress, address: formattedAddress });
      setSuggestions([]);
    }
  };

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
        text1: "Lỗi",
        text2: "Không thể tải danh sách địa chỉ",
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
          text1: "Quyền bị từ chối",
          text2: "Bạn cần bật dịch vụ định vị.",
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
        let fullAddress = `${addr.name || ""}, ${addr.street || ""}, ${
          addr.city || ""
        }, ${addr.region || ""}, ${addr.country || ""}`;

        const newLocation = {
          title: "Vị trí hiện tại",
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
        text1: "Lỗi",
        text2: "Không thể lấy vị trí",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (addressData) => {
    // Kiểm tra giới hạn 5 địa chỉ
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
      const response = await axiosInstance.post("/address", addressData);
      if (response.status === 201) {
        setAddresses((prev) => [...prev, response.data]);
        setModalVisible(false);
        setNewAddress({ title: "", address: "" });
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Địa chỉ đã được tạo",
        });
      }
    } catch (error) {
      console.error("Error creating address:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tạo địa chỉ",
      });
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress.title || !editingAddress.address) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền đầy đủ thông tin",
      });
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
        setEditingAddress(null);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Địa chỉ đã được cập nhật",
        });
      }
    } catch (error) {
      console.error("Error updating address:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật địa chỉ",
      });
    }
  };

  const handleDeleteAddress = (id) => {
    // Hiển thị confirm trước khi xóa
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              const response = await axiosInstance.delete(`/address/${id}`);
              if (response.status === 200) {
                setAddresses(addresses.filter((addr) => addr.id !== id));
                if (selectedId === id) {
                  setSelectedId(null);
                  await AsyncStorage.removeItem("selectedAddress");
                }
                Toast.show({
                  type: "success",
                  text1: "Thành công",
                  text2: "Địa chỉ đã được xóa",
                });
              }
            } catch (error) {
              console.error("Error deleting address:", error);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể xóa địa chỉ",
              });
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
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
          <Text
            style={{ color: "#A9411D", fontWeight: "bold", marginRight: 15 }}
          >
            Sửa
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
      <Header title={"Địa chỉ"} />
      <ScrollView style={{ marginBottom: 80 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#666", fontSize: 16 }}>Danh sách địa chỉ</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={{ color: "#A64B2A", fontWeight: "bold" }}>
              Thêm mới
            </Text>
          </TouchableOpacity>
        </View>

        {addresses.map(renderAddressItem)}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Tiêu đề (ví dụ: Nhà, Cơ quan)"
                value={editingAddress ? editingAddress.title : newAddress.title}
                onChangeText={(text) =>
                  editingAddress
                    ? setEditingAddress({ ...editingAddress, title: text })
                    : setNewAddress({ ...newAddress, title: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                value={
                  editingAddress ? editingAddress.address : newAddress.address
                }
                onChangeText={(text) =>
                  editingAddress
                    ? setEditingAddress({ ...editingAddress, address: text })
                    : setNewAddress({ ...newAddress, address: text })
                }
                onSubmitEditing={(event) =>
                  fetchAddressSuggestions(event.nativeEvent.text)
                }
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
                  <Text style={styles.cancelText}>Hủy</Text>
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
                    {editingAddress ? "Cập nhật" : "Lưu"}
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
            Sử dụng vị trí hiện tại
          </Text>
        )}
      </TouchableOpacity>
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
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
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
  },
  cancelText: {
    color: "gray",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#A64B2A",
    padding: 10,
    borderRadius: 5,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default EditAddress;