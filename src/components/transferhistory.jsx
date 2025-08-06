// src/components/transferhistory.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

function TransferHistory() {
  const [transfers, setTransfers] = useState([]);
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

        // Filter if specific user is passed
        if (user) {
          data = data.filter((item) => item.receiver === user);
        }

        setTransfers(data);
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };

    fetchTransfers();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {user ? `${user}'s Transfer History` : "All Transfer History"}
        </h2>

        {transfers.length > 0 ? (
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">User</th>
                <th className="border px-4 py-2">Payment Method</th>
                <th className="border px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((item) => (
                <tr key={item.id}>
                  <td className="border px-4 py-2">
                    {item.date?.toDate().toISOString().split("T")[0] || "N/A"}
                  </td>
                  <td className="border px-4 py-2">₨ {item.amount}</td>
                  <td className="border px-4 py-2">{item.receiver}</td>
                  <td className="border px-4 py-2">
                    {item.paymentMethod || "N/A"}
                  </td>
                  <td className="border px-4 py-2">{item.remarks || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-600">
            No transfer records found.
          </p>
        )}

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="text-blue-600 underline"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferHistory;
