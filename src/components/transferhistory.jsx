// src/components/transferhistory.jsx
import { useEffect, useState } from "react";
import "./print-fallback.css";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

function TransferHistory() {
  const [transfers, setTransfers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { user } = useParams(); // e.g., /transfer-history/Ahmad

  // ---- data load & filtering (unchanged logic) ----
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "transfer-history"));
        let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (user && user.toLowerCase() === "admin") {
          data = [];
        } else if (user && user !== "all") {
          data = data.filter(
            (item) => item.receiver === user || item.sender === user
          );
        } else {
          data = data.filter(
            (item) =>
              item.sender?.toLowerCase() === "admin" &&
              item.receiver?.toLowerCase() !== "admin"
          );
        }

        // newest first
        const getTime = (item) => {
          if (item.date && typeof item.date.toDate === "function")
            return item.date.toDate().getTime();
          if (item.createdAt && typeof item.createdAt.toDate === "function")
            return item.createdAt.toDate().getTime();
          return 0;
        };
        data.sort((a, b) => getTime(b) - getTime(a));

        setTransfers(data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };

    fetchTransfers();
  }, [user]);

  // ---- date helpers ----
  const bestDate = (item) => {
    if (item?.date?.toDate) return item.date.toDate();
    if (item?.createdAt?.toDate) return item.createdAt.toDate();
    if (typeof item?.date === "string") {
      const d = new Date(item.date);
      return isNaN(d) ? null : d;
    }
    return null;
  };
  const formatShort = (d) => {
    if (!d) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
    // (kept year hidden, as per earlier screens)
  };

  // ---- pagination ----
  const totalPages = Math.ceil(transfers.length / itemsPerPage);
  const paginatedTransfers = transfers.slice(
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

  // ---- heading ----
  const headingText =
    user && user !== "all"
      ? `${user} Transfer History`
      : "Total Transfer History";

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

              {/* Print */}
              <button
                onClick={() => window.print()}
                title="Print"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30
                           bg-white/20 text-white hover:bg-white/30 transition shadow print:hidden"
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
            </div>

            {transfers.length > 0 ? (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {paginatedTransfers.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/30 bg-white/85 text-gray-800 shadow"
                    >
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs p-3">
                        <span className="font-semibold">Date</span>
                        <span className="text-right">
                          {formatShort(bestDate(item))}
                        </span>

                        <span className="font-semibold">Amount</span>
                        <span className="text-right">
                          PKR {item.amount || 0}
                        </span>

                        <span className="font-semibold">User</span>
                        <span className="text-right">
                          {item.receiver || "—"}
                        </span>

                        <span className="font-semibold">Payment Method</span>
                        <span className="text-right">
                          {item.paymentMethod || "N/A"}
                        </span>

                        <span className="font-semibold">Reason</span>
                        <span className="text-right break-words">
                          {item.remarks || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/Tablet table */}
                <div className="hidden sm:block w-full overflow-x-auto rounded-xl border border-white/30 bg-white/85 text-gray-800 shadow">
                  <table className="min-w-[680px] w-full table-fixed">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="text-left text-sm">
                        <th className="px-3 py-2 w-24">Date</th>
                        <th className="px-3 py-2 w-32">Amount</th>
                        <th className="px-3 py-2 w-32">User</th>
                        <th className="px-3 py-2 w-44">Payment Method</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedTransfers.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2">
                            {formatShort(bestDate(item))}
                          </td>
                          <td className="px-3 py-2">PKR {item.amount || 0}</td>
                          <td className="px-3 py-2">{item.receiver || "—"}</td>
                          <td className="px-3 py-2">
                            {item.paymentMethod || "N/A"}
                          </td>
                          <td className="px-3 py-2 break-words">
                            {item.remarks || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {renderPagination()}
              </>
            ) : (
              <p className="text-center text-white/90 py-10">
                No transfer records found.
              </p>
            )}

            {/* Back button */}
            <div className="text-center mt-4 print:hidden">
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="px-4 py-2 rounded-lg text-white shadow
                           bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition"
              >
                ← Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferHistory;
