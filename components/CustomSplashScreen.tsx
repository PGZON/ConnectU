import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomSplashScreenProps {
  onFinish?: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <LinearGradient colors={["#4f8cff", "#a6c1ee", "#fff"]} style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
        <View style={styles.logoBox}>
          <Image
            source={require('../assets/images/ConnectU_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>ConnectU</Text>
        <Text style={styles.subtitle}>beyond the Campus.</Text>
        <ActivityIndicator size="large" color="#4f8cff" style={{ marginTop: 32 }} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 180,
    height: 180,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 18,
    color: '#4f8cff',
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600',
  },
});

export default CustomSplashScreen; 