import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DashboardScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Daily");

  const fullName = AsyncStorage.getItem("@fullName");

  const dailyData = [
    { value: 204, label: "10AM" },
    { value: 255, label: "11AM" },
    { value: 250, label: "12PM" },
    { value: 400, label: "01PM" },
    { value: 350, label: "02PM" },
    { value: 500, label: "03PM" },
    { value: 450, label: "04PM" },
  ];

  const weeklyData = [
    { value: 1200, label: "Mon" },
    { value: 1500, label: "Tue" },
    { value: 1300, label: "Wed" },
    { value: 1800, label: "Thu" },
    { value: 1600, label: "Fri" },
    { value: 2000, label: "Sat" },
    { value: 1700, label: "Sun" },
  ];

  const monthlyData = [
    { value: 5000, label: "Jan" },
    { value: 6000, label: "Feb" },
    { value: 5500, label: "Mar" },
    { value: 7000, label: "Apr" },
    { value: 6500, label: "May" },
    { value: 8000, label: "Jun" },
    { value: 7500, label: "Jul" },
  ];

  const periodData = [
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
    { label: "Monthly", value: "Monthly" },
  ];

  const chartData = useMemo(() => {
    switch (selectedPeriod) {
      case "Daily":
        return dailyData;
      case "Weekly":
        return weeklyData;
      case "Monthly":
        return monthlyData;
      default:
        return dailyData;
    }
  }, [selectedPeriod]);

  const chartConfig = useMemo(() => {
    const maxValue = Math.max(...chartData.map((item) => item.value));
    const stepValue = Math.ceil(maxValue / 10);
    return { maxValue, stepValue };
  }, [chartData]);

  const calculateTotalRevenue = () => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    return `$${total.toLocaleString()}`;
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Phần header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  borderColor: "#FF5733",
                  borderWidth: 2,
                }}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontSize: 16, color: "#383838" }}>
                  Welcome back,
                </Text>
                <Text
                  style={{ fontSize: 24, color: "#383838", fontWeight: "bold" }}
                >
                  {fullName}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Notification pressed")}>
            <Ionicons name="notifications-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Running Orders & Order Request */}
        <View style={styles.orderContainer}>
          <View style={styles.orderBox}>
            <Text style={styles.orderNumber}>20</Text>
            <Text style={styles.orderLabel}>RUNNING ORDERS</Text>
          </View>
          <View style={styles.orderBox}>
            <Text style={styles.orderNumber}>05</Text>
            <Text style={styles.orderLabel}>ORDER REQUEST</Text>
          </View>
        </View>

        {/* Total Revenue & Chart */}
        <View style={styles.revenueContainer}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueTitle}>TOTAL REVENUE</Text>
            <View style={styles.dropdown}>
              <Dropdown
                style={styles.dropdownStyle}
                data={periodData}
                labelField="label"
                valueField="value"
                value={selectedPeriod}
                onChange={(item) => setSelectedPeriod(item.value)}
                renderRightIcon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#000"
                    style={styles.dropdownIcon}
                  />
                )}
                selectedTextStyle={styles.dropdownText}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
              />
            </View>
            <TouchableOpacity>
              <Text style={styles.seeDetails}>SEE DETAILS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.revenueAmount}>{calculateTotalRevenue()}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10, minWidth: 500 }}
          >
            <LineChart
              areaChart
              curved
              data={chartData}
              width={500}
              height={150}
              spacing={70}
              color="#FF5733"
              thickness={2}
              startFillColor="#FF5733"
              endFillColor="#FF5733"
              startOpacity={0.3}
              endOpacity={0.1}
              initialSpacing={30}
              yAxisColor="#000"
              xAxisColor="transparent"
              showDataPoints
              dataPointsColor="#FF5733"
              dataPointsRadius={4}
              yAxisLabelWidth={40}
              yAxisTextStyle={{ fontSize: 12, color: "#888" }}
              yAxisLabelPrefix="$"
              stepValue={chartConfig.stepValue}
              maxValue={chartConfig.maxValue}
              xAxisLabelTextStyle={{
                fontSize: 12,
                color: "#000",
                fontWeight: "bold",
              }}
              xAxisTextNumberOfLines={1}
              xAxisLabelsHeight={20}
              xAxisLabelWidth={60}
              pointerConfig={{
                pointerStripHeight: 100,
                pointerStripColor: "#FF5733",
                pointerStripWidth: 2,
                pointerColor: "#FF5733",
                radius: 6,
                pointerLabelComponent: (items) => (
                  <View style={styles.pointerLabel}>
                    <Text style={styles.pointerText}>${items[0].value}</Text>
                  </View>
                ),
              }}
            />
          </ScrollView>
        </View>

        {/* Reviews */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>REVIEWS</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>SEE ALL REVIEWS</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsBox}>
          <Ionicons name="star" size={20} color="#FF5733" />
          <Text style={styles.rating}>4.9</Text>
          <Text style={styles.totalReviews}>TOTAL 20 REVIEWS</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    padding: 15,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F5E8D3",
    padding: 15,
    borderRadius: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  greetingContainer: {
    flexDirection: "column",
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  locationText: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  orderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  orderBox: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  orderLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  revenueContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dropdownStyle: {
    width: 100,
    height: 30,
  },
  dropdownText: {
    fontSize: 14,
    color: "#000",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000",
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  seeDetails: {
    fontSize: 12,
    color: "#FF5733",
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  reviewsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 12,
    color: "#FF5733",
  },
  reviewsBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    marginRight: 10,
  },
  totalReviews: {
    fontSize: 12,
    color: "#888",
  },
  pointerLabel: {
    backgroundColor: "#000",
    padding: 5,
    borderRadius: 5,
    width: 50,
    alignItems: "center",
  },
  pointerText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
export default DashboardScreen;