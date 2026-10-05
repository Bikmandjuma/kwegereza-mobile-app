import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import * as Crypto from "expo-crypto";
import { SOCKET_URL } from "../api/client";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  [key: string]: unknown;
};

/**
 * Same waitForConnectedSocket pattern as the web app's own hook: the
 * socket object exists synchronously the instant io() is called, but
 * the handshake takes a moment. Without this, an emit made in that
 * window either silently buffers with no bounded wait, or -- worse --
 * its ack callback can simply never fire if the connection is slow or
 * drops before completing, hanging the calling Promise forever.
 */
function waitForConnectedSocket(socketRef: React.MutableRefObject<Socket | null>, timeoutMs = 8000): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const maybeSocket = socketRef.current;
    if (!maybeSocket) {
      reject(new Error("Socket not connected"));
      return;
    }
    // Rebound as an explicitly non-null const: TypeScript's narrowing
    // from the guard above doesn't persist into the hoisted onConnect
    // function declaration below (it closes over the wider, pre-guard
    // type), so this makes the non-null guarantee explicit rather than
    // relying on control-flow analysis that doesn't reach in there.
    const socket: Socket = maybeSocket;
    if (socket.connected) {
      resolve(socket);
      return;
    }
    const timeout = setTimeout(() => {
      socket.off("connect", onConnect);
      reject(new Error("Ntibyashobotse kwihuza na seriveri. Gerageza nanone."));
    }, timeoutMs);
    function onConnect() {
      clearTimeout(timeout);
      resolve(socket);
    }
    socket.once("connect", onConnect);
  });
}

export function useChatSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinConversation = useCallback((conversationId: string) => {
    return waitForConnectedSocket(socketRef).then(
      (socket) =>
        new Promise((resolve, reject) => {
          socket.emit("conversation:join", { conversationId }, (ack: any) => {
            if (ack?.ok) resolve(ack);
            else reject(new Error(ack?.error || "Ntibyakunze kwinjira mu kiganiro."));
          });
        })
    );
  }, []);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    return waitForConnectedSocket(socketRef).then(
      (socket) =>
        new Promise((resolve, reject) => {
          // Generated once per logical send -- if this exact call gets
          // retried (network hiccup, a double-tap before the UI
          // disables the send button), the server's unique constraint
          // on clientMessageId guarantees only one message is ever
          // actually stored.
          const clientMessageId = Crypto.randomUUID();
          socket.emit("message:send", { conversationId, clientMessageId, body }, (ack: any) => {
            if (ack?.ok) resolve(ack);
            else reject(new Error(ack?.error || "Ntibyakunze kohereza ubutumwa."));
          });
        })
    );
  }, []);

  const onNewMessage = useCallback((handler: (msg: ChatMessage) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, []);

  const onTyping = useCallback((handler: (payload: unknown) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("typing:update", handler);
    return () => socket.off("typing:update", handler);
  }, []);

  const onPresence = useCallback((handler: (payload: unknown) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("presence:update", handler);
    return () => socket.off("presence:update", handler);
  }, []);

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
  }, []);

  return { connected, joinConversation, sendMessage, onNewMessage, onTyping, onPresence, emitTyping };
}
