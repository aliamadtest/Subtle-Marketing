import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import auth from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore";

function AdminBoard() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showExpensePopup, setShowExpensePopup] = useState(false); // 🔁 NEW

  const [totals, setTotals] = useState({
    total: 0,
    Ibrar: 0,
    Ahmad: 0,
  });

  const [userExpenses, setUserExpenses] = useState({
    office: 0,
    personal: 0,
  });

  // Get current user email from Firebase Auth
  const currentUserEmail = auth.currentUser?.email || "";

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
      if (!selectedUser) {
        setUserExpenses({ office: 0, personal: 0 });
        return;
      }
      try {
        const snapshot = await getDocs(collection(db, "expenses"));
        const data = snapshot.docs.map((doc) => doc.data());

        // Make sure to match both user and admin correctly
        const userData = data.filter((item) => {
          // For Admin, match name === "Admin" and role === "admin"
          if (selectedUser === "Admin") {
            return (
              item.name?.trim().toLowerCase() === "admin" &&
              item.role === "admin"
            );
          }
          // For other users, match name case-insensitively and trim spaces
          return (
            item.name?.trim().toLowerCase() ===
            selectedUser.trim().toLowerCase()
          );
        });

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
        setUserExpenses({ office: 0, personal: 0 });
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
    navigate("/transfer-history/all");
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

      // Update totals state immediately (add to total and receiver, like fetchTransactions)
      setTotals((prev) => {
        let newTotals = { ...prev };
        const amt = parseFloat(amount);
        newTotals.total = (prev.total || 0) + amt;
        if (receiver === "Ibrar" || receiver === "Ahmad") {
          newTotals[receiver] = (prev[receiver] || 0) + amt;
        }
        return newTotals;
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

    const title = e.target.title.value;
    const type = e.target.type.value;
    const amount = e.target.amount.value;
    const remarks = e.target.remarks.value;

    // Determine who is submitting (admin, Ahmad, Ibrar)
    let name = "Admin";
    let email = currentUserEmail;
    let role = "admin";
    if (currentUserEmail === "ahmad@ahmad.com") {
      name = "Ahmad";
      role = "user";
    } else if (currentUserEmail === "ibrar@ibrar.com") {
      name = "Ibrar";
      role = "user";
    }

    try {
      await addDoc(collection(db, "expenses"), {
        name,
        email,
        title,
        type,
        remarks,
        amount: parseFloat(amount),
        date: new Date().toISOString().split("T")[0],
        createdAt: Timestamp.now(),
        role, // Mark as admin or user expense
      });

      toast.success("Expense added!");
      e.target.reset();
      setShowExpensePopup(false);
    } catch (err) {
      console.error("Error saving admin expense:", err);
      toast.error("Failed to save expense.");
    }
  };

  return (
    <div className="min-h-screen bg-white p-2 sm:p-4 md:p-6 lg:p-8 relative">
      <div className="bg-white p-2 sm:p-4 md:p-6 rounded-xl shadow-lg max-w-full sm:max-w-2xl mx-auto">
        <h2 className="bg-blue-100 text-blue-900 px-2 sm:px-3 py-2 rounded-md shadow-lg text-center font-bold text-lg sm:text-xl">
          <div className="flex items-center justify-between">
            <span>Admin Dashboard</span>
            <div className="sm:hidden relative flex items-center">
              <button
                className="ml-2 p-2 rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150 w-10 h-10 flex items-center justify-center"
                aria-label="Menu"
                onClick={() => setShowMobileMenu((prev) => !prev)}
                tabIndex={0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-700"
                >
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              {showMobileMenu && (
                <div
                  className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border flex flex-col gap-2 py-2 px-3 z-50 min-w-[180px] w-max animate-fade-in"
                  style={{ minWidth: "180px", maxWidth: "90vw" }}
                >
                  <button
                    onClick={() => {
                      setShowPopup(true);
                      setShowExpensePopup(false);
                      setShowMobileMenu(false);
                    }}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 w-full text-left transition-all duration-150"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => {
                      setShowExpensePopup(true);
                      setShowPopup(false);
                      setShowMobileMenu(false);
                    }}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 w-full text-left transition-all duration-150"
                  >
                    Admin Expense
                  </button>
                  <button
                    onClick={() => {
                      handleViewHistory();
                      setShowMobileMenu(false);
                    }}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 w-full text-left transition-all duration-150"
                  >
                    T.History
                  </button>
                  <button
                    onClick={() => {
                      if (selectedUser) {
                        if (selectedUser === "Admin") {
                          navigate(`/expense-history/Admin`);
                        } else {
                          navigate(`/expense-history/${selectedUser}`);
                        }
                      } else {
                        navigate(`/expense-history/all`);
                      }
                      setShowMobileMenu(false);
                    }}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 w-full text-left transition-all duration-150"
                  >
                    E.History
                  </button>
                </div>
              )}
            </div>
          </div>
        </h2>

        <div className="bg-white p-2 sm:p-4 md:p-6 rounded-xl shadow-lg mt-3 sm:mt-5 mb-3 sm:mb-5">
          <h2 className="bg-blue-100 text-blue-900 px-2 sm:px-3 py-2 rounded-md shadow-md text-center mb-4 sm:mb-6 font-bold text-base sm:text-lg">
            Analytics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 justify-center">
            <div className="bg-[#F3F4F6] p-3 sm:p-6 rounded-xl shadow-lg w-full">
              <h2 className="text-base sm:text-1xl font-bold text-center mb-2 sm:mb-4">
                Total Cash
              </h2>
              <div className="text-base sm:text-1xl mt-4 sm:mt-8">
                <div className="flex flex-col gap-2">
                  <div className="bg-blue-50 px-4 py-2 rounded-md shadow-sm flex items-center justify-between">
                    <span className="font-semibold text-blue-900">Total:</span>
                    <span className="text-blue-900 text-lg font-bold tracking-wide">
                      ₨ {totals.total}
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center justify-between border border-blue-100">
                    <span className="font-medium text-gray-800">Ibrar:</span>
                    <span className="text-blue-700 text-base font-semibold tracking-wide">
                      ₨ {totals.Ibrar}
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center justify-between border border-blue-100">
                    <span className="font-medium text-gray-800">Ahmad:</span>
                    <span className="text-blue-700 text-base font-semibold tracking-wide">
                      ₨ {totals.Ahmad}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F3F4F6] p-3 sm:p-6 rounded-xl shadow-lg w-full">
              <h2 className="text-base sm:text-1xl font-bold text-center mb-2 sm:mb-4">
                User Record
              </h2>

              <div className="mb-2 sm:mb-4">
                <label className="block text-base sm:text-lg font-semibold text-blue-900 mb-2">
                  Select User
                </label>
                <div className="rounded-lg shadow-sm bg-white">
                  <select
                    className="w-full p-3 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150 bg-white"
                    value={selectedUser || ""}
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                    }}
                  >
                    <option value="">Select a User</option>
                    <option value="Ibrar">Ibrar</option>
                    <option value="Ahmad">Ahmad</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="text-left text-base sm:text-1xl">
                <div className="flex flex-col gap-2 mt-2">
                  <div className="bg-blue-50 px-4 py-2 rounded-md shadow-sm flex items-center justify-between">
                    <span className="font-medium text-blue-900">Office:</span>
                    <span className="text-blue-900">
                      ₨ {userExpenses.office}
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-md shadow-sm flex items-center justify-between border border-blue-100">
                    <span className="font-medium text-gray-800">Personal:</span>
                    <span className="text-gray-800">
                      ₨ {userExpenses.personal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center mb-4 sm:mb-6">
          {/* Desktop/tablet: show buttons inline */}
          <div className="hidden sm:flex flex-row gap-3 sm:gap-6 justify-center w-full">
            <button
              onClick={() => {
                setShowPopup(true);
                setShowExpensePopup(false);
              }}
              className="bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto transition-all duration-150"
            >
              Transfer
            </button>
            <button
              onClick={() => {
                setShowExpensePopup(true);
                setShowPopup(false);
              }}
              className="bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto transition-all duration-150"
            >
              Admin Expense
            </button>
            <button
              onClick={() => {
                if (selectedUser === "Admin") {
                  navigate(`/transfer-history/Admin`);
                } else if (selectedUser && selectedUser !== "") {
                  navigate(`/transfer-history/${selectedUser}`);
                } else {
                  navigate(`/transfer-history/all`);
                }
              }}
              className="bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto transition-all duration-150"
            >
              T.History
            </button>
            <button
              onClick={() => {
                if (selectedUser && selectedUser !== "") {
                  if (selectedUser === "Admin") {
                    navigate(`/expense-history/Admin`);
                  } else {
                    navigate(`/expense-history/${selectedUser}`);
                  }
                } else {
                  navigate(`/expense-history/all`);
                }
              }}
              className="bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto transition-all duration-150"
            >
              E.History
            </button>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Transfer Form Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-white border shadow-xl rounded-xl w-full max-w-xs p-4 sm:p-5 relative mx-2">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-3 text-xl text-gray-400 hover:text-red-500 font-bold"
            >
              ×
            </button>

            <h2 className="text-lg font-semibold text-center mb-4">
              {(() => {
                if (currentUserEmail === "ahmad@ahmad.com")
                  return "Welcome Ahmad";
                if (currentUserEmail === "ibrar@ibrar.com")
                  return "Welcome Ibrar";
                return "Transfer Amount";
              })()}
            </h2>

            <form onSubmit={handleTransferSubmit}>
              {/* Name field removed for user expense form */}
              <select
                name="receiver"
                required
                className="w-full p-2 mb-4 border rounded-md"
              >
                <option value="">Select User</option>
                <option value="Ibrar">Ibrar</option>
                <option value="Ahmad">Ahmad</option>
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
                type="date"
                name="date"
                defaultValue={new Date().toISOString().split("T")[0]}
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
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Expense Form Popup */}
      {showExpensePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-xs relative mx-2">
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
              <label className="block mb-1 text-gray-600">Date</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full mb-4 px-4 py-2 border rounded-lg"
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
