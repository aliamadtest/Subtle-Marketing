// src/components/transferhistory.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

function TransferHistory() {
  const [transfers, setTransfers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { user } = useParams(); // e.g., /transfer-history/Ahmad

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "transfer-history"));
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // If user param is 'Admin', show transfers where sender is 'Admin'
        if (user && user.toLowerCase() === "admin") {
          data = data.filter(
            (item) => item.sender && item.sender.toLowerCase() === "admin"
          );
        } else if (user && user !== "all") {
          data = data.filter((item) => item.receiver === user);
        }

        setTransfers(data);
        setCurrentPage(1); // Reset to first page on data change
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };

    fetchTransfers();
  }, [user]);

  // Pagination logic
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
      <div className="bg-white p-1 sm:p-6 rounded shadow-md w-full max-w-full sm:max-w-4xl relative">
        {/* Print Icon Button */}
        <div className="flex items-center justify-center sm:justify-between mb-4 gap-2 relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-blue-800 tracking-tight drop-shadow flex-1">
            {user && user !== "all"
              ? `${user} Transfer History`
              : "Total Transfer History"}
          </h2>
          <button
            onClick={() => window.print()}
            title="Print"
            className="ml-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none bg-white shadow border border-gray-200 flex-shrink-0 print:hidden"
            style={{ lineHeight: 0 }}
          >
            {/* Red printer icon SVG (same as ExpenseHistory) */}
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

        {transfers.length > 0 ? (
          <>
            {/* Mobile: show cards */}
            <div className="block sm:hidden">
              <div className="space-y-3">
                {paginatedTransfers.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-2 bg-gray-50 shadow-sm"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Date:</span>
                      <span>
                        {item.date
                          ? (() => {
                              const d = item.date.toDate();
                              const day = String(d.getDate()).padStart(2, "0");
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              return `${day}-${month}`;
                            })()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Amount:</span>
                      <span>{item.amount}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">User:</span>
                      <span>{item.receiver}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Payment Method:</span>
                      <span>{item.paymentMethod || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">Reason:</span>
                      <span>{item.remarks || "N/A"}</span>
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
                      Amount
                    </th>
                    <th className="border px-2 py-2 whitespace-nowrap">User</th>
                    <th className="border px-2 py-2 whitespace-nowrap">
                      Payment Method
                    </th>
                    <th className="border px-2 py-2 whitespace-nowrap">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransfers.map((item) => (
                    <tr
                      key={item.id}
                      className="text-center hover:bg-gray-100 transition"
                    >
                      <td className="border px-2 py-2 break-words max-w-[120px]">
                        {item.date
                          ? (() => {
                              const d = item.date.toDate();
                              const day = String(d.getDate()).padStart(2, "0");
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              return `${day}-${month}`;
                            })()
                          : "N/A"}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        {item.amount}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        {item.receiver}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[100px]">
                        {item.paymentMethod || "N/A"}
                      </td>
                      <td className="border px-2 py-2 break-words max-w-[140px]">
                        {item.remarks || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="print:hidden">{renderPagination()}</div>
          </>
        ) : (
          <p className="text-center text-gray-600">
            No transfer records found.
          </p>
        )}

        <div className="text-center mt-2 sm:mt-4">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition print:hidden"
          >
            ← Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferHistory;
