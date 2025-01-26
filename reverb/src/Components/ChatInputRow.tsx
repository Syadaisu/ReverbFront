import React, { useState, useRef } from "react";
import { MdSend, MdAttachFile } from "react-icons/md";

const ChatInputRow: React.FC<{
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
}> = ({ onSendText, onSendFile }) => {
  const [isAttachingFile, setIsAttachingFile] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggle = () => {
    setIsAttachingFile(!isAttachingFile);
    setSelectedFile(null);
    setInputValue("");
  };

  const handleSend = async () => {
    if (isAttachingFile && selectedFile) {
      // If in file mode and a file is selected
      onSendFile(selectedFile);
      setSelectedFile(null);
      setIsAttachingFile(false);
    } else {
      // If in text mode
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      onSendText(trimmed);
      setInputValue("");
    }
  };

  return (
    <div className="p-2 bg-gray-700 flex items-center gap-2">
      

      {/* Animated container for input */}
      <div
        className={`
          transition-all duration-300 ease-in-out flex items-center
          ${isAttachingFile ? "w-60" : "w-full"}
        `}
      >
        {isAttachingFile ? (
          /** File input mode */
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
          /** Text input mode */
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
    {/* Toggle mode button (animated color on isAttachingFile) */}
    <button
        onClick={handleToggle}
        className={`
          flex items-center justify-center text-white px-4 py-2 rounded
          transition-all duration-300 ease-in-out
          ${isAttachingFile ? "bg-yellow-600 hover:bg-yellow-500" : "bg-gray-600 hover:bg-gray-500"}
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
  );
};

export default ChatInputRow;
