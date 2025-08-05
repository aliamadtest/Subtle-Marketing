import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../firebase/auth";

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (email === "admin@admin.com") {
        navigate("/admin-dashboard");
      } else {
        navigate("/expense-entry");
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Invalid credentials");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="max-w-sm mx-auto mt-20 p-6 bg-white shadow-md rounded-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full mb-3 p-2 border border-gray-300 rounded"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full mb-4 p-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
      >
        Login
      </button>
    </form>
  );
}

export default LoginForm;
