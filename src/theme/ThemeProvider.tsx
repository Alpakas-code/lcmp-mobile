import { createContext, PropsWithChildren, useContext } from "react";
import { colors } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

const theme = {
  colors,
  radius,
  shadows,
  spacing,
  typography
};

const ThemeContext = createContext(theme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export type MobileTheme = typeof theme;
