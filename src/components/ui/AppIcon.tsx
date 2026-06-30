import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

export type AppIconName =
  | "book"
  | "calendar"
  | "chat"
  | "check"
  | "chevron"
  | "document"
  | "grid"
  | "home"
  | "lock"
  | "login"
  | "logout"
  | "mail"
  | "notification"
  | "people"
  | "ribbon"
  | "search"
  | "school"
  | "trend";

type AppIconProps = {
  color?: string;
  name: AppIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

type IconContext = {
  color: string;
  q: (value: number) => number;
  stroke: number;
};

export function AppIcon({ color = colors.primary, name, size = 18, style }: AppIconProps) {
  const q = (value: number) => (value / 24) * size;
  const stroke = Math.max(1.6, size * 0.09);
  const context = { color, q, stroke };

  return (
    <View style={[styles.icon, { height: size, width: size }, style]}>
      {renderIcon(name, context)}
    </View>
  );
}

function renderIcon(name: AppIconName, { color, q, stroke }: IconContext) {
  const line = (style: ViewStyle) => <View style={[styles.line, { backgroundColor: color, height: stroke }, style]} />;
  const vLine = (style: ViewStyle) => <View style={[styles.line, { backgroundColor: color, width: stroke }, style]} />;
  const border = (style: ViewStyle) => <View style={[styles.border, { borderColor: color, borderWidth: stroke }, style]} />;
  const dot = (style: ViewStyle) => <View style={[styles.dot, { backgroundColor: color }, style]} />;

  switch (name) {
    case "book":
      return (
        <>
          {border({ height: q(16), left: q(4), top: q(4), width: q(16), borderRadius: q(2) })}
          {vLine({ height: q(13), left: q(11.5), top: q(5.5) })}
          {line({ left: q(6.5), top: q(8), width: q(3.5) })}
          {line({ left: q(14), top: q(8), width: q(3.5) })}
        </>
      );
    case "calendar":
      return (
        <>
          {border({ height: q(16), left: q(4), top: q(5), width: q(16), borderRadius: q(3) })}
          {line({ left: q(4), top: q(10), width: q(16) })}
          {vLine({ height: q(4), left: q(8), top: q(3) })}
          {vLine({ height: q(4), left: q(16), top: q(3) })}
        </>
      );
    case "chat":
      return (
        <>
          {border({ height: q(13), left: q(4), top: q(5), width: q(16), borderRadius: q(5) })}
          {line({ left: q(8), top: q(21), width: q(6), transform: [{ rotate: "-40deg" }] })}
          {dot({ height: q(2), left: q(8), top: q(11), width: q(2), borderRadius: q(1) })}
          {dot({ height: q(2), left: q(12), top: q(11), width: q(2), borderRadius: q(1) })}
          {dot({ height: q(2), left: q(16), top: q(11), width: q(2), borderRadius: q(1) })}
        </>
      );
    case "check":
      return (
        <>
          {line({ left: q(5.5), top: q(12.8), width: q(6), transform: [{ rotate: "45deg" }] })}
          {line({ left: q(10), top: q(11.3), width: q(10), transform: [{ rotate: "-45deg" }] })}
        </>
      );
    case "chevron":
      return (
        <>
          {line({ left: q(9), top: q(7.5), width: q(8), transform: [{ rotate: "45deg" }] })}
          {line({ left: q(9), top: q(15), width: q(8), transform: [{ rotate: "-45deg" }] })}
        </>
      );
    case "document":
      return (
        <>
          {border({ height: q(17), left: q(6), top: q(4), width: q(12), borderRadius: q(2) })}
          {line({ left: q(9), top: q(10), width: q(6) })}
          {line({ left: q(9), top: q(14), width: q(6) })}
        </>
      );
    case "grid":
      return (
        <>
          {border({ height: q(6), left: q(4), top: q(4), width: q(6), borderRadius: q(2) })}
          {border({ height: q(6), left: q(14), top: q(4), width: q(6), borderRadius: q(2) })}
          {border({ height: q(6), left: q(4), top: q(14), width: q(6), borderRadius: q(2) })}
          {border({ height: q(6), left: q(14), top: q(14), width: q(6), borderRadius: q(2) })}
        </>
      );
    case "home":
      return (
        <>
          {line({ left: q(5), top: q(10), width: q(10), transform: [{ rotate: "-42deg" }] })}
          {line({ left: q(10), top: q(10), width: q(10), transform: [{ rotate: "42deg" }] })}
          {border({ height: q(9), left: q(6), top: q(11), width: q(12), borderRadius: q(2) })}
          {vLine({ height: q(5), left: q(12), top: q(15) })}
        </>
      );
    case "lock":
      return (
        <>
          {border({ height: q(8), left: q(8), top: q(3), width: q(8), borderBottomWidth: 0, borderRadius: q(4) })}
          {border({ height: q(10), left: q(5), top: q(10), width: q(14), borderRadius: q(3) })}
          {vLine({ height: q(3), left: q(12), top: q(14) })}
        </>
      );
    case "login":
      return (
        <>
          {border({ height: q(14), left: q(4), top: q(5), width: q(9), borderRadius: q(2) })}
          {line({ left: q(9), top: q(12), width: q(10) })}
          {line({ left: q(15), top: q(9), width: q(5), transform: [{ rotate: "45deg" }] })}
          {line({ left: q(15), top: q(15), width: q(5), transform: [{ rotate: "-45deg" }] })}
        </>
      );
    case "logout":
      return (
        <>
          {border({ height: q(14), left: q(11), top: q(5), width: q(9), borderRadius: q(2) })}
          {line({ left: q(5), top: q(12), width: q(10) })}
          {line({ left: q(4.5), top: q(9), width: q(5), transform: [{ rotate: "-45deg" }] })}
          {line({ left: q(4.5), top: q(15), width: q(5), transform: [{ rotate: "45deg" }] })}
        </>
      );
    case "mail":
      return (
        <>
          {border({ height: q(12), left: q(3.5), top: q(6), width: q(17), borderRadius: q(3) })}
          {line({ left: q(5), top: q(9), width: q(8), transform: [{ rotate: "32deg" }] })}
          {line({ left: q(11), top: q(9), width: q(8), transform: [{ rotate: "-32deg" }] })}
        </>
      );
    case "notification":
      return (
        <>
          {border({ height: q(12), left: q(6), top: q(6), width: q(12), borderRadius: q(6) })}
          {line({ left: q(5), top: q(17), width: q(14) })}
          {dot({ height: q(3), left: q(10.5), top: q(20), width: q(3), borderRadius: q(1.5) })}
          {dot({ height: q(2.5), left: q(10.75), top: q(3), width: q(2.5), borderRadius: q(1.25) })}
        </>
      );
    case "people":
      return (
        <>
          {border({ height: q(6), left: q(9), top: q(4), width: q(6), borderRadius: q(3) })}
          {border({ height: q(8), left: q(6), top: q(13), width: q(12), borderRadius: q(6) })}
          {border({ height: q(4.5), left: q(3), top: q(7), width: q(4.5), borderRadius: q(2.25) })}
          {border({ height: q(4.5), left: q(16.5), top: q(7), width: q(4.5), borderRadius: q(2.25) })}
        </>
      );
    case "ribbon":
      return (
        <>
          {border({ height: q(9), left: q(7.5), top: q(3), width: q(9), borderRadius: q(4.5) })}
          {vLine({ height: q(9), left: q(9), top: q(12), transform: [{ rotate: "18deg" }] })}
          {vLine({ height: q(9), left: q(15), top: q(12), transform: [{ rotate: "-18deg" }] })}
        </>
      );
    case "search":
      return (
        <>
          {border({ height: q(11), left: q(5), top: q(5), width: q(11), borderRadius: q(5.5) })}
          {line({ left: q(14), top: q(16), width: q(6), transform: [{ rotate: "45deg" }] })}
        </>
      );
    case "school":
      return (
        <>
          {line({ left: q(5), top: q(8), width: q(14), transform: [{ rotate: "-18deg" }] })}
          {line({ left: q(5), top: q(8), width: q(14), transform: [{ rotate: "18deg" }] })}
          {line({ left: q(7), top: q(13), width: q(10) })}
          {vLine({ height: q(5), left: q(8), top: q(13) })}
          {vLine({ height: q(5), left: q(16), top: q(13) })}
          {line({ left: q(6), top: q(19), width: q(12) })}
        </>
      );
    case "trend":
      return (
        <>
          {line({ left: q(4), top: q(16), width: q(7), transform: [{ rotate: "-35deg" }] })}
          {line({ left: q(10), top: q(12), width: q(6), transform: [{ rotate: "25deg" }] })}
          {line({ left: q(15), top: q(9), width: q(6), transform: [{ rotate: "-35deg" }] })}
          {line({ left: q(17), top: q(7), width: q(4), transform: [{ rotate: "0deg" }] })}
          {vLine({ height: q(4), left: q(20), top: q(7) })}
        </>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  line: {
    position: "absolute"
  },
  border: {
    backgroundColor: "transparent",
    position: "absolute"
  },
  dot: {
    position: "absolute"
  }
});
