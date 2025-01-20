import React, { useState, useEffect, useRef } from "react";
import { useStomp } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import { getChannel, getChannelMessages } from "../Api/axios";

interface ChannelInfo {
  channelId: number;
  channelName: string;
  channelDescription?: string;
}

interface ChatViewProps {
  serverId: number;
  channelId: number;
}

const ChatView: React.FC<ChatViewProps> = ({ serverId, channelId }) => {
  const { auth } = useAuth();
  const stomp = useStomp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Fetch existing messages on channel change
  useEffect(() => {
    if (!channelId || !auth?.accessToken) return;
    getChannel(auth.accessToken, channelId)
      .then((resp) => {
        if (resp.data) {
          console.log("resp.data: ", resp.data);
          setChannelInfo({
            channelId,
            channelName: resp.data.channelName,
            channelDescription: resp.data.description
          });
          console.log("Channel description: ", resp.data.channelDescription);
        }
      })
      .catch((err) => console.error("Failed to fetch channel info:", err));
    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
        }
      })
      .catch((err) => console.error("Failed to fetch channel messages:", err));


      console.log("Channel Info: ", channelInfo);
  }, [channelId, auth]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!stomp || !stomp.connected || !channelId) return;
    const sub = stomp.onMessageSent(serverId.toString(), channelId, (newMsg) => {
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [stomp, serverId, channelId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to re-fetch all messages (if needed)
  const refetchMessages = () => {
    if (!auth?.accessToken) return;
    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
        }
      })
      .catch(console.error);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!stomp) return;

    // Send the message
    stomp.sendMessage(channelId, auth.userId, inputValue.trim());

    // Clear input
    setInputValue("");

    // Optionally refetch or just rely on the STOMP event:
    // refetchMessages();
  };

  return (

    <div className="flex flex-col h-full">
      {/** Channel Header */}
      {channelInfo && (
      <div className="bg-gray-700 p-4 border-b border-gray-600">
        
        <h2 className="text-2xl font-bold">{channelInfo.channelName}</h2>

        {channelInfo.channelDescription && (
          <p className="text-sm text-gray-300 mt-1">{channelInfo.channelDescription}</p>
        )}
      </div>
      )}
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
