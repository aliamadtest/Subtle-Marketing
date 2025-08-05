// src/components/transferform.jsx
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore"; // ✅ make sure this is correctly pointing

function TransferForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const receiver = e.target.receiver.value;
    const amount = e.target.amount.value;

    try {
      await addDoc(collection(db, "transfer-history"), {
        sender: "Admin", // static
        receiver,
        amount: parseFloat(amount),
        date: Timestamp.now(),
      });

      alert("Transfer recorded successfully!");
      e.target.reset();
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("Error saving transfer:", error);
      alert("Transfer failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Transfer Amount</h2>

        <select
          name="receiver"
          required
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">Select User</option>
          <option value="Ibrar">Ibrar</option>
          <option value="Ahmad">Ahmad</option>
          <option value="Ali">Ali</option>
        </select>

        <input
          type="number"
          name="amount"
          placeholder="Enter Amount"
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Cash
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin-dashboard")}
          className="w-full mt-4 text-blue-500 underline"
        >
          Back to Dashboard
        </button>
      </form>
    </div>
  );
}

export default TransferForm;
