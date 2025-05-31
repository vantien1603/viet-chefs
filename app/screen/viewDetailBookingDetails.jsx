import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { commonStyles } from "../../style";
import Toast from "react-native-toast-message";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { t } from "i18next";
import axios from "axios";

const ViewDetailBookingDetails = () => {
  const { bookingDetailsId } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [reportReasonDetail, setReportReasonDetail] = useState("");
  const [isReported, setIsReported] = useState(false);
  const modalizeRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingDetailsId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingDetailsId}`
      );
      setBookingDetails(response.data);
      setIsReported(response.data.reported || false);
    } catch (error) {
      console.log("Error fetching booking details:", error);
    }
  };

  const handleCompleted = async () => {
    try {
      const response = await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailsId}/complete-customer`
      );
      if (response.status === 200 || response.status === 203) {
        showModal(t("modal.success"), t("modal.success"))
        setBookingDetails({ ...bookingDetails, status: "COMPLETED" });
        fetchBookingDetails();
      }
    } catch (error) {
      console.log(
        "Error confirming completion:",
        error?.response?.data?.message
      );
      showModal(t("modal.error"), error?.response?.data?.message || "Failed to confirm", "Failed")
    }
  };

  const openReportModal = () => {
    modalizeRef.current?.open();
  };

  const closeReportModal = () => {
    modalizeRef.current?.close();
    setReportReasonDetail("");
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleSubmitReport = async () => {
    try {
      const reporterId = bookingDetails?.booking?.customer?.id;
      if (!reporterId) {
        throw new Error("Reporter ID not found");
      }

      const reportedChefId = bookingDetails?.booking?.chef?.id;
      if (!reportedChefId) {
        throw new Error("Reported chef id not found");
      }
      const reportRequest = {
        reportedChefId,
        reason: "CHEF_NO_SHOW",
        reasonDetail: reportReasonDetail.trim() || null,
        bookingDetailId: bookingDetailsId,
      };

      const response = await axiosInstance.post(
        `/reports?reporterId=${reporterId}`,
        reportRequest
      );

      if (response.status === 200) {
        showModal(t("modal.success"),
          t("reportSuccess"),

        );

        try {
          const updatedResponse = await axiosInstance.get(
            `/bookings/booking-details/${bookingDetailsId}`
          );
          setBookingDetails(updatedResponse.data);
          setIsReported(updatedResponse.data.reported || true);
        } catch (fetchError) {
          setBookingDetails({ ...bookingDetails, status: "REPORTED" });
          setIsReported(true);
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(fetchError)) {
            return;
          }
          showModal(t("modal.error"), t("fetchBookingFailed"), "Failed");
        }

        closeReportModal();
        router.replace("(tabs)/schedule");
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("fetchReportFailed"), "Failed");
    }
  };

  if (!bookingDetails) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <Header title={t("bookingDetails")} />
        <View style={styles.container}>
          <ActivityIndicator size={'large'} color={'white'} />
        </View>
      </SafeAreaView>
    );
  }

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={t("bookingDetails")} />
      <View style={commonStyles.containerContent}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("bookingInfo")}</Text>
            <View style={{ marginLeft: 10 }}>
              <Text>
                <Text style={styles.detailLabel}>{t("chef")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.booking?.chef?.user?.fullName || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("sessionDate")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.sessionDate || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("startTime")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.startTime || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("location")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.location || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("totalPrice")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.totalPrice ? `${bookingDetails.totalPrice.toFixed(2)}` : "N/A"}</Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("status")}: </Text>
                <Text style={styles.detailValue}>
                  {formatStatus(bookingDetails.status) || "N/A"}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
            <View style={{ marginLeft: 10 }}>
              <Text>
                <Text style={styles.detailLabel}>{t("chefCookingFee")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.chefCookingFee ? `$${bookingDetails.chefCookingFee.toFixed(2)}` : "$0"}</Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("priceOfDishes")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.priceOfDishes ? `$${bookingDetails.priceOfDishes.toFixed(2)}` : "$0"}</Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("platformFee")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.platformFee ? `$${bookingDetails.platformFee.toFixed(2)}` : "$0"}</Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("discountAmount")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.discountAmout ? `$${bookingDetails.discountAmout.toFixed(2)}` : "$0"}</Text>
              </Text>
            </View>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("dishes")}</Text>
            {bookingDetails.dishes?.length > 0 ? (
              bookingDetails.dishes.map((dish) => (
                <View key={dish.id} style={styles.dishItem}>
                  <Image source={{ uri: dish.dish.imageUrl }} style={{ width: 35, height: 35, borderRadius: 10 }} />
                  <Text style={styles.detailLabel}>
                    <Text>
                      {dish.dish?.name || ""}
                    </Text>
                    <Text style={styles.detailValue}>
                      {dish.notes && `(${dish.notes || ""})`}
                    </Text>
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>{t("noDishSelect")}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("moreInfo")}</Text>
            <View style={{ marginLeft: 10 }}>
              <Text>
                <Text style={styles.detailLabel}>{t("bookingType")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.booking?.bookingType || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("status")}: </Text>
                <Text style={styles.detailValue}>
                  {formatStatus(bookingDetails.booking?.status) || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("timeBeginCook")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.timeBeginCook || "N/A"}
                </Text>
              </Text>
              <Text>
                <Text style={styles.detailLabel}>{t("timeBeginTravel")}: </Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.timeBeginTravel || "N/A"}
                </Text>
              </Text>
            </View>
          </View>
          {/* Images Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("images")}</Text>
            {!bookingDetails?.images || bookingDetails?.images.length === 0 ? (
              <View style={styles.noDataContainer}>
                <MaterialIcons
                  name="image-not-supported"
                  size={24}
                  color="#A64B2A"
                />
                <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                  {t("noImagesAvailable")}
                </Text>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                {bookingDetails?.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageModal(image?.imageUrl)}
                    style={styles.imageWrapper}
                  >
                    <Image
                      source={{
                        uri: image?.imageUrl,
                      }}
                      style={styles.image}
                      resizeMode="cover"
                      onError={() =>
                        console.log(`Failed to load image: ${image?.imageUrl}`)
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          {!isReported &&
            bookingDetails.status === "WAITING_FOR_CONFIRMATION" && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#dc3545" }]}
                onPress={openReportModal}
              >
                <Text style={styles.buttonText}>{t("report")}</Text>
              </TouchableOpacity>
            )}
          {bookingDetails.status === "WAITING_FOR_CONFIRMATION" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#28a745" }]}
              onPress={()=> handleCompleted()}
            >
              <Text style={styles.buttonText}>{t("confirmCompleted")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Image Zoom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={closeImageModal}
          >
            <Image
              source={{
                uri: selectedImage,
              }}
              style={styles.zoomedImage}
              resizeMode="contain"
              onError={() =>
                console.log(`Failed to load zoomed image: ${selectedImage}`)
              }
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeImageModal}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        handlePosition="outside"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("report")}</Text>
          <Text style={styles.modalLabel}>{t("reason")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#e0e0e0" }]}
            value="Chef not arrived"
            editable={false}
          />
          <Text style={styles.modalLabel}>{t("detailOptional")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("provideDetails")}
            value={reportReasonDetail}
            onChangeText={setReportReasonDetail}
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#6c757d" }]}
              onPress={closeReportModal}
            >
              <Text style={styles.buttonText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#dc3545" }]}
              onPress={handleSubmitReport}
            >
              <Text style={styles.buttonText}>{t("submitReport")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  scrollContent: {
    // padding: 15,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 15,
    backgroundColor: "#F9F5F0",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 10,
    color: "#333",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontFamily: "nunito-regular"
  },
  label: {
    fontSize: 14,
    marginVertical: 5,
    color: "#333",
    fontFamily: "nunito-regular"
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontFamily: "nunito-regular"
  },
  dishItem: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 10,
    alignItems: 'center'
  },
  noData: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "nunito-regular"
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#EBE5DD",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    // flex: 1,
    width: '40%',
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalLabel: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontFamily: "nunito-regular"
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageWrapper: {
    width: "48%",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#f0f0f0", // Debug background
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  zoomedImage: {
    width: "90%",
    height: "70%",
    borderRadius: 8,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
});

export default ViewDetailBookingDetails;
