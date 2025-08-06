// // src/components/TransferForm.jsx
// import { collection, addDoc, Timestamp } from "firebase/firestore";
// import db from "../firebase/firestore";

// function TransferForm({ onClose }) {
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const receiver = e.target.receiver.value;
//     const amount = e.target.amount.value;

//     try {
//       await addDoc(collection(db, "transfer-history"), {
//         sender: "Admin",
//         receiver,
//         amount: parseFloat(amount),
//         date: Timestamp.now(),
//       });

//       alert("Transfer recorded successfully!");
//       e.target.reset();
//       onClose();
//     } catch (error) {
//       console.error("Error saving transfer:", error);
//       alert("Transfer failed.");
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in">
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold"
//         >
//           ×
//         </button>

//         <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
//           💸 Transfer Amount
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <select
//             name="receiver"
//             required
//             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
//           >
//             <option value="">Select User</option>
//             <option value="Ibrar">Ibrar</option>
//             <option value="Ahmad">Ahmad</option>
//             <option value="Ali">Ali</option>
//           </select>

//           <input
//             type="number"
//             name="amount"
//             placeholder="Enter Amount"
//             required
//             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
//           />

//           <input
//             type="text"
//             value={new Date().toISOString().split("T")[0]}
//             readOnly
//             className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600"
//           />

//           <button
//             type="submit"
//             className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
//           >
//             Confirm Transfer
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default TransferForm;
