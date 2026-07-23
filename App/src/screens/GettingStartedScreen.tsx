import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  FlatList
} from "react-native";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";

const { width, height } = Dimensions.get("window");

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  localImage?: any;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    title: "Manage Your\nStore Smartly",
    subtitle: "Everything you need to run your business efficiently.",
    image: "https://res.cloudinary.com/dfy4arfoh/image/upload/v1773522655/ChatGPT_Image_Mar_15_2026_01_49_16_AM2_ymaafo.png",
    localImage: require("./managing.png")
  },
  {
    id: "2",
    title: "Track All\nYour Orders",
    subtitle: "Real-time updates on every order placed in your shop.",
    image: "https://res.cloudinary.com/dfy4arfoh/image/upload/v1773522656/ChatGPT_Image_Mar_15_2026_01_49_16_AM1_lmibbs.png",
    localImage: require("./tracking.png")
  },
  {
    id: "3",
    title: "Grow Your\nBusiness",
    subtitle: "Analyze your performance and scale your reach.",
    image: "https://res.cloudinary.com/dfy4arfoh/image/upload/v1773522655/ChatGPT_Image_Mar_15_2026_01_49_16_AM_n0h4zr.png",
    localImage: require("./growth.png")
  }
];

interface GettingStartedScreenProps {
  onComplete: () => void;
}

export function GettingStartedScreen({ onComplete }: GettingStartedScreenProps) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.brand,
    },
    slideContainer: {
      width: width,
      height: height * 0.8, // Limit height to leave room for footer
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    topContent: {
      alignSelf: "flex-start",
      marginTop: 20,
      width: "100%",
    },
    title: {
      fontSize: 40,
      fontWeight: "800",
      color: colors.white,
      lineHeight: 48,
    },
    subtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.7)",
      marginTop: 12,
      fontWeight: "500",
      lineHeight: 24,
    },
    paginationContainer: {
      flexDirection: "row",
      height: 40,
      alignItems: "center",
      marginTop: 20,
    },
    dot: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      marginRight: 8,
    },
    illustrationContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      width: width,
      top: 60,
    },
    illustrationCircle: {
      position: "absolute",
      width: width * 0.75,
      height: width * 0.75,
      borderRadius: width * 0.4,
      backgroundColor: "rgba(255, 255, 255, 0.0)",
    },
    image: {
      width: width * 1,
      height: width * 1,
      resizeMode: "cover",
      
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 30,
      paddingBottom: 40,
      backgroundColor: "transparent",
      zIndex: 10, // Ensure it's on top
    },
    button: {
      backgroundColor: colors.white,
      paddingVertical: 18,
      borderRadius: radius.xl,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    buttonText: {
      color: colors.brand,
      fontSize: 18,
      fontWeight: "800",
    }
  });

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={dynamicStyles.slideContainer}>
      <View style={dynamicStyles.topContent}>
        <Text style={dynamicStyles.title}>{item.title}</Text>
        <Text style={dynamicStyles.subtitle}>{item.subtitle}</Text>

        <View style={dynamicStyles.paginationContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i.toString()}
                style={[
                  dynamicStyles.dot,
                  { width: dotWidth, opacity, backgroundColor: colors.white }
                ]}
              />
            );
          })}
        </View>
      </View>

      <Animated.View style={[dynamicStyles.illustrationContainer, { transform: [{ translateY: floatAnim }] }]}>
        <View style={dynamicStyles.illustrationCircle} />
        <Image 
          source={item.localImage || { uri: item.image }} 
          style={dynamicStyles.image} 
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1 }}>
        <FlatList
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          ref={slidesRef}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          scrollEventThrottle={32}
        />
      </View>

      <View style={dynamicStyles.footer}>
        <Pressable
          style={({ pressed }) => [
            dynamicStyles.button,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
          onPress={handleNext}
        >
          <Text style={dynamicStyles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
