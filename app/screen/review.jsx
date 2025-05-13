import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import Toast from "react-native-toast-message";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";

const ReviewScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId, chefId } = params;
  const [criteria, setCriteria] = useState([]);
  const [description, setDescription] = useState("");
  // const [overallExperience, setOverallExperience] = useState("");
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [criteriaComments, setCriteriaComments] = useState({});
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();

  useEffect(() => {
    const backAction = () => {
      router.push("/screen/history"); 
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); 
  }, []);

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
      console.error("Error fetching review criteria:", error);
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
    const hasAnyRating = Object.values(criteriaRatings).some(
      (rating) => rating > 0
    );

    if (!hasAnyRating) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        chefId: parseInt(chefId),
        bookingId: parseInt(bookingId),
        description: description.trim() || "",
        mainImage: null,
        additionalImages: [],
        criteriaRatings: { ...criteriaRatings },
      };
      console.log("Review Payload:", payload);
      const response = await axiosInstance.post("/reviews", payload);
      console.log("Review Response:", response.data);

      router.push("/screen/history");
    } catch (error) {
      console.error("Error submitting review:", error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Component hiển thị sao cho từng tiêu chí
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
          value={description}
          onChangeText={setDescription}
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
    fontWeight: "bold",
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
    fontWeight: "bold",
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
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ReviewScreen;
