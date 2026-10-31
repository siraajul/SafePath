import { Image } from 'expo-image';
import { ObserveInteractiveMarker } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const FADE_DURATION = 300;
/** Must match the splash plugin config in app.json so the hand-off is seamless. */
const SPLASH_IMAGE_WIDTH = 120;
const SPLASH_BACKGROUND = { light: '#215BC7', dark: '#0D1722' } as const;

const splashFade = new Keyframe({
  0: { opacity: 1 },
  100: { opacity: 0 },
});

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return <ObserveInteractiveMarker />;

  const overlayStyle = [
    styles.splashOverlay,
    { backgroundColor: SPLASH_BACKGROUND[scheme === 'dark' ? 'dark' : 'light'] },
  ];
  const image = (
    <Image style={styles.splashImage} source={require('@/assets/images/splash-icon.png')} />
  );

  return animate ? (
    <Animated.View
      entering={splashFade.duration(FADE_DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={overlayStyle}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          if (reduceMotion) setVisible(false);
          else setAnimate(true);
        });
      }}
      style={overlayStyle}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  splashImage: {
    width: SPLASH_IMAGE_WIDTH,
    height: SPLASH_IMAGE_WIDTH,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
