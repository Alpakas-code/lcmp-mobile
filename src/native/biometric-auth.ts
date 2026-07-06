import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { getStoredAuth } from "../api/token-storage";

const rememberedDeviceKey = "lcmp.mobile.rememberedDevice";

export async function setRememberedDevice(enabled: boolean) {
  if (enabled) {
    await SecureStore.setItemAsync(rememberedDeviceKey, "true");
  } else {
    await SecureStore.deleteItemAsync(rememberedDeviceKey);
  }
}

export async function isRememberedDevice() {
  return (await SecureStore.getItemAsync(rememberedDeviceKey)) === "true";
}

export async function getBiometricCapability() {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync()
  ]);

  return {
    hasHardware,
    isAvailable: hasHardware && isEnrolled,
    isEnrolled,
    label: labelForTypes(types)
  };
}

export async function authenticateWithBiometrics() {
  const remembered = await isRememberedDevice();
  const capability = await getBiometricCapability();
  const storedAuth = await getStoredAuth();

  if (!remembered || !capability.isAvailable || !storedAuth) {
    return null;
  }

  const result = await LocalAuthentication.authenticateAsync({
    cancelLabel: "Use password",
    disableDeviceFallback: false,
    fallbackLabel: "Use device passcode",
    promptMessage: `Unlock LCMP with ${capability.label}`
  });

  if (!result.success) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return null;
  }

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return storedAuth.user;
}

function labelForTypes(types: LocalAuthentication.AuthenticationType[]) {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Fingerprint";
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return "biometrics";
  return "device authentication";
}
