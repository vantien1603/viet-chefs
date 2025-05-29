import React, { useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { t } from "i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../../config/AuthContext";
import { router } from "expo-router";
import { commonStyles } from "../../style";

const HelpCentre = () => {
  const { user } = useContext(AuthContext);
  const contact = {
    id: "phongadmin",
    name: "Admin",
  };
  const handleNavigation = () => {
    try {
      router.push({
        pathname: "/screen/message",
        params: {
          contact: JSON.stringify(contact),
        },
      });
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.navigationFailed"),
        "Failed"
      );
    }
  };
  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("helpCentre")} />
      <View style={commonStyles.containerContent}>
        <View style={styles.container}>
          <Text style={styles.text}>
            {t("greeting", { name: user?.fullName || t("guest") })}
          </Text>
          <Text style={styles.text}>{t("serviceMessage")}</Text>
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../assets/images/help.png")}
              style={styles.bgImage}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.contentContainer}
          onPress={handleNavigation}
        >
          <View
            style={{
              backgroundColor: "#F5EBDD",
              borderRadius: "50%",
              padding: 7,
            }}
          >
            <Image
              source={require("../../assets/images/help-centre.png")}
              style={styles.image}
            />
          </View>
          <View style={styles.content}>
            <Text style={{ color: "#4E342E", fontSize: 16, fontFamily: "nunito-bold" }}>
              {t("chatSupport")}
            </Text>
            <Text style={{ color: "#3E3E3E", fontSize: 14, fontFamily: "nunito-regular" }}>
              {t("supportDescription")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#A9411D",
    height: 150,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "nunito-regular"
  },
  imageWrapper: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  bgImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  contentContainer: {
    backgroundColor: "#DCC6B2",
    padding: 20,
    marginTop: 20,
    marginHorizontal: 30,
    borderRadius: 15,
    flexDirection: "row",
  },
  image: {
    width: 40,
    height: 40,
  },
  content: {
    marginLeft: 10,
  },
});

export default HelpCentre;
