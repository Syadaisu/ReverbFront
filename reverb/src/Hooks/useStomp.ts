// src/Hooks/useStomp.ts
import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";

interface ServerJoinedEvent {
  serverId: string;
  userId: string;
}

interface ChannelCreatedEvent {
  channel: ChannelProps;
}

interface ChannelEditedEvent {
  channel: ChannelProps;
}

interface ChannelDeletedEvent {
  channelId: string;
}

interface MessageSentEvent {
  message: MessageProps;
}

export interface ChannelProps {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

export interface MessageProps {
  id: string;
  serverId: string;
  channelId: string;
  userId: string;
  content: string;
  timestamp: string;
}

export interface ServerProps {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  channelIds: string[];
}

export const useStomp = () => {
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  // Subscriptions references
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8181/ws"); // Update with your backend URL
    const stompClient = new Client({
      webSocketFactory: () => socket as unknown as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        console.log("Connected to STOMP server!");
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      onWebSocketClose: () => {
        setConnected(false);
        console.log("WebSocket connection closed");
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // Publish helper
  const publish = useCallback((destination: string, body: any) => {
    if (stompClientRef.current && connected) {
      stompClientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.warn("STOMP client not connected");
    }
  }, [connected]);

  // Subscribe helper
  const subscribe = useCallback(
    (destination: string, callback: (msg: IMessage) => void) => {
      if (stompClientRef.current && connected) {
        const subscription = stompClientRef.current.subscribe(destination, callback);
        subscriptionsRef.current.push(subscription);
        return subscription;
      } else {
        console.warn("STOMP client not connected");
        return null;
      }
    },
    [connected]
  );

  // Unsubscribe all on cleanup
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, []);

  // Define publish methods
  const joinServer = (serverId: string, userId: string) => {
    publish("/app/joinServer", { serverId, userId });
  };

  const createChannel = (serverId: string, name: string, description?: string) => {
    publish("/app/createChannel", { serverId, name, description });
  };

  const createServer = (name: string, ownerId: number, description?: string, ) => {
    publish("/app/createServer", { name, description, ownerId });
  };

  const editChannel = (channelId: string, name: string, description?: string) => {
    publish("/app/editChannel", { channelId, name, description });
  };

  const deleteChannel = (serverId: string, channelId: string) => {
    publish("/app/deleteChannel", { serverId, channelId });
  };

  const sendMessage = (serverId: string, channelId: string, userId: string, content: string) => {
    publish("/app/sendMessage", { serverId, channelId, userId, content });
  };

  // Define subscribe methods
  const onServerJoined = (callback: (event: ServerJoinedEvent) => void) => {
    const destination = "/topic/server.{serverId}.joined"; // Replace {serverId} dynamically
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as ServerJoinedEvent;
      callback(body);
    });
  };

  const onServerCreated = (callback: (event: ServerProps) => void) => {
    const destination = "/topic/server.created";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as ServerProps;
      callback(body);
    });
  }

  const onChannelCreated = (serverId: string, callback: (event: ChannelCreatedEvent) => void) => {
    const destination = `/topic/server.${serverId}.channel.created`;
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as ChannelCreatedEvent;
      callback(body);
    });
  };

  const onChannelEdited = (serverId: string, callback: (event: ChannelEditedEvent) => void) => {
    const destination = `/topic/server.${serverId}.channel.edited`;
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as ChannelEditedEvent;
      callback(body);
    });
  };

  const onChannelDeleted = (serverId: string, callback: (event: ChannelDeletedEvent) => void) => {
    const destination = `/topic/server.${serverId}.channel.deleted`;
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as ChannelDeletedEvent;
      callback(body);
    });
  };

  const onMessageSent = (serverId: string, channelId: string, callback: (event: MessageSentEvent) => void) => {
    const destination = `/topic/server.${serverId}.channel.${channelId}.messages`;
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as MessageSentEvent;
      callback(body);
    });
  };

  return {
    connected,
    joinServer,
    createChannel,
    createServer,
    editChannel,
    deleteChannel,
    sendMessage,
    onServerJoined,
    onServerCreated,
    onChannelCreated,
    onChannelEdited,
    onChannelDeleted,
    onMessageSent,
  };
};
