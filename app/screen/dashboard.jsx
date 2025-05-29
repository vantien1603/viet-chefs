import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import useAxios from '../../config/AXIOS_API';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from "../../components/header";
import { commonStyles } from '../../style';
import { t } from "i18next";

const DashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/chefs/statistics/overview');
        setStats(response.data);
        console.log(response.data)
        setLoading(false);
      } catch (err) {
        setError('Lỗi khi tải dữ liệu từ API');
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const barData = [
    { value: stats?.todayEarnings, label: t('today'), frontColor: '#10b981' },
    { value: stats?.weeklyEarnings, label: t('week'), frontColor: '#3b82f6' },
    { value: stats?.monthlyEarnings, label: t('month'), frontColor: '#8b5cf6' },
    { value: stats?.totalEarnings, label: t('total'), frontColor: '#f43f5e' },
  ];

  const pieData = [
    { value: stats?.completedBookings, color: '#10b981', text: t('done') },
    { value: stats?.canceledBookings, color: '#ef4444', text: t('cancelButton') },
    { value: stats?.pendingBookings, color: '#f59e0b', text: t('Upcoming') },
    { value: stats?.upcomingBookings, color: '#3b82f6', text: t('saptoi') },
  ].filter(item => item.value > 0);

  const statCards = [
    { label: t('totalOrder'), value: stats?.totalBookings },
    { label: t('averageRating'), value: stats?.averageRating, },
    { label: t('totalReviews'), value: stats?.totalReviews },
    { label: t('reputationPoint'), value: stats?.reputationPoints },
    { label: t('customer'), value: stats?.totalCustomers },
    { label: t('averageOrderValue'), value: `$${stats?.averageOrderValue.toFixed(2)}` },
    { label: t('completionRate'), value: `${stats?.completionRate.toFixed(2)}%` },
    { label: t('activeHours'), value: `${stats?.activeHours}h` },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t('statistic')} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView style={commonStyles.containerContent} contentContainerStyle={{ paddingBottom: 50 }}>

          <View style={styles.cardContainer}>
            {statCards.map((item, idx) => (
              <View key={idx} style={styles.card}>
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardValue}>{item.value}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t('orderStatus')}</Text>
            <LinearGradient
              colors={['#ffffff', '#f0f9ff']}
              style={styles.chartCard}
            >
              <PieChart
                data={pieData}
                donut
                radius={100}
                innerRadius={60}
                // showText
                textColor="#ffffff"
                textSize={16}
                fontWeight="bold"
                centerLabelComponent={() => (
                  <Text style={styles.pieCenterText}>
                    {stats.totalBookings} {t('orderDon')}
                  </Text>
                )}
              />
              <View style={styles.legendContainer}>
                {pieData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t('income')}</Text>
            <LinearGradient
              colors={['#ffffff', '#f0f9ff']}
              style={styles.chartCard}
            >
              <BarChart
                showValuesAsTopLabel={true}
                barWidth={40}
                barBorderRadius={8}
                data={barData}
                height={200}
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={5}
                spacing={28}
                maxValue={1000}
                showGradient
                gradientColor={{ start: '#3b82f6', end: '#10b981' }}
                textFontSize={12}
                labelWidth={50}
                xAxisLabelTextStyle={styles.axisLabel}
              />
            </LinearGradient>
          </View>

        </ScrollView>
      )
      }
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
    backgroundColor: '#f1f5f9',
  },
  headerGradient: {
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  chartContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center'
  },
  pieCenterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  axisLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  card: {
    width: '48%',
    marginBottom: 12,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    alignItems: 'center'

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default DashboardScreen;