import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { LIVE_SOCKET_URL } from "../api/client";

/**
 * Ported from the web app's src/hooks/useLiveClass.js, kept faithful to
 * the original rather than redesigned -- this is the CLASSROOM
 * SIGNALING layer (raise hand, mute, lock, chat, etc.) over Socket.IO,
 * entirely separate from the actual audio connection, which LiveKit's
 * own <LiveKitRoom> handles independently (see LiveClassScreen.tsx).
 * Same architecture as the website: one socket for "what's happening in
 * the room" state, one LiveKit room for the media itself.
 */
export function useLiveClass(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectedCallbacksRef = useRef(new Set<() => void>());
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">(
    "connecting"
  );

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(LIVE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    setConnectionState("connecting");

    function onConnect() {
      setConnected(true);
      setConnectionState("connected");
    }
    function onDisconnect() {
      setConnected(false);
      setConnectionState("reconnecting");
    }
    function onReconnectAttempt() {
      setConnectionState("reconnecting");
    }
    function onReconnectFailed() {
      setConnectionState("disconnected");
    }
    function onReconnected() {
      reconnectedCallbacksRef.current.forEach((cb) => cb());
    }
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.io.on("reconnect", onReconnected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.io.off("reconnect", onReconnected);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  function withAck(event: string) {
    return (payload: unknown): Promise<any> =>
      new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error("Socket not connected"));
          return;
        }
        socketRef.current.emit(event, payload, (ack: any) => {
          if (ack?.ok) resolve(ack);
          else reject(new Error(ack?.error || `${event} failed`));
        });
      });
  }

  const joinClass = useCallback((liveClassId: string) => withAck("classroom:join")({ liveClassId }), []);
  const raiseHand = useCallback((liveClassId: string) => socketRef.current?.emit("classroom:raise-hand", { liveClassId }), []);
  const lowerHand = useCallback((liveClassId: string) => socketRef.current?.emit("classroom:lower-hand", { liveClassId }), []);
  const approveSpeaker = useCallback(
    (liveClassId: string, targetUserId: string) => withAck("classroom:approve-speaker")({ liveClassId, targetUserId }),
    []
  );
  const revokeSpeaker = useCallback(
    (liveClassId: string, targetUserId: string) => withAck("classroom:revoke-speaker")({ liveClassId, targetUserId }),
    []
  );
  const lowerAllHands = useCallback((liveClassId: string) => withAck("classroom:lower-all-hands")({ liveClassId }), []);
  const muteAll = useCallback((liveClassId: string) => withAck("classroom:mute-all")({ liveClassId }), []);
  const removeParticipant = useCallback(
    (liveClassId: string, targetUserId: string) => withAck("classroom:remove-participant")({ liveClassId, targetUserId }),
    []
  );
  const rejectSpeaker = useCallback(
    (liveClassId: string, targetUserId: string) => withAck("classroom:reject-speaker")({ liveClassId, targetUserId }),
    []
  );
  const lockClass = useCallback((liveClassId: string) => withAck("classroom:lock")({ liveClassId }), []);
  const unlockClass = useCallback((liveClassId: string) => withAck("classroom:unlock")({ liveClassId }), []);
  const endClass = useCallback((liveClassId: string) => withAck("classroom:end")({ liveClassId }), []);
  const sendChatMessage = useCallback(
    (liveClassId: string, body: string, channel?: string) =>
      socketRef.current?.emit("classroom:chat-message", { liveClassId, body, channel }),
    []
  );

  function on(event: string) {
    return (handler: (...args: any[]) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => socket.off(event, handler);
    };
  }

  const getSocket = useCallback(() => socketRef.current, []);
  const onReconnected = useCallback((handler: () => void) => {
    reconnectedCallbacksRef.current.add(handler);
    return () => reconnectedCallbacksRef.current.delete(handler);
  }, []);

  return {
    connected,
    connectionState,
    onReconnected,
    getSocket,
    joinClass,
    raiseHand,
    lowerHand,
    approveSpeaker,
    revokeSpeaker,
    rejectSpeaker,
    muteAll,
    lowerAllHands,
    removeParticipant,
    lockClass,
    unlockClass,
    endClass,
    sendChatMessage,
    onParticipantJoined: on("classroom:participant-joined"),
    onParticipantUpdated: on("classroom:participant-updated"),
    onParticipantLeft: on("classroom:participant-left"),
    onHandRaised: on("classroom:hand-raised"),
    onSpeakerApproved: on("classroom:speaker-approved"),
    onSpeakerRevoked: on("classroom:speaker-revoked"),
    onSpeakerRejected: on("classroom:speaker-rejected"),
    onMutedAll: on("classroom:muted-all"),
    onParticipantsBulkUpdate: on("classroom:participants"),
    onRemoved: on("classroom:removed"),
    onClassEnded: on("classroom:ended"),
    onHostDisconnected: on("classroom:host-disconnected"),
    onLocked: on("classroom:locked"),
    onUnlocked: on("classroom:unlocked"),
    onChatMessage: on("classroom:chat-message"),
  };
}
