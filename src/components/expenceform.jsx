// src/components/expenceform.jsx
import { collection, addDoc, Timestamp } from "firebase/firestore";
import db from "../firebase/firestore"; // make sure this path is correct

function ExpenseEntryPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const date = e.target.date.value;
    const title = e.target.title.value;
    const amount = e.target.amount.value;
    const image = e.target.image.files[0]; // not uploading image for now

    try {
      await addDoc(collection(db, "expenses"), {
        date,
        title,
        amount: parseFloat(amount),
        name,
        createdAt: Timestamp.now(),
      });

      alert("Expense saved successfully!");
      e.target.reset();
    } catch (error) {
      console.error("Error adding expense: ", error);
      alert("Failed to save expense.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Expense Entry
        </h2>
        {/* Name Field */}
        <label className="block mb-1 text-gray-600">Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter Your Name"
          required
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="block mb-1 text-gray-600">Date</label>
        <input
          type="date"
          name="date"
          required
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

        <label className="block mb-1 text-gray-600">
          Upload Image (optional)
        </label>
        <input
          type="file"
          name="image"
          accept="image/*"
          className="w-full mb-6"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default ExpenseEntryPage;
