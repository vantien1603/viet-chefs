import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Header from "../../components/header";
import { BarChart } from "react-native-gifted-charts";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment/moment";
import { commonStyles } from "../../style";
import { t } from "i18next";

const screenWidth = Dimensions.get("window").width;

const StatisticScreen = () => {
  const params = useLocalSearchParams();

  const transactions = useMemo(() => {
    const parsed = params?.transactions ? JSON.parse(params.transactions) : [];
    console.log("Transactions:", parsed); // Debug log
    return parsed;
  }, [params?.transactions]);

  const [selectedMode, setSelectedMode] = useState("Expense");
  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [maxChartValue, setMaxChartValue] = useState(1);

  useEffect(() => {
    if (transactions.length === 0) {
      // Dữ liệu mặc định khi không có giao dịch
      const defaultData = [
        { value: 0, label: moment().subtract(2, "months").format("MMM"), frontColor: "#ADD8E6" },
        { value: 0, label: moment().subtract(1, "months").format("MMM"), frontColor: "#ADD8E6" },
        { value: 0, label: "This month", frontColor: "#007AFF" },
      ];
      setExpenseData(defaultData);
      setIncomeData(defaultData);
      setTotalExpense(0);
      setTotalIncome(0);
      setMaxChartValue(1); // Đảm bảo biểu đồ hiển thị
      return;
    }

    const groupedByMonth = transactions.reduce((acc, tx) => {
      const month = moment(tx.createdAt).format("MMM");
      if (!acc[month]) acc[month] = { expense: 0, income: 0 };
      if (["DEPOSIT", "REFUND"].includes(tx.transactionType)) {
        acc[month].income += tx.amount;
      } else {
        acc[month].expense += tx.amount;
      }
      return acc;
    }, {});

    const months = [
      moment().subtract(2, "months").format("MMM"),
      moment().subtract(1, "months").format("MMM"),
      moment().format("MMM"),
    ];

    const expenseChartData = months.map((month, index) => ({
      value: (groupedByMonth[month]?.expense || 0) / 100,
      label: index === 2 ? "This month" : month,
      frontColor: index === 2 ? "#007AFF" : "#ADD8E6",
    }));

    const incomeChartData = months.map((month, index) => ({
      value: (groupedByMonth[month]?.income || 0) / 100,
      label: index === 2 ? "This month" : month,
      frontColor: index === 2 ? "#007AFF" : "#ADD8E6",
    }));

    const totalExp = transactions
      .filter((tx) => !["DEPOSIT", "REFUND"].includes(tx.transactionType))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalInc = transactions
      .filter((tx) => ["DEPOSIT", "REFUND"].includes(tx.transactionType))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const maxValue = Math.max(
      ...[...expenseChartData, ...incomeChartData].map((item) => item.value),
      1
    );

    setExpenseData(expenseChartData);
    setIncomeData(incomeChartData);
    setTotalExpense(totalExp);
    setTotalIncome(totalInc);
    setMaxChartValue(maxValue);
  }, [transactions]);

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const barData = selectedMode === "Expense" ? expenseData : incomeData;

  const amount = formatAmount(totalExpense - totalIncome);

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("expenseManagement")} />
      <Text style={{ fontSize: 18, fontWeight: "bold", margin: 10 }}>
        {t("overview")}
      </Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              selectedMode === "Expense" && styles.selectedButton,
            ]}
            onPress={() => setSelectedMode("Expense")}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="trending-up" size={20} color="#FF69B4" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonLabel}>{t("expenses")}</Text>
                <Text style={styles.buttonValue}>
                  {formatAmount(totalExpense)}
                </Text>
              </View>
              <Ionicons name="chevron-up" size={16} color="#FF9500" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              selectedMode === "Income" && styles.selectedButton,
            ]}
            onPress={() => setSelectedMode("Income")}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="trending-down" size={20} color="#00CED1" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonLabel}>{t("income")}</Text>
                <Text style={styles.buttonValue}>
                  {formatAmount(totalIncome)}
                </Text>
              </View>
              <Ionicons name="chevron-up" size={16} color="#00CED1" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={{ marginHorizontal: 10, color: "#FF9500" }}>
          {selectedMode === "Expense"
            ? t("expenseIncreased", { amount })
            : t("incomeIncreased", { amount })}
        </Text>

        {/* Bar Chart */}
        <View style={{ padding: 20 }}>
          <Text style={styles.subtext}>({t("hundred")})</Text>
          <BarChart
            data={barData}
            width={screenWidth - 40}
            height={220}
            barWidth={40}
            spacing={30}
            initialSpacing={10}
            maxValue={maxChartValue}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: "#000" }}
            yAxisLabelSuffix={t("hundred")} // Reflect scaling in hundreds
            showFractionalValues={true}
            stepValue={Math.max(maxChartValue / 4, 0.1)} // Dynamic step value
            showLine={false}
            rulesColor="#E0E0E0"
            rulesType="solid"
            frontColor="#ADD8E6"
            renderTooltip={(item) => (
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "#333", fontWeight: "bold" }}>
                  {item.value}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {t("hundred")}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// StyleSheet không thay đổi, giữ nguyên như code gốc

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginVertical: 10,
  },
  container: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  button: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: "#CCCCCC",
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 5,
    padding: 10,
  },
  selectedButton: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  buttonLabel: {
    fontSize: 14,
    color: "#333",
  },
  buttonValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  subtext: {
    fontSize: 12,
    color: "#888888",
  },
});

export default StatisticScreen;
