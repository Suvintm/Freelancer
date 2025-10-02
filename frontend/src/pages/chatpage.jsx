import { useParams } from "react-router-dom";

const ChatPage = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 bg-white shadow-md font-bold">
        Chat for Order #{orderId}
      </header>
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Messages will go here */}
        <p className="text-gray-500">No messages yet...</p>
      </div>
      <footer className="p-4 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatPage;
