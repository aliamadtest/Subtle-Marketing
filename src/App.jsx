import { Routes, Route } from "react-router-dom";
import LoginForm from "./components/loginform";
import ExpenceForm from "./components/expenceform";
import AdminBoard from "./components/adminboard";
import TransferForm from "./components/transferform";
import TransferHistory from "./components/transferhistory";
import ExpenseHistory from "./components/expensehistory";
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/expense-entry" element={<ExpenceForm />} />
      <Route path="/admin-dashboard" element={<AdminBoard />} />
      <Route path="/transfer-form" element={<TransferForm />} />
      <Route path="/transfer-history" element={<TransferHistory />} />
      <Route path="/transfer-history/:user" element={<TransferHistory />} />
      <Route path="/expense-history" element={<ExpenseHistory />} />
    </Routes>
  );
}

export default App;
