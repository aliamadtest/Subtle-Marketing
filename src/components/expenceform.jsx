// src/components/expenceform.jsx
import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import auth from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore"; // make sure this path is correct
import { toast } from "react-toastify";

function ExpenseEntryPage() {
  // Allowed emails
  const allowedEmails = [
    "admin@admin.com",
    "ahmad@ahmad.com",
    "ibrar@ibrar.com",
  ];
  // Track current email for toast
  const [currentEmail, setCurrentEmail] = useState("");
  // Set currentEmail on auth state change
  useEffect(() => {
    let unsubscribe;
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentEmail(user?.email || "");
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Show toast if wrong user, only once per session
  const [toastShown, setToastShown] = useState(false);
  useEffect(() => {
    if (currentEmail && !allowedEmails.includes(currentEmail) && !toastShown) {
      ("You are not an allowed user. Please login with a valid account.");
      setToastShown(true);
    }
    if (allowedEmails.includes(currentEmail)) {
      setToastShown(false);
    }
  }, [currentEmail, allowedEmails, toastShown]);
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Set userName on mount and when auth state changes (handles refresh)
  useEffect(() => {
    let unsubscribe;
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        const email = user?.email || "";
        if (email === "ahmad@ahmad.com") setUserName("Ahmad");
        else if (email === "ibrar@ibrar.com") setUserName("Ibrar");
        else setUserName("");
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleViewMyExpenses = () => {
    if (!userName) return;
    navigate(`/expense-history/${userName}`, {
      state: { fromExpenseEntry: true },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const date = e.target.date.value;
    const title = e.target.title.value;
    const amount = e.target.amount.value;
    const type = e.target.type.value;
    const remarks = e.target.remarks.value;

    // Get current user info
    const currentUserEmail = auth.currentUser?.email || "";
    if (!currentUserEmail) {
      toast.error("User not logged in. Please login first.");
      return;
    }
    let name = "";
    let role = "user";
    if (currentUserEmail === "ahmad@ahmad.com") {
      name = "Ahmad";
    } else if (currentUserEmail === "ibrar@ibrar.com") {
      name = "Ibrar";
    } else if (currentUserEmail === "admin@admin.com") {
      name = "Admin";
      role = "admin";
    } else {
      name = currentUserEmail.split("@")[0];
    }
    try {
      await addDoc(collection(db, "expenses"), {
        date,
        title,
        amount: parseFloat(amount),
        remarks,
        type,
        role,
        createdAt: Timestamp.now(),
        name,
        email: currentUserEmail,
      });
      e.target.reset();
      toast.success("Expense saved successfully!");
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error("Failed to save expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Block form if not allowed user */}
      {auth.currentUser?.email &&
      !allowedEmails.includes(auth.currentUser.email) ? (
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-center text-red-600 font-bold">
          You are not an allowed user. Please login with a valid account.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-6 gap-2">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              {userName ? `Welcome ${userName}` : "Expense Entry"}
            </h2>
            {/* Small 'H' button for My Expenses */}
            {userName && (
              <button
                type="button"
                onClick={handleViewMyExpenses}
                title="My Expenses"
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white font-bold text-lg hover:bg-green-700 focus:outline-none shadow"
                style={{ minWidth: 32, minHeight: 32 }}
              >
                H
              </button>
            )}
          </div>
          {/* Name field removed for user expense form */}

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
          <label className="block mb-1 text-gray-600">Remarks (optional)</label>
          <textarea
            name="remarks"
            placeholder="Enter any comments about this expense..."
            rows="3"
            className="w-full mb-4 px-4 py-2 border rounded-lg resize-none"
          />
          {/* Image upload field hidden */}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mb-4 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Logout
          </button>
        </form>
      )}
    </div>
  );
}

export default ExpenseEntryPage;
