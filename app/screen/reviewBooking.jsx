import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Header from '../../components/header';
import ProgressBar from '../../components/progressBar';
import { useLocalSearchParams } from "expo-router";

const ReviewBookingScreen = () => {
  const params = useLocalSearchParams();
  const bookingData = JSON.parse(params.bookingData || '{}');

  const calculateSubtotal = () => {
    return bookingData.bookingDetails?.reduce((sum, detail) => sum + detail.totalPrice, 0) || 0;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Review Booking" />
      <ProgressBar title="Xác nhận" currentStep={4} totalSteps={4} />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Chi tiết đặt chỗ dài hạn</Text>
        
        {/* Booking Details for Each Date */}
        {bookingData.bookingDetails?.map((detail, index) => (
          <View key={index} style={styles.dateContainer}>
            <Text style={styles.dateTitle}>{detail.sessionDate}</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian:</Text>
                <Text style={styles.detailValue}>
                  {detail.startTime.slice(0,5)} - {detail.endTime.slice(0,5)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí đến nơi:</Text>
                <Text style={styles.detailValue}>
                  ${detail.arrivalFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí nấu ăn:</Text>
                <Text style={styles.detailValue}>
                  ${detail.chefCookingFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí phục vụ:</Text>
                <Text style={styles.detailValue}>
                  ${detail.chefServingFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí món ăn:</Text>
                <Text style={styles.detailValue}>
                  ${detail.priceOfDishes.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí nền tảng:</Text>
                <Text style={styles.detailValue}>
                  ${detail.platformFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, styles.totalLabel]}>
                  Tổng cộng ngày:
                </Text>
                <Text style={[styles.detailValue, styles.totalValue]}>
                  ${detail.totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>
              ${calculateSubtotal().toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá:</Text>
            <Text style={[styles.summaryValue, styles.discount]}>
              -${bookingData.discountAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.totalLabel]}>
              Tổng cộng:
            </Text>
            <Text style={[styles.summaryValue, styles.totalValue]}>
              ${bookingData.totalPrice?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Địa điểm:</Text>
          <Text style={styles.infoValue}>
            {bookingData.bookingDetails?.[0]?.location || 'N/A'}
          </Text>
          <Text style={styles.infoLabel}>Dịch vụ phục vụ:</Text>
          <Text style={styles.infoValue}>
            {bookingData.bookingDetails?.some(detail => detail.isServing) ? 'Có' : 'Không'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBE5DD',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A64B2A',
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discount: {
    color: '#FF5733',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#A64B2A',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ReviewBookingScreen;