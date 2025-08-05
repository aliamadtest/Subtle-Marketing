import { useNavigate } from "react-router-dom";
import { useState } from "react";

function AdminBoard() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);

  const handleViewHistory = () => {
    if (selectedUser) {
      navigate(`/transfer-history/${selectedUser}`);
    } else {
      alert("Please select a user first");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Dashboard</h2>

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => navigate("/transfer-form")}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Transfer Amount
          </button>

          <button
            onClick={handleViewHistory}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            View History
          </button>
          <button
            onClick={() => navigate("/expense-history")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            View Expense History
          </button>
        </div>

        <div className="flex gap-4 justify-center">
          {["Ibrar", "Ahmad", "Ali"].map((user) => (
            <button
              key={user}
              onClick={() => setSelectedUser(user)}
              className={`px-4 py-2 border rounded ${
                selectedUser === user ? "bg-black text-white" : ""
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminBoard;
