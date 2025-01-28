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
  channelId: string;
  channelName: string;
  description?: string;
  roleAccess?:string;
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
  messageId: string;
  channelId: string;
  authorId: string;
  body: string;
  creationDate: string;
  attachmentUuid?: string;
}

export interface ServerProps {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  channelIds: string[];
  serverIconUuid?: string;
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
  const joinServer = (serverName: string, userId: string) => {
    publish("/app/joinServer", { serverName, userId });
  };

  const createChannel = (serverId: string, channelName: string, description?: string) => {
    console.log("Creating channel with Name:", channelName, "Description:", description, "Server ID:", serverId);
    publish("/app/createChannel", { serverId, channelName, description });
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

  const deleteChannelSignal = (channelId: number) => {
    publish("/app/deleteChannelSignal", {channelId });
  }

  const deleteServerSignal = (serverId: number) => {
    publish("/app/deleteServerSignal", {serverId });
  }

  const deleteMessageSignal = (messageId: string) => {
    publish("/app/deleteMessageSignal", {messageId });
  }

  const editServerSignal = (serverId: number) => {
    publish("/app/editServerSignal", { serverId});
  };

  const editChannelSignal = (channelId: number) => {
    publish("/app/editChannelSignal", {channelId });
  }

  const editUserSignal = (userId: number) => {
    publish("/app/editUserSignal", {userId });
  }

  const sendMessage = (channelId: number, authorId: number, body: string, attachmentUuid: string) => {
    console.log("Sending message channel:", channelId, "author:", authorId, "body:", body, "attachment:", attachmentUuid);
    publish("/app/addMessage", {
      channelId,
      authorId,
      body,
      responseToId: "",
      responseTo: "",
      attachmentUuid: attachmentUuid,
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
    const destination = `/topic/server.channel.added`;
    console.log("Subscribing to:", destination);
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

  const onMessageSent = (channelId: number, callback: (event: MessageProps) => void) => {
    const destination = `/topic/channel.${channelId}.message.added`;
    console.log("Subscribing to:", destination);
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body) as MessageProps;
      callback(body);
    });
  };


  const onServerEditedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/server.edited";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body); 
    });
  };

  const onChannelEditedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/channel.edited";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body);
    });
  };
  
  const onChannelDeletedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/channel.deleted";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body);
    });
  };

  const onServerDeletedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/server.deleted";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body);
    });
  };

  const onUserEditedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/user.edited";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body);
    });
  };

  const onMessageDeletedSignal = (callback: (payload: any) => void) => {
    const destination = "/topic/message.deleted";
    return subscribe(destination, (msg) => {
      const body = JSON.parse(msg.body);
      callback(body);
    });
  }


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
    onServerEditedSignal,
    onChannelDeletedSignal,
    deleteChannelSignal,
    editServerSignal,
    deleteServerSignal,
    editChannelSignal,
    onServerDeletedSignal,
    onChannelEditedSignal,
    onUserEditedSignal,
    editUserSignal,
    onMessageDeletedSignal,
    deleteMessageSignal,
  };
};
