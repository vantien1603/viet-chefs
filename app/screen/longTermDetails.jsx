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
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";

const LongTermDetailsScreen = () => {
  const { bookingId, chefId } = useLocalSearchParams();
  const [longTermDetails, setLongTermDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();

  const fetchLongTermDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/payment-cycles`
      );
      console.log("Payment cycles:", JSON.stringify(response.data, null, 2));
      setLongTermDetails(response.data || []);
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

  const handlePayment = async (paymentCycleId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/payment-cycles/${paymentCycleId}/pay`
      );
      console.log("Payment response:", JSON.stringify(response.data, null, 2));

      // Kiểm tra xem thanh toán có thành công không
      const paymentSuccessful = response.status === 200 || response.data?.status === "PAID";

      if (paymentSuccessful) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Payment successful",
        });
        // Cập nhật lại danh sách payment cycles
        await fetchLongTermDetails();

        // Điều hướng về /(tabs)/history sau khi thanh toán thành công
        router.push("/(tabs)/history");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Payment failed. Please try again.",
        });
      }
    } catch (error) {
      // console.error("Error making payment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to process payment",
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
      <Text style={styles.cycleTitle}>Cycle {cycle.cycleOrder}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 1 }}>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>{cycle.status}</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontWeight: "400" }}>{cycle.startDate}</Text>
          <Text>~</Text>
          <Text style={{ fontWeight: "400" }}> {cycle.endDate}</Text>
        </View>
      </View>

      <View style={styles.cycleInfo}>
        <Text style={{ fontWeight: "400" }}>Amount Due: ${cycle.amountDue}</Text>
      </View>
      <View style={styles.bookingDetailsContainer}>
        {cycle.bookingDetails.map((detail) => (
          <View
            key={detail.id}
            style={{ borderBottomWidth: 0.5, borderBottomColor: "#333" }}
          >
            <TouchableOpacity
              style={styles.detailItem}
              onPress={() =>
                router.push({
                  pathname: "/screen/bookingDetails",
                  params: { bookingDetailId: detail.id, chefId },
                })
              }
            >
              <View
                style={{ flexDirection: "row", padding: 1, justifyContent: "space-between" }}
              >
                <Text style={styles.detailText}>
                  Session Date: {detail.sessionDate}
                </Text>
                <Text style={{ fontWeight: "bold", fontSize: 14 }}>{detail.status}</Text>
              </View>
              <Text style={styles.detailText}>
                Start Time: {detail.startTime}
              </Text>
              <Text style={styles.detailText}>Location: {detail.location}</Text>
              <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                Total Price: ${detail.totalPrice}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {/* Nút thanh toán cho từng kỳ */}
      {cycle.status === "PENDING" && (
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handlePayment(cycle.id)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.paymentButtonText}>Pay Cycle</Text>
          )}
        </TouchableOpacity>
      )}
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
    borderWidth: 1,
    borderColor: "#DDD",
  },
  cycleTitle: {
    textAlign: "center",
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
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  detailItem: {
    marginVertical: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  paymentButton: {
    backgroundColor: "#A64B2A",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  noDataText: {
    fontSize: 16,
    color: "#9C583F",
    textAlign: "center",
    marginTop: 20,
  },
});

export default LongTermDetailsScreen;