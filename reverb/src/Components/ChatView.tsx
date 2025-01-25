import React, { useState, useEffect, useRef } from "react";
import { useStomp, MessageProps } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import { getChannel, getChannelMessages, getUser, BASE_URL, AVATAR_URL } from "../Api/axios";
import { UserIcon } from "./IconLib";

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
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userList, setUserList] = useState<any[]>([]);






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










  useEffect(() => {
  if (!auth?.accessToken || messages.length === 0) return;

  // Extract current user IDs from userList for easy lookup
  const existingUserIds = new Set(userList.map(user => user.userId));

  // Gather unique authorIds that are not in userList
  const userIdsToFetch = Array.from(
    new Set(
      messages
        .map(msg => msg.authorId)
        .filter(authorId => !existingUserIds.has(authorId))
    )
  );

  if (userIdsToFetch.length === 0) return;

  console.log("User IDs to fetch: ", userIdsToFetch);

  // Create an array of getUser promises
  const userFetchPromises = userIdsToFetch.map(userId => {
    console.log("Fetching user with id: ", userId);
    return getUser(auth.accessToken, Number(userId))
      .then(resp => resp.data)
      .catch(error => {
        console.error(`Error fetching user with ID ${userId}:`, error);
        return null; // Handle individual fetch errors gracefully
      });
  });

  // Execute all getUser calls concurrently
  Promise.all(userFetchPromises)
    .then(fetchedUsers => {
      // Filter out any failed fetches (null values)
      const validUsers = fetchedUsers.filter(user => user !== null);

      if (validUsers.length > 0) {
        setUserList(prev => [...prev, ...validUsers]);
      }
    })
    .catch(error => {
      console.error("Error fetching users:", error);
    });

}, [messages, auth, userList]);





  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!stomp || !stomp.connected || !channelId) return;
    const sub = stomp.onMessageSent(serverId.toString(), channelId, (newMsg) => {
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    console.log("userList: ", userList);
    console.log("messages: ", messages);
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
        <div className="bg-gray-900 p-4 border-y border-gray-700">
          <h2 className="text-2xl font-bold">{channelInfo.channelName}</h2>
          {channelInfo.channelDescription && (
            <p className="text-sm text-gray-300 mt-1">{channelInfo.channelDescription}</p>
          )}
        </div>
      )}
      {/* Messages list */}
      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
        {messages.map((msg) => {
          const user = userList.find((user) => user.userId === msg.authorId);
          return (
            <div key={msg.id} className="bg-gray-700 p-2 rounded flex items-start">
              {user ? (
                <UserIcon name = {user.userName} picture = {BASE_URL+AVATAR_URL+user.avatarUuid} />
              ) : (
                <UserIcon name = "Unknown User" />
              )} 
              <div className="ml-2">
                <div className="flex items-center">
                  <span className="font-bold text-white mr-2">
                    {user ? user.userName : 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.creationDate).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-200">{msg.body}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-2 bg-gray-700 flex">
        <input
          type="text"
          className="flex-grow p-2 rounded-l bg-gray-900 outline-none text-white"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-gray-500 rounded-r hover:bg-gray-400 text-white font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatView;
