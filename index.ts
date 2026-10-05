import { registerGlobals } from '@livekit/react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Must run before any LiveKit code anywhere in the app -- registers the
// WebRTC globals (RTCPeerConnection, MediaStream, etc.) LiveKit needs.
// This is also exactly the registration point where the New
// Architecture compatibility issue I found during research could
// surface (a real, currently-unresolved upstream issue as of this
// writing -- see this project's README for the full context). If
// LiveKit's Room connection fails specifically here or immediately
// after, that upstream issue is the first thing to check, not a bug
// in this app's own code.
registerGlobals();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
