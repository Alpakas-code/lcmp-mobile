import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, retryLabel = "Try again", onRetry }: ErrorStateProps) {
  return (
    <View style={styles.state}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#fecdca",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  title: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800"
  },
  message: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  }
});
