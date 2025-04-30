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
import { t } from "i18next";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

const formatStatus = (status) => {
  if (!status) return "";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const LongTermDetailsScreen = () => {
  const { bookingId, chefId } = useLocalSearchParams();
  const [longTermDetails, setLongTermDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const [bookingStatus, setBookingStatus] = useState(null);

  const fetchLongTermDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/payment-cycles`
      );
      setLongTermDetails(response.data || []);

      const bookingResponse = await axiosInstance.get(`/bookings/${bookingId}`);
      setBookingStatus(bookingResponse.data.status);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
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

      const paymentSuccessful =
        response.status === 200 || response.data?.status === "PAID";

      if (paymentSuccessful) {
        showModal("Success", "Thanh toán thành công", "Success");
        await fetchLongTermDetails();
        router.push("/(tabs)/history");
      } else {
        showModal("Error", "Thanh toán thất bại", "Failed");

      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình xử lí thanh toán.", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchLongTermDetails();
    }
  }, [bookingId]);

  const renderCycleItem = (cycle) => {
    console.log(`Cycle ${cycle.id} status: ${cycle.status}`);
    return (
      <View key={cycle.id} style={styles.cycleCard}>
        <Text style={styles.cycleTitle}>
          {t("cycle")} {cycle.cycleOrder}
        </Text>
        <View style={styles.cycleHeader}>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  cycle.status === "PAID"
                    ? "#2ECC71"
                    : cycle.status === "CONFIRMED" ||
                      cycle.status === "PENDING_FIRST_CYCLE"
                      ? "#A64B2A"
                      : "#E74C3C",
              },
            ]}
          >
            {formatStatus(cycle.status)}
          </Text>
          <Text style={styles.dateRange}>
            {cycle.startDate} ~ {cycle.endDate}
          </Text>
        </View>

        <View style={styles.cycleInfo}>
          <Text style={styles.cycleInfoText}>
            {t("amountDue")}:{" "}
            <Text style={styles.amount}>${cycle.amountDue}</Text>
          </Text>
        </View>

        <View style={styles.bookingDetailsContainer}>
          <Text style={styles.sectionTitle}>{t("bookingDetails")}</Text>
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
              <View style={styles.detailHeader}>
                <Text style={styles.detailText}>
                  {t("sessionDate")}: {detail.sessionDate}
                </Text>
                <Text
                  style={[
                    styles.detailStatus,
                    {
                      color:
                        detail.status === "COMPLETED"
                          ? "#2ECC71"
                          : detail.status === "PENDING"
                            ? "#A64B2A"
                            : "#E74C3C",
                    },
                  ]}
                >
                  {formatStatus(detail.status)}
                </Text>
              </View>
              <Text style={styles.detailText}>
                {t("startTime")}: {detail.startTime}
              </Text>
              <Text style={styles.detailText}>
                {t("location")}: {detail.location}
              </Text>
              <Text style={styles.detailTotal}>
                {t("totalPrice")}: ${detail.totalPrice}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {(bookingStatus === "PENDING_FIRST_CYCLE" ||
          bookingStatus === "CONFIRMED") && (
            <TouchableOpacity
              style={[styles.paymentButton, loading && styles.disabledButton]}
              onPress={() => handlePayment(cycle.id)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={styles.paymentButtonContent}>
                  <MaterialIcons name="payment" size={16} color="#FFF" />
                  <Text style={styles.paymentButtonText}>{t("payCycle")}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("paymentCycles")} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A64B2A" />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {longTermDetails.length > 0 ? (
            <>{longTermDetails.map(renderCycleItem)}</>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="error-outline" size={36} color="#A64B2A" />
              <Text style={styles.noDataText}>
                {t("noPaymentCyclesAvailable")}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    paddingBottom: 100, // Đảm bảo không bị che bởi Toast
  },
  cycleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cycleTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 16,
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateRange: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
  },
  cycleInfo: {
    marginBottom: 20,
  },
  cycleInfoText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  amount: {
    fontWeight: "700",
    color: "#A64B2A",
  },
  bookingDetailsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "400",
  },
  detailStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  paymentButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noDataText: {
    fontSize: 16,
    color: "#A64B2A",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A64B2A",
    marginTop: 8,
    fontWeight: "500",
  },
});

export default LongTermDetailsScreen;
