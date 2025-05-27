import React, { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import useAxios from "../../config/AXIOS_API";
import { router } from "expo-router";
import { commonStyles } from "../../style";
import { Image, ActivityIndicator } from "react-native";
import Header from "../../components/header";
import Icon from "react-native-vector-icons/Ionicons";
import {
  AntDesign,
  FontAwesome,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "i18next";

const AllReview = () => {
  const axiosInstance = useAxios();
  const [reviewData, setReviewData] = useState({
    reviews: [],
    totalLikes: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customReason, setCustomReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const predefinedReasons = [
    t("predefinedReasons.misleading"),
    t("predefinedReasons.offensive"),
    t("predefinedReasons.unprofessional"),
    t("predefinedReasons.other"),
  ];
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/reviews/user`);
      console.log("API Response:", response.data);
      setReviewData({
        reviews: response.data.reviews || [],
        totalLikes: response.data.totalLikes || 0,
        totalReviews: response.data.totalReviews || 0,
      });
    } catch (error) {
      console.log("Error fetching reviews:", error);
      setError(t("errors.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const handleReasonSelect = (reason) => {
    setSelectedReasons((prev) => {
      if (prev.includes(reason)) {
        return prev.filter((r) => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
    if (
      reason === t("predefinedReasons.other") &&
      selectedReasons.includes(t("predefinedReasons.other"))
    ) {
      setCustomReason("");
    }
  };

  const handleReview = (bookingId) => {
    if (bookingId) {
      router.push({
        pathname: "/screen/viewBookingDetails",
        params: { bookingId },
      });
    } else {
      console.warn("Booking ID not found for this review");
    }
  };

  const openReportModal = (review) => {
    setSelectedReview(review);
    setSelectedReasons([]);
    setCustomReason("");
    setReasonDetail("");
    setModalVisible(true);
  };

  const handleReport = async () => {
    if (!selectedReview || (!selectedReasons.length && !customReason.trim())) {
      alert(t("errors.selectReason"));
      return;
    }

    const combinedReasons = [
      ...selectedReasons,
      customReason.trim() ? customReason.trim() : null,
    ]
      .filter(Boolean)
      .join(", ");

    const payload = {
      reportedChefId: selectedReview.chefId,
      reason: combinedReasons,
      reasonDetail: reasonDetail.trim() || "No additional details provided",
      reviewId: selectedReview.id,
    };

    try {
      const response = await axiosInstance.post("/reports/others", payload);
      console.log("Report submitted:", response.data);
      setModalVisible(false);
      alert(t("reportSubmitted"));;
    } catch (error) {
      console.log("Error submitting report:", error);
      alert(t("errors.failedToReport"));
    }
  };

  const RatingStars = ({ rating }) => (
    <View style={styles.starsContainer}>
      {Array(5)
        .fill()
        .map((_, i) => (
          <Icon
            key={i}
            name={i < Math.round(rating) ? "star" : "star-outline"}
            size={14}
            color={i < Math.round(rating) ? "#f5a623" : "#CCCCCC"}
            style={styles.star}
          />
        ))}
    </View>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.containerContent, styles.centered]}>
        <ActivityIndicator size="large" color="#A9411D" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[commonStyles.containerContent, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("myReviews")} />
      <View style={styles.summaryContainer}>
        <View style={styles.row}>
          <FontAwesome5 name="user" size={24} color="black" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.summaryText}>{reviewData.totalReviews}</Text>
            <Text style={styles.label}>{t("reviews")}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <AntDesign name="like1" size={24} color="black" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.summaryText}>{reviewData.totalLikes}</Text>
            <Text style={styles.label}>{t("likes")}</Text>
          </View>
        </View>
      </View>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("reportReview")}</Text>
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>{t("selectReasons")}:</Text>
              <View style={styles.reasonButtonContainer}>
                {predefinedReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonButton,
                      selectedReasons.includes(reason) &&
                        styles.reasonButtonSelected,
                    ]}
                    onPress={() => handleReasonSelect(reason)}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        selectedReasons.includes(reason) &&
                          styles.reasonButtonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedReasons.includes(t("predefinedReasons.other")) && (
                <TextInput
                  style={styles.input}
                  placeholder={t("placeholders.customReason")}
                  value={customReason}
                  onChangeText={setCustomReason}
                  editable={selectedReasons.includes(t("predefinedReasons.other"))}
                />
              )}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t("placeholders.additionalDetails")}
              value={reasonDetail}
              onChangeText={setReasonDetail}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReport}
              >
                <Text style={styles.modalButtonText}>{t("submit")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {reviewData.reviews.length > 0 ? (
        reviewData.reviews.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.reviewContainer}
            onPress={() => handleReview(item.bookingId)}
            activeOpacity={0.8}
          >
            <View style={styles.reviewHeader}>
              <Image
                source={{ uri: item.userAvatar }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.userName}</Text>
                <RatingStars rating={item.rating} />
              </View>
            </View>
            <Text style={styles.overallExperience}>
              {item.overallExperience}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.createAt)}</Text>
            {item.response && (
              <View style={styles.responseBox}>
                <TouchableOpacity
                  onPress={toggleExpand}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.responseTitle}>{t("responseFromChef")}:</Text>
                  <MaterialIcons
                    name={expanded ? "arrow-drop-up" : "arrow-drop-down"}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
                {expanded && (
                  <Text style={styles.responseText}>{item.response}</Text>
                )}
              </View>
            )}
            <View style={styles.reportContainer}>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => openReportModal(item)}
              >
                <Text style={styles.reportText}>{t("report")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noReviews}>{t("noReviews")}</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#A9411D",
    textAlign: "center",
    fontFamily: "nunito-regular",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  reviewContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  overallExperience: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    marginLeft: 2,
  },
  noReviews: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "nunito-regular",
  },
  responseBox: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  responseTitle: {
    fontFamily: "nunito-bold",
    marginBottom: 4,
    color: "#333",
  },
  responseText: {
    fontSize: 14,
    color: "#444",
    fontFamily: "nunito-regular",
  },
  reportContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  reportButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fc7f03",
    width: 100,
    alignItems: "center",
  },
  reportText: {
    color: "#fff",
    fontFamily: "nunito-regular",
  },
  reasonContainer: {
    marginBottom: 15,
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    marginBottom: 8,
    color: "#333",
  },
  reasonButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  reasonButton: {
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  reasonButtonSelected: {
    backgroundColor: "#fc7f03",
  },
  reasonButtonText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  reasonButtonTextSelected: {
    color: "#fff",
    fontFamily: "nunito-bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
    fontFamily: "nunito-regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  submitButton: {
    backgroundColor: "#fc7f03",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
});

export default AllReview;
