import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

const ChefStatsScreen = () => {
  const stats = {
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    todayEarnings: 0,
    totalBookings: 61,
    completedBookings: 2,
    upcomingBookings: 0,
    canceledBookings: 59,
    pendingBookings: 0,
    averageRating: 5,
    totalReviews: 1,
    reputationPoints: 97,
    performanceStatus: 'Average',
    monthlyGrowth: 0,
    weeklyGrowth: 0,
    totalCustomers: 2,
    averageOrderValue: 24.195,
    completionRate: 3.27,
    activeHours: 6,
  };

  const barData = [
    { value: stats.todayEarnings, label: 'Hôm nay' },
    { value: stats.weeklyEarnings, label: 'Tuần' },
    { value: stats.monthlyEarnings, label: 'Tháng' },
    { value: stats.totalEarnings, label: 'Tổng' },
  ];

  const pieData = [
    {
      value: stats.completedBookings,
      color: '#4CAF50',
      text: 'Hoàn tất',
    },
    {
      value: stats.canceledBookings,
      color: '#F44336',
      text: 'Hủy',
    },
  ];

  const statCards = [
    { label: 'Tổng đơn', value: stats.totalBookings },
    { label: 'Đánh giá TB', value: stats.averageRating },
    { label: 'Số đánh giá', value: stats.totalReviews },
    { label: 'Điểm uy tín', value: stats.reputationPoints },
    { label: 'Khách hàng', value: stats.totalCustomers },
    { label: 'Giá trị TB đơn', value: `$${stats.averageOrderValue.toFixed(2)}` },
    { label: 'Tỉ lệ hoàn thành', value: `${stats.completionRate.toFixed(2)}%` },
    { label: 'Giờ hoạt động', value: `${stats.activeHours}h` },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Thống kê đầu bếp</Text>

      {/* Biểu đồ cột thu nhập */}
      <Text style={styles.chartTitle}>Thu nhập</Text>
      <BarChart
        barWidth={32}
        barBorderRadius={6}
        frontColor="#3b82f6"
        data={barData}
        height={180}
        width={width - 40}
        yAxisThickness={0}
        xAxisThickness={0}
        noOfSections={4}
        spacing={30}
        maxValue={100} // giả định
      />

      {/* Biểu đồ tròn tỷ lệ đơn */}
      <Text style={styles.chartTitle}>Tình trạng đơn hàng</Text>
      <PieChart
        data={pieData}
        donut
        radius={80}
        showText
        textColor="white"
        textSize={14}
        innerRadius={45}
        centerLabelComponent={() => (
          <Text style={styles.pieCenterText}>
            {stats.totalBookings} đơn
          </Text>
        )}
      />

      {/* Thẻ thống kê */}
      <View style={styles.cardContainer}>
        {statCards.map((item, idx) => (
          <View style={styles.card} key={idx}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  pieCenterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#111827',
  },
});

export default ChefStatsScreen;
