import React, { useContext, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { commonStyles } from "../../style";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";


const ReviewsChefScreen = () => {
  const { chefId, chefName } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [totalPage, setTotalPage] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    "1-star": 0,
    "2-star": 0,
    "3-star": 0,
    "4-star": 0,
    "5-star": 0,
  });
  const [pageNo, setPageNo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const axiosInstance = useAxios();
  const PAGE_SIZE = 10;
  const chefIdToCall = user?.roleName === "ROLE_CHEF" ? user.chefId : chefId;
  const [replyTexts, setReplyTexts] = useState({});
  const navigation = useNavigation();
  const { showModal } = useCommonNoification();
  useEffect(() => {
    fetchReviewChef(0, true);
  }, [chefIdToCall]);

  const fetchReviewChef = async (page, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/reviews/chef/${chefIdToCall}`, {
        params: {
          page: page,
          size: PAGE_SIZE,
        },
      });
      const data = response.data;

      console.log(`data cua page ${page}`, data.reviews.length);
      setReviews((prev) =>
        isRefresh ? data.reviews : [...prev, ...data.reviews]
      );

      setTotalPage(data.totalPages);

      const calculatedAvg =
        data.reviews.length > 0
          ? data.reviews.reduce((sum, r) => sum + r.rating, 0) /
          data.reviews.length
          : 0;
      setAverageRating(data.averageRating || calculatedAvg);
      setRatingDistribution(data.ratingDistribution || {});
      setPageNo(page);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  const loadMoreData = async () => {
    if (!loading && pageNo + 1 <= totalPage - 1) {
      console.log("cal load more");
      const nextPage = pageNo + 1;
      setPageNo(nextPage);
      await fetchReviewChef(nextPage);
    }
  };
  const handleRefresh = async () => {
    setRefresh(true);
    setPageNo(0);
    await fetchReviewChef(0, true);
    setRefresh(false);
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

  const ReviewCard = ({ review, index }) => (
    <View
      style={styles.reviewCard}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: "https://via.placeholder.com/50" }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{review.userName || "Anonymous"}</Text>
          <RatingStars rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createAt).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.reviewText}>{review.description}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.navigate("screen/detailsBooking", { bookingId: review.bookingId })}>
          <Text style={{ color: 'grey' }}>View booking</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <Text>{review.reactionCounts.helpful}</Text>
          <AntDesign name="like2" size={24} color="black" />
          <Text>{review.reactionCounts.not_helpful}</Text>
          <AntDesign name="dislike2" size={24} color="black" />
        </View>

      </View>
      {/* {user.roleName === "ROLE_CHEF" && (
        <View>
          <TextInput
            placeholder="Reply to this review..."
            value={replyTexts[review.id] || ''}
            onChangeText={(text) =>
              setReplyTexts((prev) => ({ ...prev, [review.id]: text }))
            }
            style={styles.replyInput}
          />

          <TouchableOpacity onPress={() => handleReplySubmit(review.id)}>
            <Text style={styles.replyButton}>Submit</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );

  const maxCount = Math.max(
    ...Object.values(ratingDistribution).map((count) => count),
    1
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={user?.roleName === "ROLE_CHEF" ? 'Feedback' : `Reviews for ${chefName}`} />
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 50 }}
        style={commonStyles.containerContent}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.2}
        refreshing={refresh}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.summaryContainer}>
            {/* <Text style={styles.summaryTitle}>Overall Rating</Text> */}
            {/* <View style={styles.averageRatingContainer}> */}
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            {/* <RatingStars rating={Math.round(averageRating)} /> */}
            {/* </View> */}
            <View style={{ flex: 2 }} >
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
        }
        renderItem={({ item, index }) => (
          <ReviewCard key={item.id} review={item} index={index} />
        )}
        ListEmptyComponent={
          <Text style={styles.noReviews}>No reviews yet for this chef</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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

    fontSize: 30,
    fontWeight: "bold",
    color: "#f5a623",
    marginRight: 10,
  },
  ratingDistribution: {
    // marginTop: 10,
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
    backgroundColor: '#F9F5F0',
    borderRadius: 15,
    padding: 10,
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
  replyContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  replyLabel: {
    fontWeight: "bold",
    color: "#444",
  },
  replyText: {
    color: "#333",
  },
  replyInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  replyButton: {
    color: "#007AFF",
    marginTop: 5,
    fontWeight: "bold",
  },

});

export default ReviewsChefScreen;