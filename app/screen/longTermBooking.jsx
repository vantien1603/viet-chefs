import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import ProgressBar from "../../components/progressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

const LongTermBookingScreen = () => {
  const router = useRouter();
  const { chefId } = useLocalSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [numPeople, setNumPeople] = useState("");
  const [address, setAddress] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();
  const [addresses, setAddresses] = useState([]);
  const addressModalizeRef = useRef(null);

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress.address);
          console.log("Loaded selected address:", parsedAddress.address);
        }
      } catch (error) {
        console.error("Error loading selected address:", error);
      }
    };
    loadSelectedAddress();
  }, []);

  const fetchPackagesByChefId = async () => {
    if (!chefId) {
      setError("Không có ID đầu bếp được cung cấp.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get(`/packages/chefs/${chefId}`);
      //console.log("API Response:", response.data);

      const fetchedPackages = response.data.content || response.data || [];
      if (!Array.isArray(fetchedPackages)) {
        throw new Error("Dữ liệu gói không phải là mảng.");
      }

      setPackages(fetchedPackages);
      if (fetchedPackages.length > 0) {
        setSelectedPackage(fetchedPackages[0]);
        setNumPeople(fetchedPackages[0].maxGuestCountPerMeal.toString());
      }
    } catch (error) {
      console.log("Error fetching packages for chef:", error);
      setError("Không thể tải danh sách gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesByChefId();
  }, [chefId]);

  useEffect(() => {
    if (selectedPackage) {
      setNumPeople(selectedPackage.maxGuestCountPerMeal.toString());
    }
  }, [selectedPackage]);

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      setAddresses(response.data);
      console.log("Fetched addresses:", response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách địa chỉ",
      });
    }
  };

  const openAddressModal = () => {
    fetchAddresses();
    addressModalizeRef.current?.open();
  };

  const selectAddress = async (selectedAddress) => {
    setAddress(selectedAddress.address);
    try {
      await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
      console.log("Saved selected address:", selectedAddress.address);
    } catch (error) {
      console.error("Error saving selected address:", error);
    }
    addressModalizeRef.current?.close();
  };

  const renderAddressModal = () => (
    <Modalize
      ref={addressModalizeRef}
      handlePosition="outside"
      modalStyle={{
        backgroundColor: "#FFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleStyle={{
        backgroundColor: "#A64B2A",
        width: 40,
        height: 5,
        borderRadius: 5,
      }}
      adjustToContentHeight={true}
    >
      <View style={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 20, textAlign: "center" }}>
          Chọn Địa Chỉ
        </Text>
        {addresses.length === 0 ? (
          <Text style={{ fontSize: 16, color: "#777", textAlign: "center", marginVertical: 20 }}>
            Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới!
          </Text>
        ) : (
          addresses.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              onPress={() => selectAddress(item)}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#ddd",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 5 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 5, flexWrap: "wrap" }}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          onPress={() => addressModalizeRef.current?.close()}
          style={{
            flex: 1,
            backgroundColor: "#D1D1D1",
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#333", fontWeight: "bold", fontSize: 16 }}>
            Hủy
          </Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
  };

  const buttonStyle = {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={"Long-term Booking"} />
        <View style={{ padding: 20 }}>
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={"Long-term Booking"} />
        <View style={{ padding: 20 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.push({
      pathname: "/screen/chefDetail",
      params: { id: chefId },
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={"Long-term Booking"} onLeftPress={handleBack} />
        <ProgressBar title="Chọn gói" currentStep={2} totalSteps={4} />
        <ScrollView style={{ padding: 20, backgroundColor: "#EBE5DD" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Chọn Gói Dịch Vụ:
          </Text>
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPackage(pkg)}
                style={{
                  ...buttonStyle,
                  backgroundColor:
                    selectedPackage?.id === pkg.id ? "#A64B2A" : "#e0e0e0",
                }}
              >
                <Text
                  style={{
                    color: selectedPackage?.id === pkg.id ? "white" : "black",
                    fontSize: 16,
                  }}
                >
                  {pkg.name} - {pkg.durationDays} days
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#777" }}>
              Không có gói dịch vụ nào cho đầu bếp này.
            </Text>
          )}

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 15,
              marginBottom: 5,
            }}
          >
            Số Người:
          </Text>
          <TextInput
            style={inputStyle}
            keyboardType="numeric"
            value={numPeople}
            editable={false}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 15,
              marginBottom: 5,
            }}
          >
            Địa Chỉ:
          </Text>
          <TouchableOpacity onPress={() => openAddressModal()} style={inputStyle}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="location-on" size={20} color="#4EA0B7" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, color: address ? "#333" : "#777", flexShrink: 1, flexWrap: "wrap" }}>
                {address || "Chọn địa chỉ"}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <View>
          <TouchableOpacity
            style={{
              ...buttonStyle,
              backgroundColor: "#A64B2A",
              marginTop: 20,
              marginBottom: 20,
            }}
            onPress={() => {
              if (!selectedPackage) {
                alert("Vui lòng chọn một gói dịch vụ!");
                return;
              }
              router.push({
                pathname: "/screen/longTermSelect",
                params: {
                  selectedPackage: JSON.stringify(selectedPackage),
                  numPeople,
                  address,
                  chefId,
                },
              });
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              Tiếp Tục
            </Text>
          </TouchableOpacity>
        </View>
        {renderAddressModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default LongTermBookingScreen;