import { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

type ScreenProps = PropsWithChildren<{
  accessibilityLabel?: string;
  contentStyle?: StyleProp<ViewStyle>;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
  testID?: string;
}>;

export function Screen({
  accessibilityLabel,
  children,
  contentStyle,
  onRefresh,
  refreshing = false,
  scroll = true,
  testID
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView accessibilityLabel={accessibilityLabel} style={styles.screen} testID={testID}>
        <View style={[styles.staticContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView accessibilityLabel={accessibilityLabel} style={styles.screen} testID={testID}>
      <ScrollView
        alwaysBounceVertical={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type KeyboardAwareScreenProps = PropsWithChildren<{
  accessibilityLabel?: string;
  contentStyle?: StyleProp<ViewStyle>;
  centered?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}>;

export function KeyboardAwareScreen({
  accessibilityLabel,
  centered = false,
  children,
  contentStyle,
  onRefresh,
  refreshing = false,
  testID
}: KeyboardAwareScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView accessibilityLabel={accessibilityLabel} style={styles.screen} testID={testID}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.keyboard}
      >
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={[
            styles.keyboardContent,
            centered ? styles.centered : null,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl },
            contentStyle
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            <View style={styles.dismissLayer}>{children}</View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SafeAreaScreen({ accessibilityLabel, children, contentStyle, testID }: Omit<ScreenProps, "scroll">) {
  return (
    <SafeAreaView accessibilityLabel={accessibilityLabel} style={styles.screen} testID={testID}>
      <View style={[styles.staticContent, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function FormScreen(props: KeyboardAwareScreenProps) {
  return <KeyboardAwareScreen {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  staticContent: {
    flex: 1,
    padding: spacing.lg
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg
  },
  keyboard: {
    flex: 1
  },
  keyboardContent: {
    flexGrow: 1,
    padding: spacing.lg
  },
  centered: {
    justifyContent: "center"
  },
  dismissLayer: {
    flexGrow: 1,
    gap: spacing.lg
  }
});
