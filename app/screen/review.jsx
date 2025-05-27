import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import { t } from "i18next";

const ReviewScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId, chefId } = params;
  const [criteria, setCriteria] = useState([]);
  const [overallExperience, setOverallExperience] = useState("");
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [criteriaComments, setCriteriaComments] = useState({});
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();

  const fetchCriteria = async () => {
    try {
      const response = await axiosInstance.get("/review-criteria");
      const criteriaList = response.data;
      const initialRatings = {};
      const initialComments = {};
      criteriaList.forEach((item) => {
        initialRatings[item.criteriaId] = 0;
        initialComments[item.criteriaId] = "";
      });

      setCriteria(criteriaList);
      setCriteriaRatings(initialRatings);
      setCriteriaComments(initialComments);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.fetchCriteriaFailed"),
        "Failed"
      );
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleRating = (criteriaId, rating) => {
    setCriteriaRatings((prev) => ({
      ...prev,
      [criteriaId]: prev[criteriaId] === rating ? 0 : rating,
    }));
  };

  const handleSubmitReview = async () => {
    setLoading(true);
    const hasAnyRating = Object.values(criteriaRatings).some(
      (rating) => rating > 0
    );

    if (!hasAnyRating) {
      showModal(t("modal.error"), t("errors.noRating"), "Failed");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        chefId: parseInt(chefId),
        bookingId: parseInt(bookingId),
        overallExperience: overallExperience.trim() || "",
        mainImage: null,
        additionalImages: [],
        criteriaRatings: { ...criteriaRatings },
      };
      const response = await axiosInstance.post("/reviews", payload);
      if (response.status === 200)
        showModal(t("modal.success"),
          t("submitReviewSuccess"),
          t("modal.succeeded")
        );
      fetchCriteria();
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình nộp đánh giá.", "Failed");
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.submitReviewFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ criteriaId, rating }) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(criteriaId, star)}
          >
            <Text style={star <= rating ? styles.filledStar : styles.emptyStar}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t("reviewBooking")} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.label}>{t("ratingCriteria")}</Text>
        {criteria.map((criterion) => (
          <View key={criterion.criteriaId} style={styles.criterionContainer}>
            <View style={styles.criterionRow}>
              <Text style={styles.criterionTitle}>{criterion.name}</Text>
              <StarRating
                criteriaId={criterion.criteriaId}
                rating={criteriaRatings[criterion.criteriaId] || 0}
              />
            </View>
          </View>
        ))}
        <Text style={styles.label}>{t("description")}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={overallExperience}
          onChangeText={setOverallExperience}
          placeholder={t("enterReviewDescription")}
          multiline
        />
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t("submitReview")}</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  label: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
    fontFamily: "nunito-regular"
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  criterionContainer: {
    marginBottom: 20,
  },
  criterionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  criterionTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#555",
    flex: 1,
  },
  starContainer: {
    flexDirection: "row",
  },
  filledStar: {
    fontSize: 24,
    color: "#FFD700", // Màu vàng cho sao đã chọn
  },
  emptyStar: {
    fontSize: 24,
    color: "#D3D3D3", // Màu xám cho sao chưa chọn
  },
  // commentInput: {
  //   borderWidth: 1,
  //   borderColor: "#DDD",
  //   borderRadius: 10,
  //   padding: 10,
  //   fontSize: 16,
  //   backgroundColor: "#fff",
  //   marginTop: 10,
  // },
  submitButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#EBE5DD",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  submitButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A64B2A80",
  },
  submitButtonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
});

export default ReviewScreen;
