import { Platform } from "react-native";
import { colors } from "./colors";

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.07,
      shadowRadius: 24
    },
    android: {
      elevation: 2
    },
    default: {}
  }),
  soft: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 14
    },
    android: {
      elevation: 2
    },
    default: {}
  }),
  floating: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.1,
      shadowRadius: 32
    },
    android: {
      elevation: 4
    },
    default: {}
  })
};
