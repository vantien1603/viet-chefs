import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";
import { FlatList } from "react-native";
import { t } from "i18next";

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
  const { user } = useContext(AuthContext);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const PAGE_SIZE = 10;
  const [totalReviews, setTotalReviews] = useState(0);
  const [sort, setSort] = useState("newest");
  const [refresh, setRefresh] = useState(false);
  const [totalPage, setTotalPage] = useState(0);
  const [replyTexts, setReplyTexts] = useState({});
  const { showModal } = useCommonNoification();

  const fetchReviewChef = async (page = 0, sortOption = sort, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const chefIdToFetch = chefId || user.chefId;
      const response = await axiosInstance.get(`/reviews/chef/${chefIdToFetch}`, {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sort: sortOption,
        },
      });
      // setReviews((prev) => {
      //   const existingIds = new Set(prev.map((r) => r.id));
      //   const newReviews = response.data.reviews.filter((r) => !existingIds.has(r.id));
      //   return page === 0 ? response.data.reviews : [...prev, ...newReviews];
      // });

      setReviews((prev) =>
        isRefresh ? response.data.reviews : [...prev, ...response.data.reviews]
      );


      const calculatedAvg = response.data.reviews.length > 0
        ? response.data.reviews.reduce((sum, r) => sum + r.rating, 0) / response.data.reviews.length : 0;

      setAverageRating(response.data.averageRating || calculatedAvg);
      setRatingDistribution(response.data.ratingDistribution || {});
      setTotalPages(response.data.totalPages || 1);
      setPageNo(page);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      // showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
      showModal("Error", error.response.data.nessage, "Failed");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };


  useEffect(() => {
    fetchReviewChef(0, sort, true);
  }, [chefId]);

  const handleSortChange = (sortOption) => {
    if (loading) return;
    setSort(sortOption);
    setReviews([]);
    setPageNo(0);
    fetchReviewChef(0, sortOption, true);
  };

  const loadMoreData = async () => {
    if (!loading && pageNo + 1 <= totalPage - 1) {
      console.log("cal load more");
      const nextPage = pageNo + 1;
      setPageNo(nextPage);
      await fetchReviewChef(nextPage, sort);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPageNo(0);
    await fetchReviewChef(0, sort, true);
  };

  const handleReply = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`reviews/${id}/reply`, replyTexts[id]);
      console.log(response.data);
    } catch (error) {
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  }


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
        <Text style={styles.reviewCount}>{count}</Text>
      </View>
    );
  };

  const renderItem = ({ item: review }) => {
    const timeAgo = (date) => {
      const now = new Date();
      const diff = Math.floor((now - new Date(date)) / 1000);
      if (diff < 60) return `${diff} giây trước`;
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return `${Math.floor(diff / 86400)} ngày trước`;
    };

    return (
      <View style={styles.reviewItem}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: review.userAvatar || "https://via.placeholder.com/50" }}
            style={styles.avatar}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.userName}>{review.userName || "Anonymous"}</Text>
            <RatingStars rating={review.rating} />
          </View>
        </View>
        <Text style={styles.reviewText}>{review.overallExperience}</Text>
        <Text style={styles.reviewDate}>{timeAgo(review.createAt)}</Text>
        {user.roleName === "ROLE_CHEF" && (
          <>
            <TextInput
              placeholder="Reply to this review..."
              value={replyTexts[review.id] || ""}
              onChangeText={(text) =>
                setReplyTexts((prev) => ({ ...prev, [review.id]: text }))
              }
              style={[styles.replyInput, { textAlignVertical: 'top' }]}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity onPress={() => handleReply(review.id)}>
              <Text style={styles.replyButton}>Gửi phản hồi</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const maxCount = Math.max(
    ...Object.values(ratingDistribution).map((count) => count),
    1
  );
  const sortOptions = [
    { key: "newest", value: "newest" },
    { key: "oldest", value: "oldest" },
    { key: "highestRating", value: "highest-rating" },
    { key: "lowestRating", value: "lowest-rating" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reviews for" subtitle={`${chefName}`} />
      <View>
        <FlatList
          contentContainerStyle={{ padding: 20 }}
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Overall Rating</Text>
                <View style={styles.averageRatingContainer}>
                  <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                  <RatingStars rating={Math.round(averageRating)} />
                </View>
                <Text style={styles.totalItems}>{totalReviews} reviews</Text>
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
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortButtons}
                >
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortButton,
                        sort === option.value && styles.sortButtonActive,
                        loading && styles.sortButtonDisabled,
                      ]}
                      onPress={() => handleSortChange(option.value)}
                      disabled={loading}
                    >
                      {loading && sort === option.value ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.sortButtonText,
                            sort === option.value && styles.sortButtonTextActive,
                          ]}
                        >
                          {t(option.key)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          }
          ListFooterComponent={
            loading && !refresh ? (
              <ActivityIndicator size="large" color="#A64B2A" style={{ marginVertical: 20 }} />
            ) : null
          }
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          refreshing={refresh}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            !loading && (
              <Text style={{ textAlign: "center", marginTop: 30 }}>Chưa có đánh giá nào</Text>
            )
          }
        />
      </View>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  replyInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  replyButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
    color: "#A64B2A",
    fontWeight: "bold",
  },
  sortContainer: {
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  sortButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    minWidth: 100,
    alignItems: "center",
  },
  sortButtonActive: {
    backgroundColor: "#A64B2A",
    borderColor: "#A64B2A",
  },
  sortButtonDisabled: {
    opacity: 0.7,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#333",
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
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
  reviewCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    width: 30,
    textAlign: "right",
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
    borderBottomColor: "#CCCCCC",
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
  likeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});

export default ReviewsChefScreen;