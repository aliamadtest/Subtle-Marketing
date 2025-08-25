// src/components/ExpenseHistory.jsx
import { useParams, useNavigate } from "react-router-dom";
import auth from "../firebase/auth";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";
import "./print-fallback.css";
import * as XLSX from "xlsx"; // <-- .xlsx export

function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { user } = useParams();

  // --- fetch & filter ---
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "expenses"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let filtered;
        if (user && user.toLowerCase() === "admin") {
          filtered = data.filter((item) => item.role === "admin");
        } else if (user && user !== "all") {
          filtered = data.filter(
            (item) =>
              item.role === "user" &&
              item.name?.toLowerCase() === user.toLowerCase()
          );
        } else {
          filtered = data; // all
        }

        filtered.sort((a, b) => {
          const aTime =
            a.createdAt && a.createdAt.toDate
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt || a.date || 0).getTime();
          const bTime =
            b.createdAt && b.createdAt.toDate
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt || b.date || 0).getTime();
          return bTime - aTime;
        });

        setExpenses(filtered);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      }
    };

    fetchExpenses();
  }, [user]);

  // --- helpers ---
  const toDateObj = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (typeof timestamp === "string") {
      const d = new Date(timestamp);
      return isNaN(d) ? null : d;
    }
    if (timestamp instanceof Date) return timestamp;
    return null;
  };

  const formatDate = (timestamp) => {
    const d = toDateObj(timestamp);
    if (!d) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };

  const formatFullDate = (timestamp) => {
    const d = toDateObj(timestamp);
    if (!d) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const displayNameFor = (exp) => {
    if (exp.email === "ahmad@ahmad.com") return "Ahmad";
    if (exp.email === "ibrar@ibrar.com") return "Ibrar";
    if (exp.email === "admin@admin.com") return "Admin";
    return exp.name || "N/A";
  };

  // --- pagination ---
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
      <div className="flex items-center justify-center gap-1 mt-5 print:hidden">
        <button
          className="px-3 py-1.5 rounded-lg border bg-white/70 hover:bg-white transition disabled:opacity-50"
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
              <span key={`dots-${idx}`} className="px-2">
                …
              </span>
            );
          }
          last = p;
          const active = currentPage === p;
          return (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              disabled={active}
              className={`px-3 py-1.5 rounded-lg border transition ${
                active
                  ? "text-white bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] cursor-default"
                  : "bg-white/70 hover:bg-white"
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          className="px-3 py-1.5 rounded-lg border bg-white/70 hover:bg-white transition disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  // --- heading text ---
  const headingText =
    user && user.toLowerCase() === "admin"
      ? "Admin Expense History"
      : user && user !== "all"
      ? `${user} Expense History`
      : "Total Expense History";

  // --- .xlsx export ---
  const handleExport = () => {
    const headers = [
      "Date",
      "Title",
      "Amount (PKR)",
      "Type",
      "Remarks",
      "Name",
    ];

    const rows = expenses.map((exp) => [
      formatFullDate(exp.date || exp.createdAt),
      exp.title || "N/A",
      Number(exp.amount ?? 0),
      exp.type || "N/A",
      exp.remarks || "N/A",
      displayNameFor(exp),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Optional widths for readability
    ws["!cols"] = [
      { wch: 12 }, // Date
      { wch: 30 }, // Title
      { wch: 14 }, // Amount
      { wch: 12 }, // Type
      { wch: 40 }, // Remarks
      { wch: 14 }, // Name
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const safe = headingText.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
    const t = new Date();
    const ymd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(t.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(wb, `${safe}_${ymd}.xlsx`);
  };

  // --- render ---
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d2b2c] px-3 sm:px-6">
      {/* radial brand overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(at center center, #99C5F0 20%, #D08EDF 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5 w-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)]" />

          <div className="p-4 sm:p-6">
            {/* Header row */}
            <div className="flex items-center justify-center sm:justify-between gap-3 mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white/95 text-center tracking-tight drop-shadow">
                {headingText}
              </h2>

              {/* Actions (Desktop/Tablet) */}
              <div className="hidden sm:flex items-center gap-2 print:hidden">
                {/* Print */}
                <button
                  onClick={() => window.print()}
                  title="Print"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30
                             bg-white/20 text-white hover:bg-white/30 transition shadow"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    fill="currentColor"
                  >
                    <rect x="10" y="4" width="28" height="10" rx="2" />
                    <rect x="8" y="14" width="32" height="18" rx="3" />
                    <rect x="14" y="34" width="20" height="8" rx="1.5" />
                  </svg>
                  <span className="text-sm font-semibold">Print</span>
                </button>

                {/* Excel Export */}
                <button
                  onClick={handleExport}
                  title="Export to Excel"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30
                             bg-white/20 text-white hover:bg-white/30 transition shadow"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    fill="currentColor"
                  >
                    <rect x="6" y="8" width="36" height="28" rx="4" />
                    <path
                      d="M16 20h16M16 26h10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                  <span className="text-sm font-semibold">Export to Excel</span>
                </button>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="flex sm:hidden justify-end gap-2 mb-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30
                           bg-white/20 text-white hover:bg-white/30 transition shadow"
              >
                <span className="text-sm font-semibold">Print</span>
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30
                           bg-white/20 text-white hover:bg-white/30 transition shadow"
              >
                <span className="text-sm font-semibold">Export to Excel</span>
              </button>
            </div>

            {/* When data exists */}
            {expenses.length > 0 ? (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-3">
                  {paginatedExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-white/30 bg-white/85 text-gray-800 shadow"
                    >
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs p-3">
                        <span className="font-semibold">Date</span>
                        <span className="text-right">
                          {formatDate(exp.date)}
                        </span>

                        <span className="font-semibold">Title</span>
                        <span className="text-right break-words">
                          {exp.title || "N/A"}
                        </span>

                        <span className="font-semibold">Amount</span>
                        <span className="text-right">
                          PKR {exp.amount || 0}
                        </span>

                        <span className="font-semibold">Type</span>
                        <span className="text-right">{exp.type || "N/A"}</span>

                        <span className="font-semibold">Remarks</span>
                        <span className="text-right break-words">
                          {exp.remarks || "N/A"}
                        </span>

                        <span className="font-semibold">Name</span>
                        <span className="text-right">
                          {displayNameFor(exp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/Tablet: table */}
                <div className="hidden sm:block w-full overflow-x-auto rounded-xl border border-white/30 bg-white/85 text-gray-800 shadow">
                  <table className="min-w-[680px] w-full table-fixed">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="text-left text-sm">
                        <th className="px-3 py-2 w-24">Date</th>
                        <th className="px-3 py-2 w-64">Title</th>
                        <th className="px-3 py-2 w-32">Amount</th>
                        <th className="px-3 py-2 w-28">Type</th>
                        <th className="px-3 py-2">Remarks</th>
                        <th className="px-3 py-2 w-28">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedExpenses.map((exp) => (
                        <tr
                          key={exp.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2">{formatDate(exp.date)}</td>
                          <td className="px-3 py-2 break-words">
                            {exp.title || "N/A"}
                          </td>
                          <td className="px-3 py-2">PKR {exp.amount || 0}</td>
                          <td className="px-3 py-2">{exp.type || "N/A"}</td>
                          <td className="px-3 py-2 break-words">
                            {exp.remarks || "N/A"}
                          </td>
                          <td className="px-3 py-2">{displayNameFor(exp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {renderPagination()}
              </>
            ) : (
              <p className="text-center text-white/90 py-10">
                No expenses found.
              </p>
            )}

            {/* Navigation buttons (not printed) */}
            <div className="text-center mt-4 print:hidden">
              {auth.currentUser?.email === "admin@admin.com" ? (
                <button
                  onClick={() => navigate("/admin-dashboard")}
                  className="mx-1 px-4 py-2 rounded-lg text-white shadow
                             bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition"
                >
                  ← Admin Panel
                </button>
              ) : (
                <button
                  onClick={() => navigate("/expense-entry")}
                  className="mx-1 px-4 py-2 rounded-lg text-white shadow
                             bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition"
                >
                  ← Back to Expense Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseHistory;
