// src/Components/ChatView.tsx
import React, { useState, useEffect, useRef } from "react";
import { useStomp } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import { MessageProps } from "../Hooks/useStomp"; // from your interface

const ChatView = ({ serverId }: { serverId: string }) => {
  const { auth } = useAuth(); // { id, username, ... }
  const stomp = useStomp();   // your STOMP context/hook
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For simplicity, we’ll pick a single channel to subscribe to
  const [channelId, setChannelId] = useState("101"); // default for example
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Subscribe to onMessageSent for that server & channel
  useEffect(() => {
    if (!stomp || !stomp.connected) return;

    // Subscribe
    const sub = stomp.onMessageSent(serverId, channelId, (event) => {
      // event is { message: MessageProps }
      setMessages((prev) => [...prev, event.message]);
    });

    // Cleanup
    return () => {
      sub?.unsubscribe();
    };
  }, [stomp, serverId, channelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // Use your sendMessage method
    stomp.sendMessage(serverId, channelId, auth.id, inputValue);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Selector (for demo) */}
      <div className="bg-gray-600 p-2">
        <label className="mr-2">Channel ID:</label>
        <select 
          className="bg-gray-700 p-1"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        >
          <option value="101">General</option>
          <option value="102">Random</option>
          <option value="103">Dev-Talk</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-700 p-2 rounded">
            <span className="font-bold">{msg.userId}:</span> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
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
