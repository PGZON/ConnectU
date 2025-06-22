import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

const LOGO_TEXT = "ConnectU";

const AnimatedLogo = () => {
  const animations = useRef(LOGO_TEXT.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const createAnimation = (animation: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: -8,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1500),
        ])
      );
    };

    const runningAnimation = Animated.stagger(
      120,
      animations.map((anim) => createAnimation(anim))
    );

    runningAnimation.start();

    return () => runningAnimation.stop();
  }, [animations]);

  return (
    <View style={styles.container}>
      {LOGO_TEXT.split('').map((char, i) => (
        <Animated.Text
          key={`${char}-${i}`}
          style={[
            styles.text,
            { transform: [{ translateY: animations[i] }] },
          ]}
        >
          {char}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  text: {
    fontFamily: 'Pacifico-Regular',
    fontSize: 26,
    color: '#7B61FF',
  },
});

export default AnimatedLogo; 