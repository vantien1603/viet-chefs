// app/longTermBooking.js
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import AXIOS_API from "../../config/AXIOS_API";
import ProgressBar from "../../components/progressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LongTermBookingScreen = () => {
  const router = useRouter();
  const { chefId } = useLocalSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [numPeople, setNumPeople] = useState("");
  const [address, setAddress] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress.address); // Hiển thị địa chỉ đã chọn
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
      const response = await AXIOS_API.get(`/packages/chefs/${chefId}`);
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
    })
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={"Long-term Booking"} onLeftPress={handleBack}/>
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
        <TextInput
          style={inputStyle}
          placeholder="Nhập địa chỉ"
          value={address}
          onChangeText={setAddress}
        />
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
    </SafeAreaView>
  );
};

export default LongTermBookingScreen;