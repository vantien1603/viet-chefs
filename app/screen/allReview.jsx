import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import { Image, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import Header from "../../components/header";
import Icon from "react-native-vector-icons/Ionicons";
import { AntDesign, FontAwesome, FontAwesome5 } from "@expo/vector-icons";

const AllReview = () => {
  const axiosInstance = useAxios();
  const [reviewData, setReviewData] = useState({
    reviews: [],
    totalLikes: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/reviews/user`);
      setReviewData({
        reviews: response.data.reviews || [],
        totalLikes: response.data.totalLikes || 0,
        totalReviews: response.data.totalReviews || 0,
      });
    } catch (error) {
      console.log("Error fetching reviews:", error);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
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
      <Header title="My Reviews" />
      <View style={styles.summaryContainer}>
        <View style={styles.row}>
          <FontAwesome5 name="user" size={24} color="black" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.summaryText}>{reviewData.totalReviews}</Text>
            <Text style={styles.label}>Reviews</Text>
          </View>
        </View>
        <View style={styles.row}>
          <AntDesign name="like1" size={24} color="black" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.summaryText}>{reviewData.totalLikes}</Text>
            <Text style={styles.label}>Likes</Text>
          </View>
        </View>
      </View>
      {reviewData.reviews.length > 0 ? (
        reviewData.reviews.map((item) => (
          <View key={item.id} style={styles.reviewContainer}>
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
                <Text style={styles.responseTitle}>Phản hồi từ đầu bếp:</Text>
                <Text style={styles.responseText}>{item.response}</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noReviews}>No reviews yet.</Text>
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
  icon: {
    marginRight: 10,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontWeight: "bold",
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

export default AllReview;
