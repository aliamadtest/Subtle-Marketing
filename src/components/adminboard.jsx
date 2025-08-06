import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import auth from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore";

function AdminBoard() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showExpensePopup, setShowExpensePopup] = useState(false); // 🔁 NEW

  const [totals, setTotals] = useState({
    total: 0,
    Ibrar: 0,
    Ahmad: 0,
    Ali: 0,
  });

  const [userExpenses, setUserExpenses] = useState({
    office: 0,
    personal: 0,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const snapshot = await getDocs(collection(db, "transfer-history"));
        const data = snapshot.docs.map((doc) => doc.data());
        const computedTotals = { total: 0, Ibrar: 0, Ahmad: 0, Ali: 0 };

        data.forEach((t) => {
          const amt = Number(t.amount || 0);
          computedTotals.total += amt;
          if (computedTotals[t.receiver] !== undefined) {
            computedTotals[t.receiver] += amt;
          }
        });

        setTotals(computedTotals);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchUserExpenses = async () => {
      if (!selectedUser) return;

      try {
        const snapshot = await getDocs(collection(db, "expenses"));
        const data = snapshot.docs.map((doc) => doc.data());

        const userData = data.filter((item) => item.name === selectedUser);

        let office = 0;
        let personal = 0;

        userData.forEach((item) => {
          const amt = Number(item.amount || 0);
          if (item.type?.toLowerCase() === "office") {
            office += amt;
          } else if (item.type?.toLowerCase() === "personal") {
            personal += amt;
          }
        });

        setUserExpenses({ office, personal });
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      }
    };

    fetchUserExpenses();
  }, [selectedUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleViewHistory = () => {
    if (selectedUser) {
      navigate(`/transfer-history/${selectedUser}`);
    } else {
      alert("Please select a user first");
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const receiver = e.target.receiver.value;
    const amount = e.target.amount.value;
    const paymentMethod = e.target.paymentMethod.value;
    const remarks = e.target.remarks.value;
    try {
      await addDoc(collection(db, "transfer-history"), {
        sender: "Admin",
        receiver,
        paymentMethod,
        remarks,
        amount: parseFloat(amount),
        date: Timestamp.now(),
      });

      toast.success("Transfer successful!");
      setShowPopup(false);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Transfer failed!");
    }
  };

  const handleAdminExpenseSubmit = async (e) => {
    e.preventDefault();
    const type = e.target.type.value;
    const amount = e.target.amount.value;
    const remarks = e.target.remarks.value;

    try {
      await addDoc(collection(db, "expenses"), {
        name: "Admin",
        type,
        amount: parseFloat(amount),
        remarks,
        date: Timestamp.now(),
      });

      toast.success("Expense added!");

      setShowExpensePopup(false);
      e.target.reset();
    } catch (err) {
      console.error("Failed to save admin expense:", err);
      toast.error("Failed to save.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h2 className="bg-gray-300 text-gray-800 px-3 py-2 rounded shadow-lg text-center font-bold">
          Admin Dashboard
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-lg mt-5 mb-5">
          <h2 className="bg-gray-300 text-gray-800 px-3 py-2 rounded shadow-md text-center mb-6 font-bold">
            Analytics
          </h2>

          <div className="flex space-x-6 justify-center">
            <div className="bg-[#F3F4F6] p-6 rounded-xl shadow-lg w-full max-w-xs">
              <h2 className="text-1xl font-bold text-center mb-4">
                Total Cash
              </h2>
              <div className="text-1xl mt-8">
                <p>Total: ₨ {totals.total}</p>
                <p>Ibrar: ₨ {totals.Ibrar}</p>
                <p>Ahmad: ₨ {totals.Ahmad}</p>
                <p>Ali: ₨ {totals.Ali}</p>
              </div>
            </div>

            <div className="bg-[#F3F4F6] p-6 rounded-xl shadow-lg w-full max-w-xs">
              <h2 className="text-1xl font-bold text-center mb-4">
                User Record
              </h2>

              <div className="mb-4">
                <label className="block text-1xl mb-2">Select User</label>
                <select
                  className="w-full p-2 border rounded-md text-gray-700"
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select a User</option>
                  <option value="Ibrar">Ibrar</option>
                  <option value="Ahmad">Ahmad</option>
                  <option value="Ali">Ali</option>
                </select>
              </div>

              <div className="text-left text-1xl">
                <p>Office: ₨ {userExpenses.office}</p>
                <p>Personal: ₨ {userExpenses.personal}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 justify-center mb-6">
          <button
            onClick={() => {
              setShowPopup(true);
              setShowExpensePopup(false); // 👈 Close expense popup
            }}
            className="bg-[#95979b] text-white px-6 py-2 rounded-lg hover:bg-[#4e4f53]"
          >
            Transfer
          </button>

          <button
            onClick={() => {
              setShowExpensePopup(true);
              setShowPopup(false); // 👈 Close transfer popup
            }}
            className="bg-[#95979b] text-white px-6 py-2 rounded-lg hover:bg-[#4e4f53]"
          >
            Admin Expense
          </button>

          <button
            onClick={handleViewHistory}
            className="bg-[#95979b] text-white px-6 py-2 rounded-lg hover:bg-[#4e4f53]"
          >
            T.History
          </button>

          <button
            onClick={() => {
              if (selectedUser) {
                navigate(`/expense-history/${selectedUser}`);
              } else {
                alert("Please select a user first");
              }
            }}
            className="bg-[#95979b] text-white px-6 py-2 rounded-lg hover:bg-[#4e4f53]"
          >
            E.History
          </button>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          {["Ibrar", "Ahmad", "Ali"].map((user) => (
            <button
              key={user}
              onClick={() => setSelectedUser(user)}
              className={`px-4 py-2 border rounded-md text-sm ${
                selectedUser === user
                  ? "bg-black text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {user}
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-[#4e4f53] text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Transfer Form Popup */}
      {showPopup && (
        <div className="absolute top-18 right-0 z-50">
          <div className="bg-white border shadow-xl rounded-xl w-80 p-5 relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-3 text-xl text-gray-400 hover:text-red-500 font-bold"
            >
              ×
            </button>

            <h2 className="text-lg font-semibold text-center mb-4">
              Transfer Amount
            </h2>

            <form onSubmit={handleTransferSubmit}>
              <select
                name="receiver"
                required
                className="w-full p-2 mb-4 border rounded-md"
              >
                <option value="">Select User</option>
                <option value="Ibrar">Ibrar</option>
                <option value="Ahmad">Ahmad</option>
                <option value="Ali">Ali</option>
              </select>

              <select
                name="paymentMethod"
                required
                className="w-full p-2 mb-4 border rounded-md"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
              </select>

              <input
                type="number"
                name="amount"
                placeholder="Enter Amount"
                required
                className="w-full p-2 mb-4 border rounded-md"
              />

              <input
                type="text"
                value={new Date().toISOString().split("T")[0]}
                readOnly
                className="w-full mb-4 p-2 border rounded-md bg-gray-100 text-gray-700"
              />

              <textarea
                name="remarks"
                placeholder="Enter Reason for Payment"
                className="w-full p-2 mb-4 border rounded-md"
                rows="3"
              ></textarea>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Send Cash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Expense Form Popup */}
      {showExpensePopup && (
        <div className="absolute top-10 left-1 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-90  relative">
            <button
              onClick={() => setShowExpensePopup(false)}
              className="absolute top-2 right-3 text-xl text-gray-400 hover:text-red-500 font-bold"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              Admin Expense Entry
            </h2>

            <form onSubmit={handleAdminExpenseSubmit}>
              {/* Name field (auto-filled) */}
              <label className="block mb-1 text-gray-600">Name</label>
              <input
                type="text"
                name="name"
                value="Admin"
                disabled
                className="w-full mb-4 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700"
              />

              <label className="block mb-1 text-gray-600">Date</label>
              <input
                type="text"
                value={new Date().toISOString().split("T")[0]}
                readOnly
                className="w-full mb-4 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700"
              />

              <label className="block mb-1 text-gray-600">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Expense Title"
                required
                className="w-full mb-4 px-4 py-2 border rounded-lg"
              />

              <label className="block mb-1 text-gray-600">Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter Amount"
                required
                className="w-full mb-4 px-4 py-2 border rounded-lg"
              />

              <label className="block mb-1 text-gray-600">Expense Type</label>
              <select
                name="type"
                required
                className="w-full mb-4 px-4 py-2 border rounded-lg"
              >
                <option value="">Select Type</option>
                <option value="Office">Office</option>
                <option value="Personal">Personal</option>
              </select>

              <label className="block mb-1 text-gray-600">
                Remarks (optional)
              </label>
              <textarea
                name="remarks"
                placeholder="Enter any comments about this expense..."
                rows="3"
                className="w-full mb-4 px-4 py-2 border rounded-lg resize-none"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBoard;
