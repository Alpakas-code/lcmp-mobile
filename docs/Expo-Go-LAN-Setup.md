# Expo Go LAN Setup

This setup is for running LCMP Mobile in Expo Go on a physical phone while the LCMP backend runs locally on the Mac.

## Current LAN Values

LCMP Mobile now follows the same Expo LAN pattern as the working Sodedif app:

```text
npm run start -> expo start
npm run start:clear -> expo start -c
```

There is no `REACT_NATIVE_PACKAGER_HOSTNAME` override. Expo chooses the current Wi-Fi IP automatically, so the QR host changes when the Mac changes Wi-Fi.

Mobile `.env` only controls the backend URL:

```env
EXPO_PUBLIC_API_URL=http://<current-lan-ip>:3000/api/v1
```

When the Wi-Fi IP changes, update this API URL to match the IP Expo prints.

Backend `.env`:

```env
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
```

`HOST=0.0.0.0` makes the NestJS API listen on all local network interfaces instead of only loopback.

## Required Network Condition

The phone must be able to open both URLs in Safari before Expo Go can work. Replace `<current-lan-ip>` with the IP printed by Expo:

```text
http://<current-lan-ip>:3000/api/docs
http://<current-lan-ip>:8081/status
```

Expected Metro response:

```text
packager-status:running
```

If Safari on the phone cannot open those URLs, the blocker is local network reachability, not React Native code.

## Start Backend

From the backend repo:

```bash
cd /Users/devmobile/Desktop/LCMP/LCMP
npm run start:dev
```

Verify from the Mac:

```bash
curl http://<current-lan-ip>:3000/api/v1/health
```

## Start Mobile

From the mobile repo:

```bash
cd /Users/devmobile/Desktop/LCMP/lcmp-mobile
npm run start
```

To clear Metro cache:

```bash
npm run start:clear
```

## iPhone Checks

Before scanning the QR code:

1. Put the iPhone and Mac on the same local network.
2. On the iPhone, enable Local Network permission for Expo Go.
3. Open `http://<current-lan-ip>:8081/status` in iPhone Safari.
4. Open `http://<current-lan-ip>:3000/api/docs` in iPhone Safari.
5. Scan the QR from Expo Go or iOS Camera.

## If It Still Says Offline

Check these in order:

1. The backend command is still running.
2. The Expo command is still running.
3. The iPhone can open `http://<current-lan-ip>:8081/status`.
4. The iPhone can open `http://<current-lan-ip>:3000/api/docs`.
5. The Mac firewall is not blocking incoming connections.
6. The current network allows device-to-device traffic.

Some hotspot, cellular, guest Wi-Fi, and isolated router networks do not allow local peer traffic. In that case LAN mode cannot work until the Mac and phone are moved to a network that permits device-to-device connections.

## If Expo Prints 192.0.0.2

`192.0.0.2` is not coming from LCMP config anymore. It is the IP macOS is currently reporting for the active `en0` network interface.

Confirmed comparison:

```text
LCMP start:    exp://192.0.0.2:<port>
Sodedif start: exp://192.0.0.2:<port>
```

So if both projects print `192.0.0.2`, the Mac is not on a normal local Wi-Fi LAN at that moment. In the checked state, macOS reported:

```text
networksetup: not associated with an AirPort network
default gateway: 192.0.0.1
en0 IPv4: 192.0.0.2
network flags: CLAT46
```

To get the usual changing Wi-Fi LAN IP, connect the Mac to the same regular Wi-Fi network as the phone, then restart Expo with:

```bash
npm run start:clear
```
