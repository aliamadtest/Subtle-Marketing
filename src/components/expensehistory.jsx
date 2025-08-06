import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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
        const filtered = user
          ? data.filter((item) => item.name === user)
          : data;
        setExpenses(filtered);
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
      }
    };

    fetchExpenses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">
          All Expense History
        </h2>

        {expenses.length > 0 ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Title</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="border px-4 py-2">{exp.date}</td>
                  <td className="border px-4 py-2">{exp.title}</td>
                  <td className="border px-4 py-2">PKR {exp.amount}</td>
                  <td className="border px-4 py-2">{exp.name || "N/A"}</td>
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
