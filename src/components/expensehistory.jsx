import { useParams, useNavigate } from "react-router-dom";
import auth from "../firebase/auth";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";

function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { user } = useParams();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "expenses"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // If user param is 'admin', show only admin expenses
        // If user param is 'all' or undefined, show all expenses (admin + user)
        // If user param is a username, show only that user's expenses
        let filtered;
        if (user && user.toLowerCase() === "admin") {
          filtered = data.filter((item) => item.role === "admin");
        } else if (user && user && user !== "all") {
          filtered = data.filter(
            (item) =>
              item.role === "user" &&
              item.name?.toLowerCase() === user.toLowerCase()
          );
        } else {
          filtered = data; // Show all expenses (admin + user)
        }

        setExpenses(filtered);
        setCurrentPage(1); // Reset to first page on data change
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      }
    };

    fetchExpenses();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let d;
    if (timestamp.toDate) {
      d = timestamp.toDate();
    } else if (typeof timestamp === "string") {
      // Try to parse string date (e.g. 2025-08-07 or 2025-08-07T12:00:00Z)
      d = new Date(timestamp);
      if (isNaN(d)) return timestamp;
    } else if (timestamp instanceof Date) {
      d = timestamp;
    } else {
      return timestamp;
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };

  // Pagination logic
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push("...");
      }
    }
    let last;
    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pages.map((p, idx) => {
          if (p === "...") {
            if (last === "...") return null;
            last = "...";
            return (
              <span key={idx} className="px-2">
                ...
              </span>
            );
          }
          last = p;
          return (
            <button
              key={p}
              className={`px-3 py-1 border rounded ${
                currentPage === p ? "bg-gray-100 font-bold" : ""
              }`}
              onClick={() => setCurrentPage(p)}
              disabled={currentPage === p}
            >
              {p}
            </button>
          );
        })}
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-1 sm:px-4">
      <div className="bg-white p-1 sm:p-6 rounded shadow-md w-full max-w-full sm:max-w-5xl relative">
        {/* Print Icon Button */}
        <div className="flex items-center justify-center sm:justify-between mb-4 gap-2 relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-blue-800 tracking-tight drop-shadow flex-1">
            {user && user.toLowerCase() === "admin"
              ? "Admin Expense History"
              : user && user !== "all"
              ? `${user} Expense History`
              : "Total Expense History"}
          </h2>
          <button
            onClick={() => window.print()}
            title="Print"
            className="ml-2 p-2 sm:p-2.5 rounded-full hover:bg-gray-200 focus:outline-none bg-white shadow border border-gray-200 flex-shrink-0"
            style={{ lineHeight: 0 }}
          >
            {/* Red printer icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 48 48"
              fill="red"
            >
              <rect x="10" y="4" width="28" height="10" rx="2" />
              <rect x="8" y="14" width="32" height="18" rx="3" />
              <rect x="14" y="34" width="20" height="8" rx="1.5" />
              <rect x="18" y="20" width="12" height="2.5" rx="1" fill="#fff" />
              <rect x="18" y="25" width="12" height="2.5" rx="1" fill="#fff" />
              <circle cx="38" cy="23" r="2.2" fill="#fff" />
            </svg>
          </button>
        </div>

        {expenses.length > 0 ? (
          <>
            {/* Mobile: show cards */}
            <div className="block sm:hidden">
              <div className="space-y-3">
                {paginatedExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="border rounded-lg p-2 bg-gray-50 shadow-sm"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Date:</span>
                      <span>{formatDate(exp.date)}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Title:</span>
                      <span>{exp.title || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Amount:</span>
                      <span>PKR {exp.amount || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Type:</span>
                      <span>{exp.type || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Remarks:</span>
                      <span>{exp.remarks || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">Name:</span>
                      <span>
                        {exp.email && exp.email === "ahmad@ahmad.com"
                          ? "Ahmad"
                          : exp.email && exp.email === "ibrar@ibrar.com"
                          ? "Ibrar"
                          : exp.email && exp.email === "admin@admin.com"
                          ? "Admin"
                          : exp.name || "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop/tablet: show table */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <table className="min-w-[500px] w-full table-auto border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-2 whitespace-nowrap">Date</th>
                    <th className="border px-2 py-2 whitespace-nowrap">
                      Title
                    </th>
                    <th className="border px-2 py-2 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="border px-2 py-2 whitespace-nowrap">Type</th>
                    <th className="border px-2 py-2 whitespace-nowrap">
                      Remarks
                    </th>
                    <th className="border px-2 py-2 whitespace-nowrap">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="text-center hover:bg-gray-100 transition"
                    >
                      <td className="border px-2 py-2 break-words max-w-[120px]">
                        {formatDate(exp.date)}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[120px]">
                        {exp.title || "N/A"}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        PKR {exp.amount || 0}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        {exp.type || "N/A"}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[140px]">
                        {exp.remarks || "N/A"}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        {exp.email === "ahmad@ahmad.com"
                          ? "Ahmad"
                          : exp.email === "ibrar@ibrar.com"
                          ? "Ibrar"
                          : exp.email === "admin@admin.com"
                          ? "Admin"
                          : exp.name || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        ) : (
          <p className="text-center text-gray-600">No expenses found.</p>
        )}

        {/* Show Back to Admin Panel button only for admin */}
        {auth.currentUser?.email === "admin@admin.com" && (
          <div className="text-center mt-2 sm:mt-4">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition print:hidden"
            >
              ← Admin Panel
            </button>
          </div>
        )}

        {/* Always show Back to Expense Entry button for users (not admin) */}
        {auth.currentUser?.email !== "admin@admin.com" && (
          <div className="text-center mt-2 sm:mt-4">
            <button
              onClick={() => navigate("/expense-entry")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition print:hidden"
            >
              ← Back to Expense Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseHistory;
