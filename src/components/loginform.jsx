import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../firebase/auth";
import { toast } from "react-toastify";

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email === "admin@admin.com") navigate("/admin-dashboard");
      else navigate("/expense-entry");
    } catch (error) {
      console.error("Login failed:", error.message);
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d2b2c]">
      {/* radial gradient overlay (opacity ≈ 0.41) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(at center center, #99C5F0 20%, #D08EDF 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8">
  {/* two columns with small gap; perfectly centered vertically */}
  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10">

    {/* LEFT : logo (stays top on mobile) */}
    <div className="flex md:justify-end justify-center md:flex-[0_0_48%]">
      <img
        src="public/logo_text_all_white_auto.png"
{/*         alt="Subtle Marketing" */}
        className="h-24 md:h-28 object-contain"
      />
    </div>
      {/* CENTER: Vertical divider */}
  <div className="hidden lg:block mx-8 lg:mx-12">
    <span
      className="
        block
        w-[1.5px]              /* thickness */
        h-[62vh]               /* height -> increase/decrease as needed */
        rounded-full
        bg-gradient-to-b
        from-transparent
        via-white/40
        to-transparent
      "
    />
  </div>
    {/* RIGHT : welcome + compact form */}
    <div className="w-full md:flex-[0_0_48%] md:pl-6 flex flex-col items-center">
{/* Heading */}
<div className="mb-4 text-center">
  <h1 className="text-4xl md:text-5xl font-extrabold text-white/95">Welcome</h1>
  <p
    className="mt-5 text-[12px] md:text-[12px] uppercase tracking-[0.25em] text-white/85"
    style={{ fontFamily: "'Rajdhani',sans-serif" }}
  >
    Log in to continue
  </p>
</div>

{/* Taller spacer between heading and form */}
<div className="h-10 md:h-10" />

{/* Form */}
<form onSubmit={handleLogin} className="w-full max-w-xl mx-auto">
  {/* spacing between fields & button */}
  <div className="space-y-4 md:space-y-5">
    <input
      name="email"
      type="email"
      placeholder="admin@admin.com"
      required
      className="h-12 md:h-14 w-full px-4 md:px-5 text-base rounded-lg bg-white/85
                 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-white/60"
    />
    <input
      name="password"
      type="password"
      placeholder="Password"
      required
      className="h-12 md:h-14 w-full px-4 md:px-5 text-base rounded-lg bg-white/85
                 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-white/60"
    />
    <button
      type="submit"
      className="w-full h-12 md:h-14 rounded-lg text-white font-semibold shadow-lg
                 bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)]
                 hover:opacity-95 transition"
    >
      Login
    </button>
  </div>
</form>
    </div>
  </div>
</div>

    </div>
  );
}
export default LoginForm;
