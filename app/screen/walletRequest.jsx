import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { ScrollView, Text, View } from "react-native";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { t } from "i18next";

const WalletRequest = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const axiosInstance = useAxios();
  const handleRequest = async () => {
    try {
      const response = await axiosInstance.get(
        `/wallet-requests/users/${user.userId}`
      );
      setRequests(response.data);
      console.log("data", response.data);
    } catch (error) {
      console.log("Err", error);
    }
  };

  useEffect(() => {
    handleRequest();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("myRequest")} />
      {requests.length > 0
        ? requests.map((item) => (
            <ScrollView key={item}>
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#fff",
                  borderRadius: 10,
                }}
              >
                <Text style={{fontSize: 17, fontFamily: "nunito-bold"}}>{item?.note}</Text>
                <Text>{formatDate(item.createdAt)}</Text>
                <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                  <Text style={{ color: "green", fontFamily: "nunito-bold" }}>
                    {item.status}
                  </Text>
                  <Text style={{fontSize: 15, fontFamily: "nunito-regular"}}>${item.amount}</Text>
                </View>
              </View>
            </ScrollView>
          ))
        : null}
    </SafeAreaView>
  );
};

export default WalletRequest;
