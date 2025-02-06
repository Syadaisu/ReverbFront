// src/Components/ChatView.tsx

import React, { useState, useEffect, useRef } from "react";
import { useStomp, MessageProps } from "../Hooks/useStomp";
import useAuth from "../Hooks/useAuth";
import {
  getChannel,
  getChannelMessages,
  getUser,
  getServer,
  getAdminsByIds,
  BASE_URL,
  AVATAR_URL,
  uploadFile,
} from "../Api/axios";
import { UserIcon } from "./IconLib";
import SearchBar from "./SearchBar";
import ChatInputRow from "./ChatInputRow";
import DeleteMessageConfirmation from "./Modals/DeleteMessageConfirmation";
import { FaReply, FaTrash } from "react-icons/fa";

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

  const [serverOwnerId, setServerOwnerId] = useState<number | null>(null);
  const [authorizedUserIds, setAuthorizedUserIds] = useState<number[]>([]);

  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  const [filteredMessages, setFilteredMessages] = useState<MessageProps[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageProps | null>(null);

  const [replyParent, setReplyParent] = useState<null | { id: string; body: string }>(
    null
  );

  //Fetch info for the server and channel
  useEffect(() => {
    if (!auth?.accessToken || !serverId) return;

    // Fetch server info (to get owner ID)
    getServer(auth.accessToken, serverId)
      .then((resp) => {
        if (resp.data && resp.data.ownerId) {
          setServerOwnerId(resp.data.ownerId);
        }
      })
      .catch((err) => console.error("Failed to fetch server info:", err));
  }, [serverId, auth]);

  useEffect(() => {
    if (!channelId || !auth?.accessToken) return;

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

    getChannelMessages(auth.accessToken, channelId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setMessages(resp.data);
          //console.log("Fetched channel messages:", resp.data);
        }
      })
      .catch((err) => console.error("Failed to fetch channel messages:", err));
  }, [channelId, auth]);

  //Fetch authorized users
  useEffect(() => {
    if (!auth?.accessToken || !serverId) return;

    getAdminsByIds(auth.accessToken, serverId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setAuthorizedUserIds(resp.data as number[]);
        } else {
          setAuthorizedUserIds([]);
        }
      })
      .catch((error) => console.error("Error fetching authorized users:", error));
  }, [auth, serverId]);

  useEffect(() => {
    if (!auth?.accessToken || messages.length === 0) return;

    const existingUserIds = new Set(userList.map((u) => u.userId));
    const userIdsToFetch = Array.from(
      new Set(
        messages
          .map((msg) => msg.authorId)
          .filter((authorId) => !existingUserIds.has(authorId))
      )
    );

    if (userIdsToFetch.length === 0) return;

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

  const stompConnected = !!(stomp && stomp.connected);

  useEffect(() => {
    if (!stompConnected) return;

    const subEditUser = stomp.onUserEditedSignal((data) => {
      //console.log("Received user.edited signal:", data);
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
      //console.log("Received message.deleted signal:", data);
      setMessages((prev) => prev.filter((m) => m.messageId !== data.messageId));
    });

    return () => {
      subEditUser?.unsubscribe();
      subChannelEdited?.unsubscribe();
      subMessageDeleted?.unsubscribe();
    };
  }, [stompConnected, stomp, auth, channelId]);

  useEffect(() => {
    if (!stompConnected || !channelId) return;
    const subMsg = stomp.onMessageSent(channelId, (newMsg) => {
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => {
      subMsg?.unsubscribe();
    };
  }, [stompConnected, stomp, channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  function handleReplyClick(msg: MessageProps) {
    setReplyParent({ id: msg.messageId, body: msg.body });
  }

  const openDeleteModal = (msg: MessageProps) => {
    setMessageToDelete(msg);
    setShowDeleteModal(true);
  };

  const handleDeletedMessage = () => {
    if (!messageToDelete) return;
    setMessages((prev) =>
      prev.filter((m) => m.messageId !== messageToDelete.messageId)
    );
  };

  const handleSendText = (text: string, replyId?: string) => {
    stomp.sendMessage(channelId, auth.userId, text, "", replyParent?.id || "");
  };

  const handleSendFile = async (file: File, replyId?: string) => {
    try {
      const resp = await uploadFile(auth.accessToken, file);
      const attachmentUuid = resp.data;
      stomp.sendMessage(channelId, auth.userId, "", attachmentUuid, replyParent?.id || "");
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-gray-900 p-4 border-y border-gray-700">
        {channelInfo && (
          <div>
            <h2 className="text-2xl font-bold">{channelInfo.channelName}</h2>
            {channelInfo.channelDescription && (
              <p className="text-sm text-gray-300 mt-1">
                {channelInfo.channelDescription}
              </p>
            )}
          </div>
        )}
        <SearchBar
          searchValue={searchValue}
          onSearch={handleFilterMessage}
          onClear={handleClearSearch}
        />
      </div>

      <div className="flex-grow overflow-y-auto bg-gray-800 p-3 space-y-2">
        {(searchValue ? filteredMessages : messages).length > 0 ? (
          (searchValue ? filteredMessages : messages).map((msg) => {
            const user = userList.find((u) => u.userId === msg.authorId);

            const isAuthor = auth.userId === Number(msg.authorId);

            const isOwner = serverOwnerId === auth.userId;

            const isAdmin = authorizedUserIds.includes(auth.userId);

            const canDelete = isAuthor || isOwner || isAdmin;

            return (
              <div key={msg.messageId} className="mb-4">
                {msg.responseToId && (
                  <ParentSnippet replyToId={msg.responseToId} messages={messages} />
                )}
                <div className="relative bg-gray-700 p-2 rounded flex items-start">
                  {user ? (
                    <UserIcon
                      name={user.userName}
                      picture={`${BASE_URL + AVATAR_URL + user.avatarUuid}`}
                      refreshflag={refreshIconFlag}
                    />
                  ) : (
                    <UserIcon name="Unknown User" />
                  )}

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

                  <div className="absolute top-2 right-2 flex items-center space-x-3">
                    {canDelete && (
                      <button
                        className="text-gray-400 hover:text-red-500"
                        title="Delete message"
                        onClick={() => openDeleteModal(msg)}
                      >
                        <FaTrash size={15} />
                      </button>
                    )}
                    <button
                      className="ml-auto text-xs text-gray-400 hover:text-yellow-500"
                      onClick={() => handleReplyClick(msg)}
                    >
                      <FaReply size={15} />
                    </button>
                  </div>
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

      <ChatInputRow
        onSendText={(text, replyId) => {
          handleSendText(text, replyId);
        }}
        onSendFile={(file, replyId) => {
          handleSendFile(file, replyId);
        }}
        replyParent={replyParent}
        clearReply={() => setReplyParent(null)}
      />

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

function ParentSnippet({
  replyToId,
  messages,
}: {
  replyToId: string;
  messages: MessageProps[];
}) {
  const parent = messages.find((m) => m.messageId === replyToId);
  if (!parent) {
    return (
      <div className="mb-1 p-1 bg-gray-600 text-xs text-gray-300 italic rounded">
        [Replied message not found]
      </div>
    );
  }

  const isAttachmentOnly =
    (!parent.body || !parent.body.trim()) && parent.attachmentUuid;

  return (
    <div className="mb-1 p-1 bg-gray-600 text-xs text-gray-300 rounded">
      <span className="font-bold">Replying to:</span>{" "}
      {isAttachmentOnly
        ? "an attachment."
        : parent.body.slice(0, 60) + (parent.body.length > 60 ? "…" : "")}
    </div>
  );
}

export default ChatView;
