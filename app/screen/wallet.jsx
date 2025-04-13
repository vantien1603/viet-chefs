import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import moment from "moment/moment";

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const params = useLocalSearchParams();
  const axiosInstance = useAxios();

  const fetchWalletData = async () => {
    let mounted = true;
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet");
      if (!mounted) return;

      const walletData = response.data.wallet;
      const customerTransactions =
        response.data.customerTransactions?.content || [];
      const chefTransactions = response.data.chefTransactions?.content || [];

      setBalance(walletData.balance ?? 0);
      setWalletId(walletData.id);
      setWalletType(walletData.walletType);
      setDepositAmount(walletData.depositAmount ?? 0);

      let formattedTransactions = [];
      const txList =
        walletData.walletType === "CUSTOMER"
          ? customerTransactions
          : chefTransactions;

      formattedTransactions = txList.map((tx) => ({
        id: tx.id.toString(),
        type: tx.transactionType === "deposit" ? "deposit" : "withdrawal",
        amount: tx.amount ?? 0,
        description: tx.description || "No description",
        date: tx.createdAt
          ? moment(tx.createdAt).format("HH:mm - DD/MM/YYYY")
          : "Unknown date",
        createdAt: tx.createdAt || new Date().toISOString(),
      }));

      setTransactions(formattedTransactions);

      const filtered = formattedTransactions.filter((tx) => {
        const date = moment(tx.createdAt);
        return date.month() === 3 && date.year() === 2025;
      });
      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      if (mounted) {
        Alert.alert("Error", "Unable to load wallet data.");
      }
    }
    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/profile");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (params?.refresh === "true") {
      fetchWalletData();
    }
  }, [params?.refresh]);

  const handleDeposit = () => {
    if (walletId) {
      router.push({
        pathname: "/screen/deposit",
        params: { id: walletId, balance },
      });
    } else {
      Alert.alert("Error", "Wallet ID not found.");
    }
  };

  const handleBack = () => {
    router.push("/(tabs)/profile");
  };

  const handleStatistic = () => {
    router.push("/screen/statistic");
  };

  const toggleShowBalance = () => {
    setShowBalance(!showBalance);
  };

  const renderTransaction = ({ item, index }) => (
    <View
      style={[
        styles.transactionItem,
        {
          backgroundColor:
            index % 2 === 0 ? "rgba(0,0,0,0.05)" : "rgba(0,0,255,0.05)",
        },
      ]}
    >
      <View style={styles.transactionIcon}>
        <Ionicons
          name={
            item.type === "deposit" ? "arrow-down-circle" : "arrow-up-circle"
          }
          size={24}
          color={item.type === "deposit" ? "red" : "green"}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionBottomRow}>
          <Text style={styles.transactionDate}>{item.date}</Text>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === "deposit" ? "red" : "green" },
            ]}
          >
            {(item.amount ?? 0) > 0 ? "+" : ""}
            {(item.amount ?? 0).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="My Wallet" onLeftPress={handleBack} />
      <View style={styles.container}>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceHeader}>
            <Text style={styles.walletTitle}>VietChef Wallet</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <TouchableOpacity
                onPress={toggleShowBalance}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
              <Text style={styles.balanceText}>
                {showBalance
                  ? (balance ?? 0).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : "********"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.depositContainer}
              onPress={handleDeposit}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.depositText}>Deposit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.transactionHistory}>
            <View style={styles.headerRow}>
              <Text style={styles.monthYear}>Apr 2025</Text>
              <TouchableOpacity
                onPress={handleStatistic}
                style={styles.statisticButton}
              >
                <Text style={styles.statisticText}>Statistic</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF69B4" />
              </TouchableOpacity>
            </View>
            {filteredTransactions.length > 0 ? (
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.transactionListContainer}
              />
            ) : (
              <Text style={styles.noTransactions}>
                No transactions in April 2025.
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noTransactions}>No transactions available.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  balanceHeader: {
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    marginRight: 8,
  },
  balanceText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
  depositContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b894",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  depositText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  transactionHistory: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statisticButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  statisticText: {
    fontSize: 16,
    color: "#FF69B4",
    marginRight: 5,
    fontWeight: "500",
  },
  transactionListContainer: {
    paddingBottom: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "relative",
  },
  transactionIcon: {
    marginRight: 12,
    justifyContent: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 12,
    color: "#777",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  noTransactions: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
});

export default WalletScreen;
