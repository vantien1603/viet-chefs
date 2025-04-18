import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";

const ReviewsChefScreen = () => {
  const { chefId, chefName } = useLocalSearchParams();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    "1-star": 0,
    "2-star": 0,
    "3-star": 0,
    "4-star": 0,
    "5-star": 0,
  });
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = useAxios();
  const PAGE_SIZE = 10;
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const backAction = () => {
      router.push({ pathname: "/screen/chefDetail", params: { chefId } });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const fetchReviewChef = async (page = 0) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/reviews/chef/${chefId}`, {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
        },
      });
      const data = response.data;
      // Kiểm tra trùng lặp ID
      const ids = data.reviews.map((r) => r.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.warn("Duplicate review IDs detected:", ids);
      }
      setReviews((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newReviews = data.reviews.filter((r) => !existingIds.has(r.id));
        return page === 0 ? data.reviews : [...prev, ...newReviews];
      });
      const calculatedAvg =
        data.reviews.length > 0
          ? data.reviews.reduce((sum, r) => sum + r.rating, 0) /
            data.reviews.length
          : 0;
      setAverageRating(data.averageRating || calculatedAvg);
      setRatingDistribution(data.ratingDistribution || {});
      setTotalPages(data.totalPages || 1);
      setPageNo(page);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewChef(0);
  }, [chefId]);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !isLoading) {
      fetchReviewChef(pageNo + 1);
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
            color={i < Math.round(rating) ? "#f5a623" : "#ccc"}
            style={styles.star}
          />
        ))}
    </View>
  );

  const RatingDistributionBar = ({ rating, count, maxCount }) => {
    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <View style={styles.distributionRow}>
        <View style={styles.distributionLabel}>
          <RatingStars rating={rating} />
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: `${barWidth}%` }]} />
        </View>
      </View>
    );
  };

  const ReviewCard = ({ review, index }) => {
    const timeAgo = (date) => {
      const now = new Date();
      const diff = Math.floor((now - new Date(date)) / 1000); // Difference in seconds

      if (diff < 60) return `${diff} seconds ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    };

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {review.userName || "Anonymous"}
            </Text>
            <RatingStars rating={review.rating} />
          </View>
        </View>

        <Text style={styles.reviewText}>{review.description}</Text>

        <Text style={styles.reviewDate}>{timeAgo(review.createAt)}</Text>
      </View>
    );
  };

  const maxCount = Math.max(
    ...Object.values(ratingDistribution).map((count) => count),
    1
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reviews for" subtitle={`${chefName}`} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (
            contentOffset.y + layoutMeasurement.height >=
              contentSize.height - 20 &&
            !isLoading
          ) {
            handleLoadMore();
          }
        }}
      >
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Overall Rating</Text>
          <View style={styles.averageRatingContainer}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            <RatingStars rating={Math.round(averageRating)} />
          </View>
          <Text style={styles.totalItems}>{totalItems} reviews</Text>

          <View style={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingDistributionBar
                key={rating}
                rating={rating}
                count={ratingDistribution[`${rating}-star`] || 0}
                maxCount={maxCount}
              />
            ))}
          </View>
        </View>

        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <ReviewCard
              key={`${review.id}-${index}`}
              review={review}
              index={index}
            />
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
  summaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  averageRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5a623",
    marginRight: 10,
  },
  ratingDistribution: {
    marginTop: 10,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionLabel: {
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: "#666",
    borderRadius: 4,
  },
  reviewCard: {
    padding: 5,
    marginBottom: 15,
    backgroundColor: "#EBE5DD",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
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
    borderWidth: 1,
    borderColor: "#ccc",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  reviewText: {
    color: "#555",
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
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
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    marginLeft: 2,
  },
  totalItems: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});

export default ReviewsChefScreen;