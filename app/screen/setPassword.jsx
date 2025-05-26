import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { PasswordInput } from '../../components/PasswordInput/passwordInput';
import { commonStyles } from '../../style';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AXIOS_BASE from '../../config/AXIOS_BASE';
import useActionCheckNetwork from '../../hooks/useAction';
import { useCommonNoification } from '../../context/commonNoti';
import axios from 'axios';
import useAxiosBase from '../../config/AXIOS_BASE';
import { t } from 'i18next';

const SetPassword = () => {
    const { username, fullName, phone, mail, mode } = useLocalSearchParams();

    const [rePassword, setRePassword] = useState('');
    const [password, setPassword] = useState('');
    const { showModal } = useCommonNoification();
    const axiosInstanceBase = useAxiosBase();

    const router = useRouter();
    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };

    const handleSetPassword = async () => {
        if (password !== rePassword) {
            showModal(t("modal.error"), t("passwordMismatch"), t("modal.failed"))
            return;
        }

        const setPasswordPayload = {
            email: mail,
            password: password,
        };

        try {
            console.log('data', setPasswordPayload);
            const response = await axiosInstanceBase.post('/set-password', setPasswordPayload);
            if (response.status === 200) {
                showModal(t("modal.success"), "Quá trình đăng kí hoàn tất. Vui lòng đăng nhập lại.", t("modal.success"));
                console.log('Register success');
                router.push('/screen/login')
            } else {
                showModal(t("modal.error"), t("fetchSetPwFailed"), t("modal.failed"));
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình đặt mật khẩu.", t("modal.failed").failed"));
            showModal(t("modal.error"), error.response.data.message, t("modal.failed"));
        }
    }
    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={t("setPassword")} />
            <View style={commonStyles.containerContent}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 20 }}>
                    {t("enterPassword")}
                </Text>
                <PasswordInput
                    placeholder={t("password")}
                    onPasswordChange={handlePasswordChange}
                />
                <PasswordInput
                    placeholder={t("rePassword")}
                    onPasswordChange={handleRePasswordChange}
                />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>

                <TouchableOpacity onPress={() => handleSetPassword()} style={{
                    padding: 13,
                    marginTop: 10,
                    borderWidth: 1,
                    backgroundColor: '#383737',
                    borderColor: '#383737',
                    borderRadius: 50,
                    width: 300,
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 18,
                        color: '#fff',
                        fontFamily: 'nunito-bold',
                    }}>{t("next")}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default SetPassword