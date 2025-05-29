import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { commonStyles } from "../../style";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { useConfirmModal } from "../../context/commonConfirm";
import { t } from "i18next";
const DetailsBooking = () => {
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const route = useRoute();
  const router = useRouter();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState({});
  const { showModal } = useCommonNoification();
  const { showConfirm } = useConfirmModal();

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/bookings/${bookingId}`);
      // console.log(response.data);
      if (response.status === 200) {
        setBooking(response.data);
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
        t("errors.fetchBookingFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  let sessionDateDisplay = "";

  if (
    booking.bookingType === "SINGLE" &&
    Array.isArray(booking.bookingDetails) &&
    booking.bookingDetails.length > 0
  ) {
    sessionDateDisplay = booking.bookingDetails[0]?.sessionDate || "";
  } else if (
    booking.bookingType === "LONG_TERM" &&
    Array.isArray(booking.bookingDetails) &&
    booking.bookingDetails.length > 0
  ) {
    const details = booking.bookingDetails
      .map((d) => d?.sessionDate)
      .filter(Boolean)
      .sort();

    if (details.length <= 5) {
      const grouped = {};

      for (let date of details) {
        const [year, month, day] = date.split("-");
        const key = `${year}-${month}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(day.replace(/^0/, ""));
      }

      const formatted = Object.entries(grouped)
        .map(([key, days]) => `${key}-${days.join(",")}`)
        .join(" | ");

      sessionDateDisplay = formatted;
    } else {
      const first = details[0];
      const last = details[details.length - 1];
      sessionDateDisplay = `${first} ~ ${last}`;
    }
  }

  const firstLocation =
    booking.bookingDetails && booking.bookingDetails[0]?.location;

  const handleReject = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/reject`);
      if (response.status === 200) {
        showModal(t("modal.success"), t("rejectSuccess"));
      }
      await fetchBooking();
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.rejectFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      console.log("Toi se acept cai nafy", id);
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/confirm`);
      if (response.status === 200) {
        showModal(t("modal.success"), t("confirmSuccess"));
      }
      await fetchBooking();
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.confirmFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    showConfirm(t("modal.warning"), t("cancelWarning"), async () => {
      setLoading(true);
      try {
        const response =
          booking.bookingType === "single"
            ? await axiosInstance.put(`/bookings/single/cancel-chef/${id}`)
            : await axiosInstance.put(`/bookings/long-term/cancel-chef/${id}`);
        if (response.status === 200) {
          showModal(t("modal.success"), t("cancelSuccess"));
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
          t("errors.cancelFailed"),
          "Failed"
        );
      } finally {
        setLoading(false);
      }
    });
  };

    const handleChat = () => {
        console.log(booking.customer);
        router.push({
            pathname: "/screen/message",
            params: {
                contact: JSON.stringify({
                    id: booking.customer?.username,
                    name: booking.customer?.fullName,
                    avatar: booking.customer?.avatarUrl,
                }),
            },
        });
    };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("detailsRequest")} />
      {loading ? (
        <ActivityIndicator size={"large"} color={"white"} />
      ) : (
        <>
          <ScrollView
            style={commonStyles.containerContent}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View key={booking.id} style={styles.itemContainer}>
              <View style={{ gap: 3 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>
                    <Text style={styles.itemContentLabel}>{t("customer")}: </Text>
                    <Text style={{ fontFamily: "nunito-bold", fontSize: 16 }}>
                      {booking.customer?.fullName}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={() => handleChat()}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={30}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
                <Text>
                  <Text style={styles.itemContentLabel}>{t("phone")}: </Text>
                  <Text style={styles.itemContent}>
                    {booking.customer?.phone}
                  </Text>
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>
                    <Text style={styles.itemContentLabel}>{t("sessionDate")}: </Text>
                    <Text style={styles.itemContent}>{sessionDateDisplay}</Text>
                  </Text>
                </View>
                <Text>
                  <Text style={styles.itemContentLabel}>{t("location")}: </Text>
                  <Text style={styles.itemContent}>{firstLocation}</Text>
                </Text>
                <Text>
                  <Text style={styles.itemContentLabel}>{t("guest")}: </Text>
                  <Text style={styles.itemContent}>{booking.guestCount}</Text>
                </Text>
                <Text>
                  <Text style={styles.itemContentLabel}>{t("bookingPackage")}: </Text>
                  <Text style={styles.itemContent}>
                    {booking.bookingType === "SINGLE"
                      ? booking.bookingType
                      : booking.bookingPackage?.name}
                  </Text>
                </Text>
                <Text>
                  <Text style={styles.itemContentLabel}>{t("note")}: </Text>
                  <Text style={styles.itemContent}>
                    {booking.requestDetails}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontFamily: "nunito-bold",
                    fontSize: 20,
                    textAlign: "right",
                  }}
                >
                  ${booking.totalPrice}
                </Text>
              </View>

              <View style={styles.bookingDetailsContainer}>
                {booking.bookingDetails &&
                  booking.bookingDetails.map((detail) => (
                    <View
                      key={detail.id}
                      style={{
                        borderWidth: 0.5,
                        borderBottomColor: "#333",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        marginVertical: 10,
                      }}
                    >
                      <View style={styles.detailItem}>
                        {booking.bookingType != "SINGLE" ? (
                          <View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 1,
                              }}
                            >
                              <Text>
                                <Text style={styles.itemContentLabel}>
                                  {t("sessionDate")}:
                                </Text>
                                <Text style={styles.itemContent}>
                                  {detail.sessionDate}
                                </Text>
                              </Text>
                              <Text>
                                <Text style={styles.itemContentLabel}>
                                  {t("received")}:{" "}
                                </Text>
                                <Text
                                  style={{ fontSize: 16, fontFamily: "nunito-bold" }}
                                >
                                  ${detail.totalChefFeePrice}
                                </Text>
                              </Text>
                            </View>

                            <Text>
                              <Text style={styles.itemContentLabel}>
                                {t("time")}:{" "}
                              </Text>
                              <Text style={styles.itemContent}>
                                {detail.startTime}
                              </Text>
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 1,
                            }}
                          >
                            <Text>
                              <Text style={styles.itemContentLabel}>
                                {t("time")}:{" "}
                              </Text>
                              <Text style={styles.itemContent}>
                                {detail.startTime}
                              </Text>
                            </Text>
                            <Text>
                              <Text style={styles.itemContentLabel}>
                                {t("received")}:{" "}
                              </Text>
                              <Text
                                style={{ fontSize: 16, fontFamily: "nunito-bold" }}
                              >
                                ${detail.totalChefFeePrice}
                              </Text>
                            </Text>
                          </View>
                        )}
                        <Text>
                          <Text style={styles.itemContentLabel}>
                            {t("timeToGo")}:{" "}
                          </Text>
                          <Text style={styles.itemContent}>
                            {detail.timeBeginTravel}
                          </Text>
                        </Text>
                        <Text>
                          <Text style={styles.itemContentLabel}>
                            {t("cookingStartTime")}:{" "}
                          </Text>
                          <Text style={styles.itemContent}>
                            {detail.timeBeginCook}
                          </Text>
                        </Text>
                        <View>
                          <Text>
                            <Text style={styles.itemContentLabel}>
                              {t("dishes")}:{" "}
                            </Text>
                          </Text>
                          {detail.dishes &&
                            detail.dishes.map((dish) => (
                              <View
                                key={dish.id}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 5,
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Image
                                  source={{ uri: dish.dish.imageUrl }}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    marginRight: 10,
                                  }}
                                />
                                <View>
                                  <Text style={{ fontSize: 15, fontFamily: "nunito-regular" }}>
                                    {dish.dish.name}
                                  </Text>
                                  {!dish.notes && (
                                    <Text
                                      style={{ fontSize: 13, color: "#333", fontFamily: "nunito-regular" }}
                                    >
                                      {dish.notes}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))}
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          </ScrollView>
          {booking.status === "PAID" ||
          booking.status === "DEPOSITED" ||
          booking.status === "PAID_FIRST_CYCLE" ? (
            <View
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-around",
              }}
            >
              <TouchableOpacity
                onPress={() => handleReject(booking.id)}
                style={{
                  backgroundColor: "#A64B2A",
                  elevation: 5,
                  padding: 15,
                  alignItems: "center",
                  width: "30%",
                  borderRadius: 10,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontFamily: "nunito-bold",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {t("reject")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAccept(booking.id)}
                style={{
                  backgroundColor: "green",
                  elevation: 5,
                  padding: 15,
                  alignItems: "center",
                  width: "30%",
                  borderRadius: 10,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontFamily: "nunito-bold",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {t("confirm")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            booking.status === "CONFIRMED_PAID" ||
            booking.status === "CONFIRMED_PARTIALLY_PAID" ||
            (booking.status === "CONFIRMED" && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  right: 20,
                  backgroundColor: "red",
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  elevation: 5,
                }}
                onPress={() => handleCancel(booking.id)}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{ color: "white", fontFamily: "nunito-bold", fontSize: 16 }}
                  >
                    {t("cancel")}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    gap: 5,
    backgroundColor: "#F9F5F0",
    borderColor: "#333",
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 15,
  },
  detailItem: {
    gap: 5,
    // backgroundColor: "#FFFFFF",
    // borderBottomWidth: 1,
    borderColor: "#DDD",
    // borderRadius: 5,
    // padding: 10,
    marginVertical: 10,
  },
  itemContentLabel: {
    fontFamily: "nunito-bold",
  },
  itemContent: {
    fontSize: 14,
    fontFamily: "nunito-regular"
  },
});

export default DetailsBooking;
