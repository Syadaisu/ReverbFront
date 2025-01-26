import React, { useState, useEffect, useRef } from "react";
import { useStomp, MessageProps } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import { getChannel, getChannelMessages, getUser, BASE_URL, AVATAR_URL, uploadFile } from "../Api/axios";
import { UserIcon } from "./IconLib";
import SearchBar from "./SearchBar";
import { MdSend } from "react-icons/md";
import { url } from "inspector";
import ChatInputRow from "./ChatInputRow";

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
  const [filteredMessages, setFilteredMessages] = useState<MessageProps[]>([]);
  const [searchValue , setSearchValue] = useState("");
  const [isAttachingFile, setIsAttachingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const handleFilterMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setSearchValue(search); // Update the search term state
    if (search.trim() === "") {
      setFilteredMessages([]); // Reset filtered messages if search is empty
      return;
    }
    const filtered = messages.filter((msg) =>
      msg.body.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredMessages(filtered);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setFilteredMessages([]);
  }

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
    const sub = stomp.onMessageSent(channelId, (newMsg) => {
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


  


  // This function is for normal text messages
  const handleSendText = (text: string) => {
    if (!stomp) return;
    stomp.sendMessage(channelId, auth.userId, text, "");
  };

  // This function is for file attachments
  const handleSendFile = async (file: File) => {
    try {
      const response = uploadFile(auth.accessToken, file)
      
      console.log("File upload response: ", response);

      const attachmentUuid = (await response).data;

      // 2) Then send the STOMP message with empty body but an attachmentUuid
      stomp.sendMessage(channelId, auth.userId, "", attachmentUuid);
      
    } catch (error) {
      console.error("Error uploading file or sending message:", error);
    }
  };

  return (

    <div className="flex flex-col h-full">
      {/* Channel Header and Search Bar */}
      <div className="flex items-center justify-between bg-gray-900 p-4 border-y border-gray-700">
        {/* Channel Info */}
        {channelInfo && (
          <div>
            <h2 className="text-2xl font-bold">{channelInfo.channelName}</h2>
            {channelInfo.channelDescription && (
              <p className="text-sm text-gray-300 mt-1">{channelInfo.channelDescription}</p>
            )}
          </div>
        )}
        {/* Search Bar on the Right */}
        <div>
          <SearchBar
            searchValue={searchValue}
            onSearch={handleFilterMessage}
            onClear={handleClearSearch}
          />
        </div>
      </div>
      {/* Messages list */}
      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
      {(searchValue ? filteredMessages : messages).length > 0 ? (
          (searchValue ? filteredMessages : messages).map((msg) => {
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
                <div className="text-gray-200">{renderMessageContent(msg)}</div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-400 mt-4">
          {searchValue ? "No messages found." : "No messages in this channel."}
        </div>
      )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box with toggle for attaching vs text */}
      <ChatInputRow
        onSendText={handleSendText}
        onSendFile={handleSendFile}
      />
    </div>
  );
};


const renderMessageContent = (msg: MessageProps) => {
  if (msg.body && msg.body.trim() !== "") {
    return <div className="text-gray-200">{msg.body}</div>;
  } else if (msg.attachmentUuid) {
    const url = BASE_URL + AVATAR_URL + msg.attachmentUuid;
    console.log("Attachment URL: ", url);
    return (
      <img loading="lazy" src={url} className='max-h-96 max-w-96' alt="attachement" />
    );
  } else {
    return <div className="text-gray-400 italic">Empty message</div>;
  }
};
export default ChatView;
