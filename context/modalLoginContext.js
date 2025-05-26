import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { AuthContext } from '../config/AuthContext';
import { useNavigation } from 'expo-router';
import { PasswordInput } from '../components/PasswordInput/passwordInput';
import { commonStyles } from '../style';
import useActionCheckNetwork from '../hooks/useAction';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ModalContextLogin = createContext();

export const ModalLoginProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
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
        const getToken = async () => {
            const token = await AsyncStorage.getItem("expoPushToken");
            setExpoToken(token);
        };
        getToken();
    }, []);

    const showModalLogin = useCallback((title, message, isLogin = false) => {
        setShowLoginForm(false);
        setEmail('');
        setPassword('');
        setError('');

        setModalContent({ title, message, isLogin });

        setTimeout(() => {
            setIsVisible(true);
        }, 100);
    }, []);

    const handleLogin = async () => {
        if (email.trim().length === 0 || password.trim().length === 0) {
            setError("Login failed. Please check your account or password again.");
            return;
        }

        setLoading(true);
        const result = await login(email, password, expoToken);
        console.log("resuls login modal", result);
        if (result) {
            if (result?.roleName === "ROLE_CHEF") {
                navigation.navigate("(chef)", { screen: "home" });
            }
            setIsVisible(false);
        } else {
            setError("Login failed. Please check your account or password again.");
        }

        setLoading(false);
    };

    const closeModal = () => {
        setIsVisible(false);
    };

    return (
        <ModalContextLogin.Provider value={{ showModalLogin }}>
            {children}
            <Modal
                isVisible={isVisible}
                onBackdropPress={closeModal}
                onBackButtonPress={closeModal}
                swipeDirection="down"
                onSwipeComplete={closeModal}
                style={styles.modal}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver={true}
                statusBarTranslucent
                propagateSwipe={true}
            >
                <View style={styles.modalContent}>
                    <View style={styles.indicator} />
                    <Text style={styles.title}>{modalContent.title}</Text>
                    <Text style={styles.message}>{modalContent.message}</Text>

                    {modalContent.isLogin && !showLoginForm && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setShowLoginForm(true)}
                        >
                            <Text style={styles.buttonText}>Đăng nhập</Text>
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

                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => requireNetwork(handleLogin)}
                            >
                                {loading ? (
                                    <ActivityIndicator size={'small'} color={'white'} />
                                ) : (
                                    <Text style={styles.buttonText}>Login</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {!showLoginForm && !modalContent.isLogin && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={closeModal}
                        >
                            <Text style={styles.buttonText}>Đóng</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>
        </ModalContextLogin.Provider>
    );
};

export const useModalLogin = () => useContext(ModalContextLogin);

const styles = {
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        alignItems: 'center',
    },
    indicator: {
        width: 40,
        height: 5,
        backgroundColor: '#DDDDDD',
        borderRadius: 5,
        marginBottom: 16,
        alignSelf: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    message: {
        marginVertical: 10,
        textAlign: 'center',
    },
    button: {
        padding: 8,
        marginTop: 10,
        borderWidth: 1,
        backgroundColor: "#383737",
        borderColor: "#383737",
        borderRadius: 50,
        width: 300,
    },
    buttonText: {
        textAlign: "center",
        fontSize: 18,
        color: "#fff",
        fontFamily: "nunito-bold"
    }
};
