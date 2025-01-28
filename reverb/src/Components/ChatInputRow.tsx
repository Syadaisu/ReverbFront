import React, { useState, useRef } from "react";
import { MdSend, MdAttachFile, MdCancel } from "react-icons/md";

interface ChatInputRowProps {
  onSendText: (text: any, replyToId?: any) => void;
  onSendFile: (file: any, replyToId?: any) => void;
  replyParent: { id: string; body: string } | null;
  clearReply: () => void;
}

const ChatInputRow: React.FC<ChatInputRowProps> = ({
  onSendText,
  onSendFile,
  replyParent,
  clearReply,
}) => {
  const [isAttachingFile, setIsAttachingFile] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toggle text <-> file attach mode
  const handleToggle = () => {
    setIsAttachingFile(!isAttachingFile);
    setSelectedFile(null);
    setInputValue("");
  };

  // Called when user hits "Send"
  const handleSend = async () => {
    const replyToId = replyParent?.id; // Parent message ID if replying

    if (isAttachingFile && selectedFile) {
      // In "file mode" and we have a file:
      onSendFile(selectedFile, replyToId);
      setSelectedFile(null);
      setIsAttachingFile(false);
      clearReply(); // also clear the reply state
    } else {
      // In text mode
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      onSendText(trimmed, replyToId);
      setInputValue("");
      clearReply(); // clear the reply state
    }
  };

  const isAttachmentOnly = replyParent?.body === "";;

  return (
    <div className="p-2 bg-gray-700 flex flex-col gap-2">
      {/* If replying to a message, show a small banner */}
      {replyParent && (
        <div className="bg-gray-600 p-1 text-sm text-gray-300 rounded flex justify-between items-center mb-1">
          <div>
            <strong>Replying to:</strong>{" "}
            {isAttachmentOnly
            ? "an attachment"
            : replyParent.body.slice(0, 50) + (replyParent.body.length > 50 ? "…" : "")}
          </div>
          <button
            className="text-white ml-2 hover:text-red-500"
            onClick={clearReply}
            title="Cancel reply"
          >
            <MdCancel/>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Animated container for input */}
        <div
          className={`
            transition-all duration-300 ease-in-out flex items-center
            ${isAttachingFile ? "w-60" : "w-full"}
          `}
        >
          {isAttachingFile ? (
            // File input mode
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="text-white file:mr-2 file:py-1 file:px-2 file:bg-gray-600
                        file:text-white file:rounded file:border-0 file:cursor-pointer
                        cursor-pointer bg-gray-900 rounded-l outline-none w-full"
            />
          ) : (
            // Text input mode
            <input
              type="text"
              className="p-2 bg-gray-900 outline-none text-white rounded-l w-full"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />
          )}
        </div>

        {/* Toggle mode button */}
        <button
          onClick={handleToggle}
          className={`
            flex items-center justify-center text-white px-4 py-2 rounded
            transition-all duration-300 ease-in-out
            ${
              isAttachingFile
                ? "bg-yellow-600 hover:bg-yellow-500"
                : "bg-gray-600 hover:bg-gray-500"
            }
          `}
        >
          {isAttachingFile ? "Text" : <MdAttachFile size={20} />}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="
            flex items-center justify-center gap-1 px-4 py-2 bg-blue-600
            rounded hover:bg-blue-500 text-white font-semibold
            transition-all duration-300 ease-in-out
          "
        >
          Send <MdSend />
        </button>
      </div>
    </div>
  );
};

export default ChatInputRow;
