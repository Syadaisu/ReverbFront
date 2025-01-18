// src/Hooks/useStomp.ts
import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import { get } from "http";

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


export interface ChannelProps {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

export interface MessageProps {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  timestamp: string;
  attachment?: "";
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

  const createChannel = (serverId: string, channelName: string, channelDescription?: string) => {
    console.log("Creating channel with Name:", channelName, "Description:", channelDescription, "Server ID:", serverId);
    publish("/app/createChannel", { serverId, channelName, channelDescription });
  };

  const createServer = (serverName: string, ownerId: number, serverDescription?: string, ) => {
    console.log("Creating server with Name:", serverName, "Description:", serverDescription, "User ID:", ownerId);
    publish("/app/createServer", { serverName, serverDescription, ownerId });
  };

  const editChannel = (channelId: string, name: string, description?: string) => {
    publish("/app/editChannel", { channelId, name, description });
  };

  const getChannels = (serverId: string) => {
    publish("/app/getChannels", { serverId });
  };

  const deleteChannel = (serverId: string, channelId: string) => {
    publish("/app/deleteChannel", { serverId, channelId });
  };

  const sendMessage = (channelId: number, authorId: number, body: string) => {
    console.log("Sending message channel:", channelId, "author:", authorId, "body:", body);
    publish("/app/addMessage", {
      channelId,
      authorId,
      body,
      responseToId: "",
      responseTo: "",
      attachment: 0,
    });
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

  const onMessageSent = (serverId: string, channelId: number, callback: (event: MessageProps) => void) => {
    const destination = `/topic/channel.${channelId}.message.added`;
    console.log("Subscribing to:", destination);
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as MessageProps;
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
    getChannels,
  };
};
