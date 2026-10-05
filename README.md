# Kwegereza Mobile

React Native (Expo + TypeScript) mobile app for the Kwegereza Islam
Umuryango platform. Talks to the same `Kwegereza-BackEnd` and
`Kwegereza-LiveClass` services the website uses -- no separate backend,
no separate accounts, no separate live-class system.

## Status: all eight phases built — foundation, chat, library, ifaida, push notifications, exams, live class, registration

This is a multi-phase build. **What's real and working right now:**

- **Real-time chat** -- conversation list (gender room pinned to top,
  last-message preview, unread badges, exactly matching the web app's
  own ordering) and a full message thread: live Socket.IO delivery,
  typing indicator, WhatsApp-style date dividers (Uyu munsi/Ejo/day
  name/date), dedup-by-id against the same sender-echo race the web
  app's own chat handles. Ported the exact same `useChatSocket`
  contract, `timeAgo`, and `dateDivider` logic from the web app rather
  than re-deriving them, so behavior stays identical across platforms.
  One Hermes-specific fix needed here: `crypto.randomUUID()` (used for
  the web app's message dedup key) doesn't exist at all in React
  Native's Hermes engine -- this uses `expo-crypto`'s equivalent
  instead, a standard Expo module with no custom-build requirement
  (unlike LiveKit, below).
- **Isomero library** -- books (searchable grid, PDF reading) and
  Amasomo (audio/video lessons, tabbed). Locked-content handling
  carried over faithfully: both books and dars return a `locked: true`
  flag for a guest viewing non-free content (never for a logged-in
  user), same as the web app -- tapping a locked item prompts login
  rather than failing silently. Audio uses a single shared player
  instance so starting one lesson correctly stops whatever was already
  playing. All video lessons are YouTube-hosted (confirmed by reading
  the web app's own player, not assumed), played via a YouTube iframe
  embed inside a WebView.
- **PDF reading** via WebView pointed directly at the file, not a
  dedicated PDF library -- every real native PDF renderer for React
  Native needs a custom development build, the same tradeoff as
  LiveKit. This keeps the whole library phase testable in plain Expo
  Go. The tradeoff: no custom in-app page-jump controls beyond
  whatever the platform's own PDF viewer provides.
- **Ifaida (articles/insights)** -- list and full-article reading with
  real rich-content rendering via `react-native-render-html` (pure JS,
  converts HTML to native views, no native module at all -- verified
  its peer deps before adding it).
- **Push notifications, integrated with the existing backend system**
  -- not a separate parallel notification system. The backend's
  `notifyUser()` (the one function every feature already calls for
  approvals, chat, announcements, etc.) now fans out to this app's
  registered devices the same way it already fans out to web push
  subscriptions; see `Kwegereza-BackEnd`'s own README/changes for the
  new `ExpoPushToken` table and `src/utils/expoPush.ts`. On the mobile
  side: permission request, token registration the moment a session
  exists, a foreground banner+sound (not silent), and tap-to-navigate
  mapped from the same `url` field the website's own notifications use.
  **Two real limitations, not bugs:**
  1. `getExpoPushTokenAsync()` needs an EAS project id, normally read
     automatically from `app.json`'s `extra.eas.projectId` -- which
     requires running `eas init` with a real Expo account. I can't do
     that from my environment; until it's done, token registration
     fails gracefully (a console warning, nothing else breaks) rather
     than crashing.
  2. Android has required a development build for remote push since
     Expo SDK 53 -- plain Expo Go no longer supports it there. iOS
     still works in plain Expo Go (Expo auto-configures it via EAS).
     This is Expo's own current platform split, not something
     fixable in this app's code.
- **Exams** -- the full student flow: start screen, timed question
  navigation (multiple-choice and free-text), auto-submit when time
  runs out, and a results screen with per-question review (correct/
  incorrect, points awarded, the correct answer shown for anything
  missed). **Deliberately no proctoring on mobile** -- the web app
  records the student's shared browser tab, which has no equivalent
  concept on a native app; a camera-based alternative is possible but
  is a separate, substantial feature (permission flow, recording,
  upload) that deserves its own explicit decision rather than being
  silently bolted on here. This doesn't put scoring at risk either
  way: the web app's own proctor-video upload is already best-effort
  and happens after submission, never blocking the real score, so
  skipping it entirely here is safe.

- Full Expo + TypeScript project, verified by an actual Metro bundle
  export for both Android and iOS (not just a type-check) -- 2863
  modules, zero errors, on both platforms
- Splash screen: logo + loading indicator for a genuine minimum of 5
  seconds, coordinated with the real auth check so a logged-in user
  never sees a flash of the logged-out Welcome screen
- Welcome screen, Login screen wired to the real `/auth/login`
  endpoint, secure token storage (iOS Keychain / Android Keystore via
  `expo-secure-store`, not plain AsyncStorage)
- The unified top bar used on every screen: logo left, a single 3-dot
  menu right, no footer anywhere in the app
- The 3-dot menu itself: a real animated bottom-sheet modal (spring
  physics, not a linear tween), shows the logged-in user's name/email,
  Sohoka (logout) or Injira (login) depending on auth state
- Exact brand colors and fonts pulled directly from the website's own
  CSS (not approximated) -- Manrope and Cormorant Garamond via Google
  Fonts, same RGB values converted to hex

- **Live class, synchronized with the web app's own LiveKit rooms** --
  same backend, same room IDs, same auth, same permission model, no
  separate mobile-only system. A host can start a class from this app
  exactly as from the website; a student joining from here lands in
  the identical LiveKit room a web participant would be in, and the
  classroom-state layer (raise hand, mute, lock, approve-to-speak) is
  the exact same Socket.IO hook (`useLiveClass`) ported line-for-line
  from the web app, not a reimplementation that could drift from it.
  Built this turn: join flow, live participant list with mic-state
  badges, own mic toggle once approved/hosting, raise/lower hand, and
  host controls (mute all, lock/unlock, end class).
  **Deliberately not carried over in this phase:** in-class text chat
  and screen-share. Screen-share specifically would need its own
  OS-level capture permission flow (`ReplayKit` on iOS, `MediaProjection`
  on Android) that's a meaningfully separate scope decision, not an
  oversight.

- **Registration** -- the full 4-step wizard, matching the web app's
  own steps and validation exactly: requirements gate, personal info
  (name, kunia, age range, gender, WhatsApp number, email, location),
  Qur'an-reading level, then rules agreement + availability + an
  optional note, followed by a pending-approval screen. One detail
  worth calling out because it's easy to get wrong: there is
  deliberately no password field anywhere in this form -- the backend
  hashes the student's own WhatsApp number as their password (confirmed
  directly in the backend controller, not assumed), communicated to
  them by email once a leader approves the account. **Deliberately not
  carried over:** the web app's Google sign-up option on the final
  step -- that's a separate native-auth integration and its own scope
  decision, not an oversight.

**What's explicitly NOT built yet:** nothing from the original phase
list -- all eight are done.

## A critical, honest note on the live-class phase specifically

This is the one phase where "it type-checks and bundles" is
meaningfully weaker evidence than everywhere else in this project, and
I want to be direct about exactly why, rather than let the clean
verification above imply more confidence than it should.

**What I actually verified, concretely:**
- Every hook and component used (`LiveKitRoom`, `useLocalParticipant`,
  `useRemoteParticipants`, `useConnectionState`, `AudioSession`, etc.)
  was checked against the *actual installed package's own type
  definitions* in `node_modules` -- not assumed from older
  documentation or memory. This mattered: the installed
  `@livekit/react-native` is v3.0.0, and its API has genuinely changed
  from the v2.x examples in LiveKit's own older docs (`useRoom` is now
  deprecated in favor of the `<LiveKitRoom>` + granular-hooks pattern
  used here).
- `npx expo-doctor` passes cleanly on the dependency set now installed
  (after I fixed two real issues it caught: a missing `expo-asset` peer
  dependency, and a non-square app icon that would have failed an EAS
  build). It does **not** currently flag `@livekit/react-native` or
  `@livekit/react-native-webrtc` as unsupported on the New Architecture
  -- an improvement over what I found during earlier research into
  this exact concern, though I can't be fully certain whether that's
  because the underlying issue was genuinely fixed in these newer
  versions, or because React Native Directory's metadata simply
  hasn't caught up to flagging them.
- The JavaScript bundles successfully via a real Metro export, on both
  Android and iOS, with the full LiveKit/WebRTC dependency tree
  included (3,840 modules, up from ~2,900 before this phase).

**What none of that can prove, and why:**
- `expo-doctor` and Metro's bundler both operate on JavaScript/config
  metadata. Neither one compiles or executes the *native* iOS/Android
  code inside `@livekit/react-native-webrtc` -- which is exactly where
  a real New Architecture incompatibility would actually surface (at
  runtime, inside an actual native build), not during bundling.
- This Expo SDK version (57) has also **removed `newArchEnabled` as a
  settable config option entirely** -- I confirmed this directly
  (searched the installed `expo` package and the live config schema for
  it; found nothing). On the SDK 54 project where I'd earlier found a
  LiveKit/New-Architecture bug report, disabling New Architecture was
  still possible as a workaround. On this project, it is not: if
  `@livekit/react-native-webrtc` has any remaining New Architecture
  issue, there is currently no config-level escape hatch available
  here.
- `@livekit/react-native` requires native modules and will not run in
  plain "Expo Go" from the app stores -- testing it needs a custom
  development build (`npx expo prebuild` then `npx expo run:android` /
  `run:ios`, or an EAS development build).
- I cannot build, run, or test a React Native app with native modules
  from my own environment at all. Everything above is the strongest
  verification I can genuinely offer without a real device -- it is
  not the same as having confirmed a host and student can actually
  hear each other.

The honest summary: the code is correct by every check available to
me, and the ecosystem looks healthier on this than it did earlier in
my research -- but the real test is still yours to run.

## Install and run

Cloning this repo and running one command is all that's needed --
every dependency below is already pinned in `package.json` at the
exact version resolved for this project, so plain `npm install` is
correct and sufficient (nothing here needs a separate `npx expo
install` pass unless you're adding something new):

```bash
npm install
cp .env.example .env   # point EXPO_PUBLIC_API_URL / EXPO_PUBLIC_LIVE_API_URL at your real backend
npx expo start
```

**Expo Go vs. a development build:** most of this app runs fine in
the plain Expo Go app from the app stores -- scan the QR code and go.
The one exception is the **live-class screens**, which use
`@livekit/react-native`'s native WebRTC module and will not run in
Expo Go at all. If you're only testing chat, library, exams,
ifaida, or registration, Expo Go is enough. To test live-class, you
need a development build:

```bash
npx expo prebuild                 # generates native ios/ and android/ folders
npx expo run:android              # requires Android Studio / an Android SDK
npx expo run:ios                  # requires Xcode, macOS only
```

Push notifications also need a real Expo account (`eas init`) and,
on Android specifically, a development build as well -- see the
push-notifications note further up this README for the exact
limitation.

## Every library in this project, and why it's here

Grouped by what each one does, not alphabetically, so this doubles as
a map of the codebase. Version numbers are whatever `package.json`
currently pins; `npx expo install <name>` is the right way to add any
of these to a different Expo project, rather than plain `npm install`,
because it resolves the version your specific Expo SDK actually
expects instead of whatever is newest on npm.

**Core framework**
- `expo` -- the SDK itself (currently 57)
- `react`, `react-native` -- the underlying framework
- `typescript`, `@types/react` (dev) -- this entire project is
  TypeScript, verified with `npx tsc --noEmit` after every phase

**Navigation**
- `@react-navigation/native`, `@react-navigation/native-stack` --
  the screen stack everything in `src/navigation/RootNavigator.tsx`
  is built on
- `react-native-screens`, `react-native-safe-area-context` -- required
  peer dependencies of React Navigation itself (native screen
  containers and safe-area/notch handling); not used directly but
  nothing navigates without them

**Fonts and icons**
- `@expo-google-fonts/manrope`, `@expo-google-fonts/cormorant-garamond`
  -- the exact two typefaces the web app's own CSS uses, pulled from
  Google Fonts rather than approximated
- `expo-font` -- loads the above at startup
- `lucide-react-native` -- every icon in this app (same icon set the
  web app uses, `lucide-react`'s React Native counterpart)
- `react-native-svg` -- required peer dependency of
  `lucide-react-native` (icons are SVGs under the hood)

**Networking and storage**
- `@react-native-async-storage/async-storage` -- general key-value
  storage (non-sensitive data)
- `expo-secure-store` -- the token store specifically (Keychain on
  iOS, Keystore on Android) -- this is `src/api/client.ts`'s
  replacement for the web app's `localStorage`
- `socket.io-client` -- real-time chat and live-class classroom
  signaling, same library the web app uses
- `expo-constants` -- reads `app.json`/env config at runtime
- `expo-device` -- device info used when registering a push token (so
  a token can be tied to "which device," not just "which user")

**Media and documents**
- `expo-audio` -- the shared audio player instance for Amasomo
  (lessons) audio playback
- `expo-crypto` -- `Crypto.randomUUID()`; Hermes (React Native's JS
  engine) doesn't implement `crypto.randomUUID()` natively, so chat's
  optimistic-message IDs need this instead
- `expo-file-system` -- backing library `expo-audio` and some download
  flows need
- `react-native-webview` -- renders PDFs (via Google Docs viewer on
  Android, direct URL on iOS) and YouTube video embeds
- `react-native-render-html` -- renders the HTML body of ifaida
  articles and exam-result rich text

**Push notifications**
- `expo-notifications` -- permission requests, foreground handling,
  tap-to-navigate; see the push-notifications section of this README
  for its two concrete, current limitations

**App chrome**
- `expo-status-bar`, `expo-splash-screen` -- the status bar style and
  the branded splash screen shown while auth/fonts load

**Live class (LiveKit + WebRTC)** -- see the dedicated honest note
above before relying on this group; it's the one part of this
dependency list I could not verify at runtime myself
- `livekit-client` -- LiveKit's core JS client, shared logic under
  both the web and native SDKs
- `@livekit/react-native` -- the React Native-specific layer:
  `registerGlobals()`, `<LiveKitRoom>`, `AudioSession`
- `@livekit/components-react` -- where the granular hooks actually
  live (`useLocalParticipant`, `useRemoteParticipants`,
  `useConnectionState`); installed with `--legacy-peer-deps` because
  its own peer dependencies assume a web project with `react-dom`,
  which this is not and will never have
- `@livekit/react-native-webrtc` -- the actual native WebRTC bridge
  (microphone capture, audio transport)
- `@livekit/react-native-expo-plugin`, `@config-plugins/react-native-webrtc`
  -- Expo config plugins that wire the two packages above into the
  native iOS/Android projects during `expo prebuild`; without these,
  `npx expo prebuild` would produce a native project missing the
  permissions and native code LiveKit needs
- `expo-asset` -- not LiveKit-specific, but `expo-doctor` flagged it as
  a genuinely missing peer dependency of `expo-audio` during this
  phase, fixed then and worth keeping documented here since the error
  only surfaces as a runtime crash outside Expo Go otherwise

## Structure

- `src/api/` -- `client.ts` (same request/error contract as the web
  app's own client, with `expo-secure-store` instead of
  `localStorage`), `auth.ts`
- `src/context/AuthContext.tsx` -- session state, used by
  `RootNavigator` to decide Welcome vs. Home on launch
- `src/components/` -- `TopBar.tsx`, `MoreMenu.tsx`
- `src/screens/` -- one file per screen
- `src/navigation/RootNavigator.tsx` -- the splash-to-app handoff logic
- `src/theme/colors.ts` -- brand colors and font names, kept in sync
  with the website's own `src/index.css`
