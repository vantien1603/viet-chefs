import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { useLocalSearchParams } from "expo-router";
import AXIOS_API from "../../config/AXIOS_API";

const ReviewsChefScreen = () => {
  const { id } = useLocalSearchParams();
  const [reviews, setReviews] = useState([]);
  const [chefName, setChefName] = useState("");

  // Dữ liệu giả để hiển thị
  const mockReviews = [
    {
      user: {
        name: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      foodQuality: 4, //chất lượng thức ăn
      serviceAttitude: 5, //thái độ phục vụ
      prepTime: 3, //thời gian chuẩn bị
      hygiene: 4, //vệ sinh
      comment: "Great food and excellent service! Preparation time could be faster.",
      averageRating: 4.0,
      createdAt: "2025-03-20T10:00:00Z",
    },
    {
      user: {
        name: "Jane Smith",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      },
      foodQuality: 5,
      serviceAttitude: 4,
      prepTime: 4,
      hygiene: 5,
      comment: "Really impressed with the hygiene and food quality!",
      averageRating: 4.5,
      createdAt: "2025-03-21T14:30:00Z",
    },
    {
      user: {
        name: "Mike Johnson",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      },
      foodQuality: 3,
      serviceAttitude: 3,
      prepTime: 2,
      hygiene: 4,
      comment: "Food was okay, but took too long to prepare.",
      averageRating: 3.0,
      createdAt: "2025-03-22T09:15:00Z",
    },
  ];

  useEffect(() => {
    setReviews(mockReviews);
    setChefName("Chef Gordon Ramsay");
  }, [id]);

  const RatingStars = ({ rating }) => (
    <View style={styles.starsContainer}>
      {Array(5)
        .fill()
        .map((_, i) => (
          <Icon
            key={i}
            name={i < rating ? "star" : "star-outline"}
            size={14}
            color="#f5a623"
            style={styles.star}
          />
        ))}
    </View>
  );

  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.user?.avatar || "https://via.placeholder.com/50" }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{review.user?.name || "Anonymous"}</Text>
          <View style={styles.ratingContainer}>
            {Array(5)
              .fill()
              .map((_, i) => (
                <Icon
                  key={i}
                  name={i < Math.round(review.averageRating) ? "star" : "star-outline"}
                  size={16}
                  color="#f5a623"
                />
              ))}
          </View>
        </View>
      </View>

      <Text style={styles.reviewText}>{review.comment}</Text>

      <View style={styles.reviewAspects}>
        <View style={styles.aspectItem}>
          <Text style={styles.aspectLabel}>Food Quality: </Text>
          <RatingStars rating={review.foodQuality} />
        </View>
        <View style={styles.aspectItem}>
          <Text style={styles.aspectLabel}>Service Attitude: </Text>
          <RatingStars rating={review.serviceAttitude} />
        </View>
        <View style={styles.aspectItem}>
          <Text style={styles.aspectLabel}>Prep Time: </Text>
          <RatingStars rating={review.prepTime} />
        </View>
        <View style={styles.aspectItem}>
          <Text style={styles.aspectLabel}>Hygiene: </Text>
          <RatingStars rating={review.hygiene} />
        </View>
      </View>

      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  useEffect(() => {
    const fetchReviews = async () => {
      const response = await AXIOS_API.get(`/reviews/chef/${id}`);
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`Reviews for ${chefName}`} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet for this chef</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  scrollContent: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  reviewText: {
    color: "#555",
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  reviewAspects: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  aspectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  aspectLabel: {
    color: "#666",
    fontSize: 14,
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    marginLeft: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  noReviews: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
});

export default ReviewsChefScreen;