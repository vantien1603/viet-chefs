import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, Button, TouchableOpacity, TextInput } from 'react-native';
import { AuthContext } from '../config/AuthContext';
import { useNavigation } from 'expo-router';
import { PasswordInput } from '../components/PasswordInput/passwordInput';
import { commonStyles } from '../style';
import useActionCheckNetwork from '../hooks/useAction';
import { ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

const ModalContextLogin = createContext();

export const ModalLoginProvider = ({ children }) => {
    const modalizeRef = useRef(null);
    const [modalContent, setModalContent] = useState({ title: '', message: '', isLogin: false });
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [error, setError] = useState('');
    const requireNetwork = useActionCheckNetwork();
    const [expoToken, setExpoToken] = useState('');
    
    useEffect(() => {
        if (modalizeRef.current) {
            const modal = modalizeRef.current;
            const onOpen = () => {
                setShowLoginForm(false);
                setEmail('');
                setPassword('');
                setError('');
            };
            modal.onOpen = onOpen;
        }
        const getToken = async () => {
            const token = await AsyncStorage.getItem("expoPushToken");
            setExpoToken(token);
        };
        getToken();
    }, []);

    const showModalLogin = (title, message, isLogin = false) => {
        setModalContent({ title, message, isLogin });
        modalizeRef.current?.open();
    };

    const handleLogin = async () => {
        console.log("cc");
        if (email.trim().length === 0 || password.trim().length === 0) {
            setError("Login failed. Please check your account or password again.")
            return;
        }
        setLoading(true);
        const result = await login(email, password, expoToken);
        if (result) {
            if (result?.roleName === "ROLE_CHEF") {
                navigation.navigate("(chef)", { screen: "home" });
            }
            modalizeRef.current?.close();
        }
        else {
            console.log("result", result)
            setError("Login failed. Please check your account or password again.")
        }
        setLoading(false);
    }

    return (
        <ModalContextLogin.Provider value={{ showModalLogin }}>
            {children}
            <Modalize ref={modalizeRef} adjustToContentHeight>
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{modalContent.title}</Text>
                    <Text style={{ marginVertical: 10 }}>{modalContent.message}</Text>
                    {modalContent.isLogin && !showLoginForm && (
                        <TouchableOpacity style={{
                            padding: 8,
                            marginTop: 10,
                            borderWidth: 1,
                            backgroundColor: "#383737",
                            borderColor: "#383737",
                            borderRadius: 50,
                            width: 300,
                        }}
                            onPress={() => setShowLoginForm(true)}>
                            <Text style={{ textAlign: "center", fontSize: 18, color: "#fff", fontFamily: "nunito-bold" }}>Đăng nhập</Text>
                        </TouchableOpacity>
                    )}

                    {showLoginForm && (
                        <>
                            <View style={{ width: '100%' }}>
                                <TextInput
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={commonStyles.input}
                                />
                                <PasswordInput placeholder="Password" onPasswordChange={setPassword} />
                            </View>

                            {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

                            <TouchableOpacity style={{
                                padding: 8,
                                marginTop: 10,
                                borderWidth: 1,
                                backgroundColor: "#383737",
                                borderColor: "#383737",
                                borderRadius: 50,
                                width: 300,
                            }}
                                onPress={() => requireNetwork(handleLogin)}
                            >

                                {loading ? (
                                    <ActivityIndicator size={'small'} color={'white'} />
                                ) : (
                                    <Text style={{ textAlign: "center", fontSize: 18, color: "#fff", fontFamily: "nunito-bold" }}>Login</Text>
                                )}
                            </TouchableOpacity>

                        </>

                    )}
                    {!showLoginForm && !modalContent.isLogin && (
                        <TouchableOpacity style={{
                            padding: 8,
                            marginTop: 10,
                            borderWidth: 1,
                            backgroundColor: "#383737",
                            borderColor: "#383737",
                            borderRadius: 50,
                            width: 300,
                        }}
                            onPress={() => modalizeRef.current?.close()}>
                            <Text style={{ textAlign: "center", fontSize: 18, color: "#fff", fontFamily: "nunito-bold" }}>Đóng</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modalize>
        </ModalContextLogin.Provider>
    );
};

export const useModalLogin = () => useContext(ModalContextLogin);
