import React, { useState, useEffect, useRef } from "react";
import { useStomp, MessageProps } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import {
  getChannel,
  getChannelMessages,
  getUser,
  BASE_URL,
  AVATAR_URL,
  uploadFile,
} from "../Api/axios";
import { UserIcon } from "./IconLib";
import SearchBar from "./SearchBar";
import ChatInputRow from "./ChatInputRow";
import DeleteMessageConfirmation from "./DeleteMessageConfirmation";
import { MdSend } from "react-icons/md";

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

  // Channel info
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);

  // Messages & user data
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  // Searching
  const [filteredMessages, setFilteredMessages] = useState<MessageProps[]>([]);
  const [searchValue, setSearchValue] = useState("");

  // For forcing an <img> re-fetch if needed
  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  // For the "Delete message" modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageProps | null>(null);

  // ---------------------------
  // 1) Fetch channel info & messages on mount or channel change
  // ---------------------------
  useEffect(() => {
    if (!channelId || !auth?.accessToken) return;

    // Fetch channel info
    getChannel(auth.accessToken, channelId)
      .then((resp) => {
        if (resp.data) {
          setChannelInfo({
            channelId,
            channelName: resp.data.channelName,
            channelDescription: resp.data.description,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch channel info:", err));

    // Fetch channel messages
    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
        }
      })
      .catch((err) => console.error("Failed to fetch channel messages:", err));

  }, [channelId, auth]);

  // ---------------------------
  // 2) For each message, fetch user info if not in userList
  // ---------------------------
  useEffect(() => {
    if (!auth?.accessToken || messages.length === 0) return;

    const existingUserIds = new Set(userList.map((u) => u.userId));
    // unique authorIds not in userList
    const userIdsToFetch = Array.from(
      new Set(
        messages
          .map((msg) => msg.authorId)
          .filter((authorId) => !existingUserIds.has(authorId))
      )
    );

    if (userIdsToFetch.length === 0) return;

    // fetch all missing user records in parallel
    const userFetchPromises = userIdsToFetch.map((userId) =>
      getUser(auth.accessToken, Number(userId))
        .then((r) => r.data)
        .catch(() => null) // ignore failures
    );

    Promise.all(userFetchPromises)
      .then((fetched) => {
        const valid = fetched.filter((u) => u !== null);
        if (valid.length > 0) {
          setUserList((prev) => [...prev, ...valid]);
        }
      })
      .catch((error) => console.error("Error fetching user batch:", error));
  }, [messages, auth, userList]);

  // ---------------------------
  // 3) WebSocket logic: user edited signals, message-sent signals, etc.
  // ---------------------------
  useEffect(() => {
    if (!stomp || !stomp.connected) return;

    // minimal user-edited signal
    const subEditUser = stomp.onUserEditedSignal((data) => {
      console.log("Received user.edited signal:", data);
      getUser(auth.accessToken, data.userId)
        .then((resp) => {
          const updatedUser = resp.data;
          setUserList((prev) => {
            const idx = prev.findIndex((u) => u.userId === updatedUser.userId);
            if (idx >= 0) {
              const newList = [...prev];
              newList[idx] = updatedUser;
              return newList;
            }
            return [...prev, updatedUser];
          });
        })
        .catch(console.error);

      // If we want to force <img> re-fetch
      setRefreshIconFlag((x) => x + 1);
    });

    const subChannelEdited = stomp.onChannelEditedSignal((data) => {
      console.log("Received channel.edited signal:", data);
      if (channelId === data.channelId) {
        getChannel(auth.accessToken, channelId)
          .then((resp) => {
            if (resp.data) {
              setChannelInfo({
                channelId,
                channelName: resp.data.channelName,
                channelDescription: resp.data.description,
              });
            }
          })
          .catch(console.error);
      }
    });

    const subMessageDeleted = stomp.onMessageDeletedSignal((data) => {
      console.log("Received message.deleted signal:", data);
      setMessages((prev) => prev.filter((m) => m.messageId !== data.messageId));
    });

    return () => {
      subEditUser?.unsubscribe();
      subChannelEdited?.unsubscribe();
      subMessageDeleted?.unsubscribe();
    };
  }, [stomp, auth]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!stomp || !stomp.connected || !channelId) return;
    const subMsg = stomp.onMessageSent(channelId, (newMsg) => {
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => {
      subMsg?.unsubscribe();
    };
  }, [stomp, channelId]);

  // ---------------------------
  // 4) Scroll to bottom on messages update
  // ---------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------
  // 5) Searching 
  // ---------------------------
  function handleFilterMessage(e: React.ChangeEvent<HTMLInputElement>) {
    const search = e.target.value;
    setSearchValue(search);
    if (!search.trim()) {
      setFilteredMessages([]);
      return;
    }
    const filtered = messages.filter((m) =>
      m.body.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredMessages(filtered);
  }

  function handleClearSearch() {
    setSearchValue("");
    setFilteredMessages([]);
  }

  // ---------------------------
  // 6) Deleting a message
  // ---------------------------
  const openDeleteModal = (msg: MessageProps) => {
    setMessageToDelete(msg);
    console.log("Opening delete modal for message:", msg, "delete message id:", messageToDelete?.messageId);
    setShowDeleteModal(true);
  };

  const handleDeletedMessage = () => {
    // Remove from local state
    if (!messageToDelete) return;
    setMessages((prev) => prev.filter((m) => m.messageId !== messageToDelete.messageId));
  };

  // ---------------------------
  // 7) Sending text or file
  // ---------------------------
  const handleSendText = (text: string) => {
    stomp.sendMessage(channelId, auth.userId, text, "");
  };

  const handleSendFile = async (file: File) => {
    try {
      const resp = await uploadFile(auth.accessToken, file);
      const attachmentUuid = resp.data;
      stomp.sendMessage(channelId, auth.userId, "", attachmentUuid);
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Channel Header + Search */}
      <div className="flex items-center justify-between bg-gray-900 p-4 border-y border-gray-700">
        {channelInfo && (
          <div>
            <h2 className="text-2xl font-bold">{channelInfo.channelName}</h2>
            {channelInfo.channelDescription && (
              <p className="text-sm text-gray-300 mt-1">{channelInfo.channelDescription}</p>
            )}
          </div>
        )}
        <SearchBar
          searchValue={searchValue}
          onSearch={handleFilterMessage}
          onClear={handleClearSearch}
        />
      </div>

      {/* Messages list */}
      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
        {(searchValue ? filteredMessages : messages).length > 0 ? (
          (searchValue ? filteredMessages : messages).map((msg) => {
            const user = userList.find((u) => u.userId === msg.authorId);
            const isAuthor = (auth.userId === Number(msg.authorId));

            return (
              <div key={msg.messageId} className="relative bg-gray-700 p-2 rounded flex items-start mb-2">
                {/* Avatar */}
                {user ? (
                  <UserIcon
                    name={user.userName}
                    picture={`${BASE_URL + AVATAR_URL + user.avatarUuid}`}
                    refreshflag={refreshIconFlag}
                  />
                ) : (
                  <UserIcon name="Unknown User" />
                )}
                {/* Message text or image */}
                <div className="ml-2">
                  <div className="flex items-center">
                    <span className="font-bold text-white mr-2">
                      {user ? user.userName : "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.creationDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-200">{renderMessageContent(msg)}</div>
                </div>

                {/* Show "Delete" button if author */}
                {isAuthor && (
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    title="Delete message"
                    onClick={() => openDeleteModal(msg)}
                  >
                    ✕
                  </button>
                )}
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

      {/* Chat input row */}
      <ChatInputRow onSendText={handleSendText} onSendFile={handleSendFile} />

      {/* Delete Message Confirmation Modal */}
      {showDeleteModal && messageToDelete && (
        <DeleteMessageConfirmation
          messageId={messageToDelete.messageId}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleDeletedMessage}
        />
      )}
    </div>
  );
};

/** Renders either text body or attached image */
function renderMessageContent(msg: MessageProps) {
  if (msg.body && msg.body.trim()) {
    return <>{msg.body}</>;
  }
  if (msg.attachmentUuid) {
    const url = `${BASE_URL}${AVATAR_URL}${msg.attachmentUuid}`;
    return (
      <img
        loading="lazy"
        src={url}
        alt="attachment"
        className="max-h-96 max-w-96"
      />
    );
  }
  return <span className="italic text-gray-400">Empty message</span>;
}

export default ChatView;
