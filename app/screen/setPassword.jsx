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
            showModal("Error", "Passwords do not match!", "Failed")
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
                showModal("Success", "Quá trình đăng kí hoàn tất. Vui lòng đăng nhập lại.", "Success");
                console.log('Register success');
                router.push('/screen/login')
            } else {
                showModal("Error", "Có lỗi xảy ra trong quá trình đặt mật khẩu.", "Failed");
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            // showModal("Error", "Có lỗi xảy ra trong quá trình đặt mật khẩu.", "Failed");
            showModal("Error", error.response.data.message, "Failed");
        }
    }
    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={"Set password"} />
            <View style={commonStyles.containerContent}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 20 }}>
                    Please enter your password. This password will be used for future logins
                </Text>
                <PasswordInput
                    placeholder="Password"
                    onPasswordChange={handlePasswordChange}
                />
                <PasswordInput
                    placeholder="Re-enter password"
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
                    }}>Next</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default SetPassword