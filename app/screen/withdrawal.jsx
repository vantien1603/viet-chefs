import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";
import { useConfirmModal } from "../../context/commonConfirm";
import axios from "axios";
import { t } from "i18next";

const WithdrawalScreen = () => {
  const params = useLocalSearchParams();
  const balance = Number(params.balance);
  const walletId = params.id;
  const paypalAccountEmail = params.paypalAccountEmail;
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");
  const axiosInstance = useAxios();
  const [email, setEmail] = useState(paypalAccountEmail || "");
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useContext(AuthContext);
  const { showModal } = useCommonNoification();
  const { showConfirm } = useConfirmModal();
  const router = useRouter();

  const amo = parseFloat(withdrawAmount);
  const isWithdraw = !withdrawAmount || amo <= 0 || isNaN(amo) || amo > balance;

  const predefinedAmounts = [5, 10, 20, 50, 100, 500];

  const handleAmountPress = (amount) => {
    const text = String(amount);
    setWithdrawAmount(text);
  };

  const check = (text) => {
    const amount = parseFloat(text);

    if (amount > balance) {
      setError(t("amountOverBalance"));
    } else if (amount < 2) {
      setError(t("amountTooLow"));
    } else {
      setError("");
    }
  };

  useEffect(() => {
    check(withdrawAmount);
  }, [withdrawAmount]);

  const handleWithdraw = () => {
    showConfirm(
      t("createWithdrawalRequest"),
      t("confirmWithdrawal", {
        amount: `$${parseFloat(withdrawAmount).toFixed(2)}`,
      }),
      async () => {
        const payload = {
          userId: user.userId,
          requestType: "WITHDRAWAL",
          amount: parseFloat(withdrawAmount),
          note: t("withdrawalNote"),
        };
        try {
          const response = await axiosInstance.post("wallet-requests", payload);
          setWithdrawAmount("");
          console.log("Tạo yêu cầu thành công", response.data);
          showModal(t("modal.success"), t("withdrawalSuccess"));
        } catch (error) {
          if (axios.isCancel(error) || error.response.status === 401) return;
          showModal(
            t("modal.error"),
            error.response.data.message,
            t("modal.failed")
          );
        }
      }
    );
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const toggleEditing = () => {
    if (isEditing) {
      if (!email) {
        showModal(t("modal.error"), t("emailRequired"), t("modal.failed"));
        return;
      }
      if (!validateEmail(email)) {
        showModal(t("modal.error"), t("emailInvalid"), t("modal.failed"));
        return;
      }
      handleUpdateEmail(email);
    } else {
      setIsEditing(true);
    }
  };

  const handleUpdateEmail = async (newEmail) => {
    try {
      const response = await axiosInstance.put(
        `/users/profile/my-wallet?email=${encodeURIComponent(newEmail)}`
      );
      console.log("email updated", response.data);
      setEmail(newEmail);
      setIsEditing(false);
      showModal(t("modal.success"), t("updateEmailSuccess"));
    } catch (error) {
      if (axios.isCancel(error) || error.response.status === 401) return;
      showModal(
        t("modal.error"),
        error.response.data?.message,
        t("modal.failed")
      );
    }
  };

  const handleBack = () => {
    router.replace("/screen/wallet");
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header
        title="Withdrawal"
        onLeftPress={() => handleBack()}
        rightText={"Requests"}
        onRightPress={() => router.push("screen/walletRequest")}
      />
      <View style={styles.container}>
        <Text style={styles.title}>{t("withdrawFrom")}</Text>
        <View style={styles.walletContainer}>
          <Text style={styles.walletText}>{t("vietchefWallet")}</Text>
          <Text style={styles.balanceText}>${balance}</Text>
        </View>
        <View style={styles.emailContainer}>
          <Text style={styles.label}>{t("paypalAccountEmail")}</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputEmail}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              placeholder={t("enterPayPalEmail")}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={toggleEditing}>
              {isEditing ? (
                <MaterialIcons name="check" size={24} color="green" />
              ) : (
                <MaterialIcons name="edit" size={24} color="black" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("withdrawAmount")}</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={styles.input}
              placeholder="$0"
              value={withdrawAmount}
              onChangeText={(text) => {
                setWithdrawAmount(text);
              }}
              keyboardType="numeric"
            />
            {withdrawAmount.length > 0 && (
              <TouchableOpacity
                onPress={() => setWithdrawAmount("")}
                style={styles.clearIcon}
              >
                <MaterialIcons
                  name="highlight-remove"
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            )}
          </View>
          {error ? (
            <Text style={{ color: "red", marginTop: 5 }}>{error}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.amountButtonsContainer}>
        {predefinedAmounts.map((amount, index) => (
          <TouchableOpacity
            key={index}
            style={styles.amountButton}
            onPress={() => handleAmountPress(amount)}
          >
            <Text style={styles.amountText}>${amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            { backgroundColor: isWithdraw ? "#CCCCCC" : "#A9411D" },
          ]}
          onPress={handleWithdraw}
          disabled={isWithdraw}
        >
          <Text style={styles.withdrawButtonText}>{t("withdraw")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  walletContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FF6347",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#FFE4E1",
  },
  walletText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  emailContainer: {
    marginTop: 10,
  },
  inputEmail: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 5,
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#F5F5F5",
  },
  amountButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 5,
  },
  amountButton: {
    width: "30%",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  withdrawButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearIcon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }], // Căn giữa icon theo chiều dọc (24/2 = 12)
    zIndex: 1,
  },
});

export default WithdrawalScreen;
