import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";
import { StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import { useConfirmModal } from "../../context/commonConfirm";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { t } from "i18next";

const PackageRender = ({
  packages,
  loading,
  onLongPress,
  onChoose,
  selectionMode,
  selectedList,
  type,
  action,
}) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => onLongPress(item.id)}
      onPress={() => {
        if (selectionMode) {
          onChoose(item.id);
        }
      }}
      key={item.id}
      style={[
        styles.section,
        selectedList.includes(item.id) && styles.selectedCard,
      ]}
    >
      <Text numberOfLines={1} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>{t("packageName")}: </Text>
        <Text style={{ fontSize: 16, fontFamily: "nunito-bold" }}>{item.name}</Text>
      </Text>
      <Text numberOfLines={1} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>{t("duration")}: </Text>
        <Text style={styles.itemContent}>{item.durationDays} days</Text>
      </Text>
      <Text numberOfLines={2} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>{t("maxDishes")}: </Text>
        <Text style={styles.itemContent}>{item.maxDishesPerMeal}</Text>
      </Text>
      <Text numberOfLines={1} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>{t("maxGuests")}: </Text>
        <Text style={styles.itemContent}>{item.maxGuestCountPerMeal}</Text>
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {item.discount > 0 && (
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>{t("discount")}: </Text>
            <Text style={styles.itemContent}>{item.discount * 100}%</Text>
          </Text>
        )}
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: type === "sub" ? "#A9411D" : "green",
          }}
          onPress={() =>
            action(
              type === "sub" ? "Unsubscribe" : "Subscribe",
              "single",
              item.id
            )
          }
        >
          <Text style={{ color: "white", fontFamily: "nunito-regular" }}>
            {type === "sub" ? t("unsubscribe") : t("subscribe")}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={packages}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", fontSize: 16, fontFamily: "nunito-regular" }}>
            {t("noPackage")}
          </Text>
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={{ height: 100 }} />
          )
        }
      />
    </View>
  );
};

const Packages = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const [unsubscribes, setUnSubsribes] = useState([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "subcribe", title: t("tabs.subscribe") },
    { key: "unsubcribe", title: t("tabs.unsubscribe") },
  ]);
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  useEffect(() => {
    fetchPackagesAndUnsubscribes();
  }, []);

  const fetchPackagesAndUnsubscribes = async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        axiosInstance.get(`/packages`),
        axiosInstance.get(`/packages/chefs/${user.chefId}`),
      ]);

      if (allRes.status === 200 && myRes.status === 200) {
        const allPackages = allRes.data;
        const myPackages = myRes.data;

        setPackages(myPackages);

        const unsubscribed = allPackages.filter(
          (pkg) => !myPackages.some((p) => p.id === pkg.id)
        );
        setUnSubsribes(unsubscribed);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.fetchPackagesFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (packId) => {
    if (selectedPackages.includes(packId)) {
      setSelectedPackages(selectedPackages.filter((id) => id !== packId));
    } else {
      setSelectedPackages([...selectedPackages, packId]);
    }
  };

  const handleLongPress = (packId) => {
    setSelectionMode(true);
    setSelectedPackages([packId]);
  };

  const selectAll = () => {
    const allIds = index === 0 ? packages.map((d) => d.id) : unsubscribes.map((d) => d.id);
    setSelectedPackages(allIds);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedPackages([]);
  };

  const handleAction = async (type, mode, id) => {
    console.log("press", type, mode, id);
    showConfirm(
      t(`${type}ConfirmTitle`),
      t(`${type}ConfirmMessage`, { count: mode === 'single' ? 1 : selectedPackages.length }),
      () =>
        requireAuthAndNetWork(async () => {
          setLoading(true);
          try {
            const payload = {
              chefId: user.chefId,
              packageIds: mode === "single" ? [id] : selectedPackages,
            };
            console.log(payload);
            let response;

            if (type === "Unsubscribe") {
              response = await axiosInstance.post(
                "/packages/unsubscribe",
                payload
              );
            } else {
              response = await axiosInstance.post(
                "/packages/subscribe",
                payload
              );
            }
            console.log(response.data, response.status);
            if (response.status === 200) {
              showModal(
                t('modal.success'),
                t(`${type}Success`, {
                  count: mode === 'single' ? 1 : selectedPackages.length,
                }),
              );
              setSelectedPackages([]);
            }
          } catch (error) {
            if (error.response?.status === 401) {
              return;
            }
            if (axios.isCancel(error)) {
              return;
            }
            showModal(
              t('modal.error'),
              t(`errors.${type}Failed`, {
                count: mode === 'single' ? 1 : selectedPackages.length,
              }),
              "Failed"
            );
          } finally {
            setLoading(false);
            fetchPackagesAndUnsubscribes();
          }
        })
    );
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "subcribe":
        return (
          <PackageRender
            packages={packages}
            loading={loading}
            onLongPress={handleLongPress}
            onChoose={toggleSelection}
            selectionMode={selectionMode}
            selectedList={selectedPackages}
            type={"sub"}
            action={handleAction}
          />
        );
      case "unsubcribe":
        return (
          <PackageRender
            packages={unsubscribes}
            loading={loading}
            onLongPress={handleLongPress}
            onChoose={toggleSelection}
            selectionMode={selectionMode}
            selectedList={selectedPackages}
            type={"unsub"}
            action={handleAction}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t('packages')} />
      {selectionMode && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { flexDirection: "row", alignItems: "center" },
            ]}
            onPress={selectAll}
          >
            <Text style={[styles.floatingText, { color: "grey" }]}>
              {t('all')} ({selectedPackages.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: index === 0 ? "#FFCDD2" : "green",
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
            onPress={() =>
              handleAction(index === 0 ? "Unsubscribe" : "Subscribe")
            }
          >
            {/* <MaterialIcons name="delete" size={24} color="red" /> */}
            <Text
              style={[
                styles.floatingText,
                { color: index === 0 ? "grey" : "white" },
              ]}
            >
              {index === 0 ? t('unsubscribe') : t('subscribe')}
            </Text>
            <Text
              style={[
                styles.floatingText,
                { color: index === 0 ? "red" : "white" },
              ]}
            >
              ({selectedPackages.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: "#E0E0E0" }]}
            onPress={cancelSelection}
          >
            <MaterialIcons name="cancel" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={(newIndex) => {
          setIndex(newIndex);
          setSelectionMode(false);
          setSelectedPackages([]);
        }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#9C583F", height: 3 }}
            style={{
              backgroundColor: "#EBE5DD",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            }}
            activeColor="#9C583F"
            inactiveColor="gray"
            labelStyle={{ fontFamily: "nunito-bold" }}
          />
        )}
      />

      {/* <FlatList
        data={packages}
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleLongPress(item.id)}
            onPress={() => {
              if (selectionMode) {
                toggleSelection(item.id);
              } else {
                openModal(item);
              }
            }}
            key={item.id}
            style={[styles.section, selectedPackages.includes(item.id) && styles.selectedCard]}
          >
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Menu name: </Text>
              <Text style={{ fontSize: 16, fontFamily: "nunito-bold" }}>{item.name}</Text>
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Duration: </Text>
              <Text style={styles.itemContent}>{item.durationDays} days</Text>
            </Text>
            <Text numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Max dishes: </Text>
              <Text style={styles.itemContent}>{item.maxDishesPerMeal}</Text>
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Max guests: </Text>
              <Text style={styles.itemContent}>{item.maxGuestCountPerMeal}</Text>
            </Text>
            {item.discount > 0 && (
              <Text numberOfLines={1} ellipsizeMode="tail">
                <Text style={styles.itemContentLabel}>Discount: </Text>
                <Text style={styles.itemContent}>{item.discount * 100}%</Text>
              </Text>
            )}
          </TouchableOpacity>
        )}
      /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 300,
    backgroundColor: "#F9F5F0",
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemContentLabel: {
    fontFamily: "nunito-bold",
  },
  itemContent: {
    fontSize: 14,
    fontFamily: "nunito-regular"
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#F8BF40",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.03 }],
  },
  floatingActions: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
    gap: 10,
  },

  floatingButton: {
    backgroundColor: "#FFF9C4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    alignItems: "center",
  },

  floatingText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold",
  },
  modalContainer: {
    height: 500,
    padding: 20,
    paddingVertical: 40,
  },
  fieldWrapper: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  itemModalLabel: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
    flex: 1,
  },
  itemModalContent: {
    fontSize: 16,
    color: "#555",
    flex: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
    flex: 2,
  },

  buttonRow: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  updateButton: {
    backgroundColor: "orange",
    padding: 15,
    borderRadius: 10,
    width: "40%",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    width: "40%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
});

export default Packages;
