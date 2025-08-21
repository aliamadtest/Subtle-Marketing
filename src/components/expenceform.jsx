// src/components/expenceform.jsx
import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import auth from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore";
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
      toast.error(
        "You are not an allowed user. Please login with a valid account."
      );
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
        else if (email === "admin@admin.com") setUserName("Admin");
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
      setIsSubmitting(false);
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

  const NotAllowed = () => (
    <div className="relative z-10 w-full max-w-lg mx-auto px-6">
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] grid place-items-center text-white">
          {/* lock icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M7 10V7a5 5 0 1 1 10 0v3" stroke="white" strokeWidth="2" />
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="2"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>
        <h3 className="text-white text-xl font-semibold mb-1">
          Access Restricted
        </h3>
        <p className="text-white/80">
          You are not an allowed user. Please login with a valid account.
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d2b2c]">
      {/* radial gradient overlay (opacity ≈ 0.41) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(at center center, #99C5F0 20%, #D08EDF 100%)",
        }}
      />

      {/* CONTENT */}
      {auth.currentUser?.email &&
      !allowedEmails.includes(auth.currentUser.email) ? (
        <NotAllowed />
      ) : (
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6">
          {/* Card */}
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)]" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white/95">
                    {userName ? `Welcome ${userName}` : "Expense Entry"}
                  </h2>
                  <p
                    className="mt-1 text-[12px] uppercase tracking-[0.25em] text-white/85"
                    style={{ fontFamily: "'Rajdhani',sans-serif" }}
                  >
                    Add a new expense
                  </p>
                </div>

                {/* My Expenses (H) */}
                {userName && (
                  <button
                    type="button"
                    onClick={handleViewMyExpenses}
                    title="My Expenses"
                    className="shrink-0 h-10 w-10 rounded-full grid place-items-center text-white shadow-lg
                               bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition"
                  >
                    H
                  </button>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
                    {/* calendar icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="2"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 3v4M16 3v4M3 9h18"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-lg bg-white/90 text-gray-900
                               placeholder-gray-500 border border-white/40 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                {/* Title */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
                    {/* note icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                      <path
                        d="M14 4v4h4"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="title"
                    placeholder="Expense Title"
                    required
                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-lg bg-white/90 text-gray-900
                               placeholder-gray-500 border border-white/40 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                {/* Amount */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
                    {/* currency icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3v18M8 7h6a4 4 0 1 1 0 8H6"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    required
                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-lg bg-white/90 text-gray-900
                               placeholder-gray-500 border border-white/40 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                {/* Type */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
                    {/* tag icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                      <circle
                        cx="7.5"
                        cy="7.5"
                        r="1.5"
                        fill="#111827"
                        fillOpacity="0.6"
                      />
                    </svg>
                  </span>
                  <select
                    name="type"
                    required
                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-lg bg-white/90 text-gray-900
                               border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  >
                    <option value="">Select Type</option>
                    <option value="Office">Office</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-4 opacity-70">
                    {/* chat icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 12a8 8 0 1 1-3.56-6.65L21 5l-.65 3.56A7.96 7.96 0 0 1 21 12Z"
                        stroke="#111827"
                        strokeOpacity="0.6"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <textarea
                    name="remarks"
                    placeholder="Enter any comments about this expense..."
                    rows="3"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/90 text-gray-900
                               placeholder-gray-500 border border-white/40 shadow-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-12 sm:h-14 rounded-lg text-white font-semibold shadow-lg
                               bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)]
                               hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Add"}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-12 sm:h-14 rounded-lg text-white font-semibold shadow-lg
                               bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)]
                               hover:opacity-95 transition"
                  >
                    Logout
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseEntryPage;
