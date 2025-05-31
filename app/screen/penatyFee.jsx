import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefContext } from '../../context/ChefContext';
import { Text, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import Header from '../../components/header';
import { t } from "i18next";
import useAxios from '../../config/AXIOS_API';
import { useCommonNoification } from '../../context/commonNoti';
import { useConfirmModal } from '../../context/commonConfirm';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { commonStyles } from '../../style';
import { Modalize } from 'react-native-modalize';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const PenaltyFee = () => {
    const { chefInfo, fetchChefInfo } = useContext(ChefContext);
    const [isLoading, setIsLoading] = useState(false);
    const axiosInstance = useAxios();
    const isAccountLocked = chefInfo.reputationPoint < 60 || chefInfo.penaltyFee > 0;
    const { showModal } = useCommonNoification();
    const { showConfirm } = useConfirmModal();
    const [balance, setBalance] = useState(0);
    const [hasPassword, setHasPassword] = useState(false);
    const [isPaySuccess, setIsPaySuccess] = useState(false);
    const router = useRouter();
    const modalizeRef = useRef(null);
    const [pinValues, setPinValues] = useState(["", "", "", ""]);
    const pinInputRefs = useRef([
        React.createRef(),
        React.createRef(),
        React.createRef(),
        React.createRef(),
    ]).current;
    const pin = pinValues.join("");
    const [showBalance, setShowBalance] = useState(false);
    const toggleBalance = () => setShowBalance((prev) => !prev);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchBalanceInWallet();
        checkWalletPassword();
    }, [])


    const handlePayPenalty = async () => {
        console.log("ququq")
        if (!chefInfo.penaltyFee) {
            return;

        }
        setIsLoading(true);
        try {
            const response = await axiosInstance.put('/chefs/unlock');
            // console.log("cccasd", response);
            showModal(t("modal.success"), t("payFineSuccess"),);
            fetchChefInfo();
        } catch (error) {
            if (axios.isCancel(error) || error.response?.status === 401) return;
            showModal(t("modal.error"), error.response.data.message || t('errors.paymentFailed'), "Failed")
        } finally {
            setIsLoading(false);
        }
    };

    const checkWalletPassword = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(
                "/users/profile/my-wallet/has-password"
            );
            console.log(response.data);
            setHasPassword(response.data);
        } catch (error) {
            if (axios.isCancel(error) || error.response?.status === 401) return;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBalanceInWallet = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get("/users/profile/my-wallet");
            const wallet = response.data;
            setBalance(wallet.balance);
        } catch (error) {
            if (axios.isCancel(error) || error.response?.status === 401) return;
            showModal(
                t("modal.error"),
                t("errors.fetchBalanceFailed"),
                "Failed"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const accessWallet = async () => {
        if (pin.length !== 4) {
            setError(t("pinMustBe4Digits"));
            return;
        }
        setIsLoading(true);
        try {
            const response = await axiosInstance.post(
                `/users/profile/my-wallet/access?password=${pin}`
            );
            setError("");
            if (response.data === true) {
                await handlePayPenalty();
                modalizeRef.current?.close();
            } else {
                setError(t("invalidPin"));
                setPinValues(["", "", "", ""]);
                pinInputRefs[0].current?.focus();
            }
        } catch (error) {
            if (axios.isCancel(error) || error.response?.status === 401) return;
            setError(t("invalidPin"));
            setPinValues(["", "", "", ""]);
            pinInputRefs[0].current?.focus();
        } finally {
            setIsLoading(false);
            setPinValues(["", "", "", ""]);
        }
    };

    const confirmPayment = () => {
        console.log('viiiiii')
        setPinValues(["", "", "", ""]);
        modalizeRef.current?.open();
        setTimeout(() => pinInputRefs[0].current?.focus(), 100);
    };

    const handlePinChange = (text, index) => {
        const firstEmptyIndex = pinValues.findIndex((val) => val === "");
        const validIndex = firstEmptyIndex === -1 ? 3 : firstEmptyIndex;

        if (index !== validIndex) {
            pinInputRefs[validIndex].current?.focus();
            return;
        }

        const newPinValues = [...pinValues];
        newPinValues[index] = text.replace(/[^0-9]/g, "").slice(0, 1);
        setPinValues(newPinValues);

        if (text && index < 3) {
            pinInputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === "Backspace") {
            const lastFilledIndex = pinValues
                .slice(0, 4)
                .reduce((last, val, i) => (val !== "" ? i : last), -1);

            if (lastFilledIndex >= 0) {
                const newPinValues = [...pinValues];
                newPinValues[lastFilledIndex] = "";
                setPinValues(newPinValues);
                pinInputRefs[lastFilledIndex].current?.focus();
            }
        }
    };

    return (
        <GestureHandlerRootView>
            <SafeAreaView style={commonStyles.container}>
                <Header title={t('payFineHeader')} />
                <View style={commonStyles.containerContent}>
                    <View style={styles.card}>
                        {isAccountLocked ? (
                            <>
                                <Text style={styles.title}>{t('accountLocked')}</Text>
                                <Text style={styles.infoText}>
                                    {t('reputationPoint')} {chefInfo.reputationPoints}/100
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 30, alignItems: 'center' }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={styles.priceLabel}>
                                            {t("balance")}: {showBalance ? balance : "***"}
                                        </Text>
                                        <TouchableOpacity onPress={toggleBalance} style={{ marginLeft: 8 }}>
                                            <MaterialIcons
                                                name={showBalance ? "visibility" : "visibility-off"}
                                                size={20}
                                                color="#555"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {chefInfo.penaltyFee > 0 && (
                                        <Text style={styles.feeText}>
                                            {t('penatyFee')}: ${(chefInfo.penaltyFee) || 0}
                                        </Text>
                                    )}
                                </View>

                                <Text style={styles.infoText}>
                                    {t('payFine')}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.payButton, isLoading
                                        // || !chefInfo.penaltyFee ? styles.disabledButton : {}
                                    ]}
                                    onPress={() => hasPassword ? confirmPayment() : handlePayPenalty()}
                                // disabled={isLoading || !chefInfo.penaltyFee}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.payButtonText}>
                                            {chefInfo.penaltyFee > 0 ? t('payment') : t('unlocked')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>{t('activeAccount')}</Text>
                                <Text style={styles.infoText}>
                                    {t('reputationPoint')}: {chefInfo?.reputationPoints}/100
                                </Text>
                                <Text style={styles.successText}>{t('keepUpGood')}</Text>
                            </>
                        )}
                    </View>

                </View>
            </SafeAreaView>

            <Modalize
                ref={modalizeRef}
                adjustToContentHeight={true}
                handlePosition="outside"
                modalStyle={styles.modalStyle}
                handleStyle={styles.handleStyle}
                onOpened={() => {
                    const firstEmptyIndex = pinValues.findIndex((val) => val === "");
                    const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
                    pinInputRefs[focusIndex].current?.focus();
                }}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            modalizeRef.current?.close();
                            setPinValues(["", "", "", ""]);
                            setError("");
                        }}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{t("enterWalletPin")}</Text>
                    <Text style={styles.modalSubtitle}>{t("enter4DigitPin")}</Text>
                    <View style={styles.pinContainer}>
                        {[0, 1, 2, 3].map((index) => (
                            <View key={index} style={styles.pinBox}>
                                <TextInput
                                    ref={pinInputRefs[index]}
                                    style={styles.pinInput}
                                    value={pinValues[index]}
                                    onChangeText={(text) => handlePinChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    secureTextEntry={true}
                                    textAlign="center"
                                    selectionColor="transparent"
                                />
                            </View>
                        ))}
                    </View>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                    <TouchableOpacity
                        style={{
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            backgroundColor: "#A64B2A",
                            borderRadius: 20,
                        }}
                        onPress={() => accessWallet()}
                    >
                        <Text
                            style={{ fontSize: 16, color: "white", fontFamily: "nunito-bold" }}
                        >
                            {t("pay")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modalize>
        </GestureHandlerRootView>
    );
};

export default PenaltyFee;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        // margin: 16,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#F9F5F0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    feeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#D32F2F',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    successText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2E7D32',
        marginBottom: 12,
    },
    payButton: {
        backgroundColor: '#FF6347',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#B0BEC5',
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});