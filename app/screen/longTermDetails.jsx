import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AXIOS_API from "../../config/AXIOS_API";
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";

const LongTermDetailsScreen = () => {
  const { bookingId, chefId } = useLocalSearchParams();
  const [longTermDetails, setLongTermDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLongTermDetails = async () => {
    setLoading(true);
    try {
      const response = await AXIOS_API.get(
        `/bookings/${bookingId}/payment-cycles`
      );
      setLongTermDetails(response.data || []);
      console.log("Payment cycles:", JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error fetching payment cycles:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load payment cycles",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      const response = await AXIOS_API.post(`/bookings/${bookingId}/deposit`);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Deposit successful",
      });
      fetchLongTermDetails();
    } catch (error) {
      console.error("Error making deposit:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to process deposit",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchLongTermDetails();
    }
  }, [bookingId]);

  const renderCycleItem = (cycle) => (
    <View key={cycle.id} style={styles.cycleCard}>
      {/* Tiêu đề Cycle */}
      <Text style={styles.cycleTitle}>Cycle {cycle.cycleOrder}</Text>
      {/* Thông tin cơ bản của Cycle */}
      <View style={styles.cycleInfo}>
        <Text style={styles.cycleText}>Start Date: {cycle.startDate}</Text>
        <Text style={styles.cycleText}>End Date: {cycle.endDate}</Text>
        <Text style={styles.cycleText}>Amount Due: ${cycle.amountDue}</Text>
        <Text style={styles.cycleText}>Status: {cycle.status}</Text>
        <Text style={styles.cycleText}>Booking Details: {cycle.status}</Text>
      </View>
      {/* Danh sách Booking Details */}
      <View style={styles.bookingDetailsContainer}>
        {cycle.bookingDetails.map((detail) => (
          <TouchableOpacity
            key={detail.id}
            style={styles.detailItem}
            onPress={() =>
              router.push({
                pathname: "/screen/bookingDetails",
                params: { bookingDetailId: detail.id, chefId },
              })
            }
          >
            <Text style={styles.detailText}>
              Session Date: {detail.sessionDate}
            </Text>
            <Text style={styles.detailText}>
              Start Time: {detail.startTime}
            </Text>
            <Text style={styles.detailText}>Location: {detail.location}</Text>
            <Text style={styles.detailText}>
              Total Price: ${detail.totalPrice}
            </Text>
            <Text style={styles.detailText}>Status: {detail.status}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* <View style={{ height: 10 }} /> */}
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Long Term Booking Details" />
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#A64B2A"
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView style={{ padding: 20 }}>
          {longTermDetails.length > 0 ? (
            <>{longTermDetails.map(renderCycleItem)}</>
          ) : (
            <Text style={styles.noDataText}>No payment cycles available</Text>
          )}
        </ScrollView>
      )}
      <TouchableOpacity
        style={styles.paymentButton}
        onPress={handleDeposit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.paymentButtonText}>Make Deposit</Text>
        )}
      </TouchableOpacity>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cycleCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1, // Thêm viền cho Cycle
    borderColor: "#DDD",
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  cycleInfo: {
    marginBottom: 10,
  },
  cycleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  bookingDetailsContainer: {
    borderWidth: 1, // Viền bao quanh danh sách booking details
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
  },
  detailItem: {
    // backgroundColor: "#F9F9F9", // Màu nền cho từng booking detail
    borderBottomWidth: 1,
    borderColor: "#DDD",
    // borderRadius: 5,
    padding: 10,
    marginBottom: 10, // Khoảng cách giữa các booking detail
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  paymentButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  paymentButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#9C583F",
    textAlign: "center",
    marginTop: 20,
  },
});

export default LongTermDetailsScreen;
