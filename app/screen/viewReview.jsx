import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import { Image, StyleSheet, Text, View } from "react-native";
import Header from "../../components/header";
import Icon from "react-native-vector-icons/Ionicons";
import { t } from "i18next";

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
      <Header title={t("viewReviews")} />
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
                <Text style={styles.responseTitle}>{t("chefFeedback")}:</Text>
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
    fontFamily: "nunito-bold",
    marginBottom: 4,
  },
  experienceText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
    fontFamily: "nunito-regular"
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    fontFamily: "nunito-regular"
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
    fontFamily: "nunito-bold",
    marginBottom: 4,
    color: "#333",
  },
  responseText: {
    fontSize: 14,
    color: "#444",
    fontFamily: "nunito-regular"
  },
});


export default ViewReview;
