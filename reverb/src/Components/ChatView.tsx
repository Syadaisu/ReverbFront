// src/Components/ChatView.tsx
import React, { useState, useEffect, useRef } from "react";
import { useStomp } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import { MessageProps } from "../Hooks/useStomp"; // or define your own
import { getChannelMessages } from "../Api/axios"; // your REST helper

interface ChatViewProps {
  serverId: string;
  channelId: number;
}

const ChatView: React.FC<ChatViewProps> = ({ serverId, channelId }) => {
  const { auth } = useAuth(); 
  const stomp = useStomp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!channelId) return;
    if (!auth || !auth.accessToken) {
      console.log("No auth token, skipping message fetch");
      return;
    }
    console.log("Fetching messages for channel:", channelId);

    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        console.log("Fetched messages from server:", resp.data);
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
        } else {
          console.error("Expected an array of messages but got:", resp.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch channel messages:", err);
      });
  }, [channelId, auth]);


  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    if (!channelId) return;

    console.log(`Subscribing to messages for channel: ${channelId}`);
    const sub = stomp.onMessageSent(serverId, channelId, (event: any) => {
      // event => { message: MessageProps }
      console.log("Received realtime message:", event.message);
      setMessages((prev) => [...prev, event.message]);
    });

    return () => {
      console.log(`Unsubscribing from channelId=${channelId} messages`);
      sub?.unsubscribe();
    };
  }, [stomp, serverId, channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const refetchMessages = () => {
    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        console.log("Fetched messages from server:", resp.data);
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
        } else {
          console.error("Expected an array of messages but got:", resp.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch channel messages:", err);
      });
    }

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    stomp.sendMessage(channelId, auth.userId, text);

    setInputValue("");

    refetchMessages();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-700 p-2 rounded">
            <span className="font-bold">{msg.authorId}:</span> {msg.body}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-2 bg-gray-700 flex">
        <input
          type="text"
          className="flex-grow p-2 rounded-l bg-gray-900 outline-none"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-gray-500 rounded-r hover:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatView;
