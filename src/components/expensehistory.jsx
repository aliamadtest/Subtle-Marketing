import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase/firestore";

function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
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

        // Show only admin expenses if user is 'Admin', else show only user expenses
        let filtered;
        if (user && user.toLowerCase() === "admin") {
          filtered = data.filter(
            (item) =>
              item.role === "admin" && item.name?.toLowerCase() === "admin"
          );
        } else if (user) {
          filtered = data.filter(
            (item) =>
              item.role === "user" &&
              item.name?.toLowerCase() === user.toLowerCase()
          );
        } else {
          filtered = data.filter((item) => item.role === "user");
        }

        setExpenses(filtered);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      }
    };

    fetchExpenses();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return timestamp.toDate
      ? timestamp.toDate().toLocaleDateString()
      : timestamp;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-5xl overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {user ? `${user}'s` : "All"} Expense History
        </h2>

        {expenses.length > 0 ? (
          <table className="w-full table-auto border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Title</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Remarks</th>
                <th className="border px-4 py-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="text-center">
                  <td className="border px-4 py-2">{formatDate(exp.date)}</td>
                  <td className="border px-4 py-2">{exp.title || "N/A"}</td>
                  <td className="border px-4 py-2">PKR {exp.amount || 0}</td>
                  <td className="border px-4 py-2">{exp.type || "N/A"}</td>{" "}
                  {/* ✅ Type here */}
                  <td className="border px-4 py-2">
                    {exp.remarks || "N/A"}
                  </td>{" "}
                  {/* ✅ Remarks */}
                  <td className="border px-4 py-2">{exp.name || "N/A"}</td>{" "}
                  {/* ✅ Name last */}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-600">No expenses found.</p>
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

export default ExpenseHistory;
