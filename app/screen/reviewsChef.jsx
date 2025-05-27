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

  const fetchReviewChef = async (
    page = 0,
    sortOption = sort,
    isRefresh = false
  ) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const chefIdToFetch = chefId || user.chefId;
      const response = await axiosInstance.get(
        `/reviews/chef/${chefIdToFetch}`,
        {
          params: {
            pageNo: page,
            pageSize: PAGE_SIZE,
            sort: sortOption,
          },
        }
      );
      // setReviews((prev) => {
      //   const existingIds = new Set(prev.map((r) => r.id));
      //   const newReviews = response.data.reviews.filter((r) => !existingIds.has(r.id));
      //   return page === 0 ? response.data.reviews : [...prev, ...newReviews];
      // });

      setReviews((prev) =>
        isRefresh ? response.data.reviews : [...prev, ...response.data.reviews]
      );

      const calculatedAvg =
        response.data.reviews.length > 0
          ? response.data.reviews.reduce((sum, r) => sum + r.rating, 0) /
            response.data.reviews.length
          : 0;

      setAverageRating(response.data.averageRating || calculatedAvg);
      setRatingDistribution(response.data.ratingDistribution || {});
      setTotalPages(response.data.totalPages || 1);
      setPageNo(page);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu.", t("modal.failed"));
      showModal(t("modal.error"), error.response.data.nessage, t("modal.failed"));
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
      const response = await axiosInstance.post(
        `reviews/${id}/reply`,
        replyTexts[id]
      );
      console.log(response.data);
    } catch (error) {
      showModal(t("modal.error"), error.response.data.message, t("modal.failed"));
    } finally {
      setLoading(false);
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
          <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.userName}>{review.userName}</Text>
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
              style={[styles.replyInput, { textAlignVertical: "top" }]}
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
                  <Text style={styles.averageRating}>
                    {averageRating.toFixed(1)}
                  </Text>
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
                            sort === option.value &&
                              styles.sortButtonTextActive,
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
              <ActivityIndicator
                size="large"
                color="#A64B2A"
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          refreshing={refresh}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            !loading && (
              <Text style={{ textAlign: "center", marginTop: 30 }}>
                {t("noReviewsYet")}
              </Text>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  reviewItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  replyInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
    fontSize: 14,
    color: "#333",
    minHeight: 80,
  },
  replyButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#A64B2A",
    borderRadius: 8,
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
    fontSize: 14,
  },
  sortContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sortLabel: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 10,
  },
  sortButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortButtonActive: {
    backgroundColor: "#A64B2A",
    borderColor: "#A64B2A",
  },
  sortButtonDisabled: {
    opacity: 0.6,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#333",
    ffontFamily: "nunito-bold",
  },
  sortButtonTextActive: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  averageRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  averageRating: {
    fontSize: 28,
    fontFamily: "nunito-bold",
    color: "#A64B2A",
    marginRight: 12,
  },
  ratingDistribution: {
    marginTop: 12,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  distributionLabel: {
    width: 90,
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: "#A64B2A",
    borderRadius: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    width: 40,
    textAlign: "right",
    fontFamily: "nunito-regular"
  },
  userName: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 4,
  },
  reviewText: {
    color: "#555",
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 8,
    fontFamily: "nunito-regular"
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
    marginBottom: 10,
    fontFamily: "nunito-regular"
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  star: {
    marginRight: 4,
  },
  totalItems: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    fontFamily: "nunito-regular"
  },
});

export default ReviewsChefScreen;
