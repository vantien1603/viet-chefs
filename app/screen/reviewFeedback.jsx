import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";

const ReviewFeedback = () => {
  const router = useRouter();

  const [foodQuality, setFoodQuality] = useState(0);
  const [serviceAttitude, setServiceAttitude] = useState(0);
  const [prepTime, setPrepTime] = useState(0);
  const [hygiene, setHygiene] = useState(0);
  const [comment, setComment] = useState("");
  const [averageRating, setAverageRating] = useState(0); 
  const { showModal } = useCommonNoification();

  useEffect(() => {
    const total = foodQuality + serviceAttitude + prepTime + hygiene;
    const count = [foodQuality, serviceAttitude, prepTime, hygiene].filter((rating) => rating > 0).length;
    const average = count > 0 ? total / count : 0;
    setAverageRating(average.toFixed(1)); 
  }, [foodQuality, serviceAttitude, prepTime, hygiene]);

  const renderStars = (rating, setRating) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={30}
              color={star <= rating ? "#FFD700" : "#ccc"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderAverageStars = () => {
    const roundedAverage = Math.round(averageRating); 
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= roundedAverage ? "star" : "star-outline"}
            size={20}
            color={star <= roundedAverage ? "#FFD700" : "#ccc"}
          />
        ))}
        <Text style={styles.averageText}> ({averageRating} sao)</Text>
      </View>
    );
  };

  const handleSubmit = () => {
    const reviewData = {
      foodQuality,
      serviceAttitude,
      prepTime,
      hygiene,
      comment,
      averageRating,
    };
    console.log("Đánh giá đã gửi:", reviewData);
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
        <Header title="Đánh giá" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>

        <View style={styles.averageContainer}>
          <Text style={styles.averageLabel}>Điểm trung bình:</Text>
          {renderAverageStars()}
        </View>

        <View style={styles.criteriaContainer}>
          <Text style={styles.label}>Chất lượng món ăn</Text>
          {renderStars(foodQuality, setFoodQuality)}
        </View>

        <View style={styles.criteriaContainer}>
          <Text style={styles.label}>Thái độ phục vụ</Text>
          {renderStars(serviceAttitude, setServiceAttitude)}
        </View>

        <View style={styles.criteriaContainer}>
          <Text style={styles.label}>Thời gian chuẩn bị</Text>
          {renderStars(prepTime, setPrepTime)}
        </View>

        <View style={styles.criteriaContainer}>
          <Text style={styles.label}>Vệ sinh</Text>
          {renderStars(hygiene, setHygiene)}
        </View>

        <Text style={styles.label}>Nhận xét của bạn</Text>
        <TextInput
          style={styles.textArea}
          value={comment}
          onChangeText={setComment}
          placeholder="Viết nhận xét của bạn về đầu bếp..."
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, (!foodQuality || !serviceAttitude || !prepTime || !hygiene) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!foodQuality || !serviceAttitude || !prepTime || !hygiene}
        >
          <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  averageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  averageText: {
    fontSize: 16,
    marginLeft: 5,
  },
  criteriaContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  submitButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReviewFeedback;