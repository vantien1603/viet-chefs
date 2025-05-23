import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import { Image, StyleSheet, Text, View } from "react-native";
import Header from "../../components/header";
import Icon from "react-native-vector-icons/Ionicons";

// {"hasReview": true, "message": "BR-46: Buổi đặt này đã có đánh giá.",
// "review": {"additionalImageUrls": [], "bookingId": 148, "chefId": 1,
// "chefResponseAt": null, "createAt": "2025-05-14T10:17:13.870877",
// "description": null, "id": 14, "mainImageUrl": null, "overallExperience": "Tốt",
// "rating": 4, "reactionCounts": {"helpful": 0, "not_helpful": 0}, "response": null,
// "userAvatar": "https://vietchef.blob.core.windows.net/vietchefimage/1d7773c1-67f3-45f7-8fcc-792dd9b9623f-7ec95ed9-3048-4547-b39e-0b7f90aa520b.jpeg",
// "userId": 17, "userName": "Vũ Thị Em"}}
const ViewReview = () => {
  const { bookingId, chefId } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const [reviews, setReviews] = useState(null);

  const fetchReview = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/booking/${bookingId}`);
      setReviews(response.data.review);
      console.log("data", response.data.review);
    } catch (error) {
      console.log("er", error);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

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

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="View reviews" />
      <View style={styles.container}>
        {reviews && (
          <>
            <View style={styles.row}>
              <Image
                source={{ uri: reviews?.userAvatar }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{reviews?.userName}</Text>
                <RatingStars rating={reviews?.rating} />
              </View>
            </View>

            <Text style={styles.experienceText}>
              {reviews.overallExperience}
            </Text>
            <Text style={styles.dateText}>{formatDate(reviews.createAt)}</Text>

            {reviews.response && (
              <View style={styles.responseBox}>
                <Text style={styles.responseTitle}>Phản hồi từ đầu bếp:</Text>
                <Text style={styles.responseText}>{reviews.response}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  experienceText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    marginRight: 2,
  },
  responseBox: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  responseTitle: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  responseText: {
    fontSize: 14,
    color: "#444",
  },
});


export default ViewReview;
