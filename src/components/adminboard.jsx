// src/components/AdminBoard.jsx
// (same imports as before)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import auth from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
} from "firebase/firestore";
import db from "../firebase/firestore";

function AdminBoard() {
  // ---------- state & helpers unchanged ----------
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showExpensePopup, setShowExpensePopup] = useState(false);

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyData, setDailyData] = useState([]);

  const [totals, setTotals] = useState({ total: 0, Ibrar: 0, Ahmad: 0 });
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [expenseBreakdown, setExpenseBreakdown] = useState({
    Ibrar: { office: 0, personal: 0 },
    Ahmad: { office: 0, personal: 0 },
    Admin: { office: 0, personal: 0 },
  });

  const [activity, setActivity] = useState([]);
  const [activityFilter, setActivityFilter] = useState("All");

  const currentUserEmail = auth.currentUser?.email || "";
  const isAdmin = currentUserEmail === "admin@admin.com";

  const userOptions = ["All", "Admin", "Ibrar", "Ahmad"];
  const [openMenu, setOpenMenu] = useState(null);
  const [openDeleteMenu, setOpenDeleteMenu] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState("day");
  const [deleteScope, setDeleteScope] = useState("all");
  const [deleteDay, setDeleteDay] = useState("");
  const [deleteMonth, setDeleteMonth] = useState("");
  const [deleteStart, setDeleteStart] = useState("");
  const [deleteEnd, setDeleteEnd] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [transferDisabled, setTransferDisabled] = useState(false);
  const [transferToastShown, setTransferToastShown] = useState(false);
  const [adminExpenseDisabled, setAdminExpenseDisabled] = useState(false);
  const [adminExpenseToastShown, setAdminExpenseToastShown] = useState(false);

  const [reloadTick, setReloadTick] = useState(0);

  const norm = (s) => (s ?? "").toString().trim().toLowerCase();
  const asDate = (v) =>
    v?.toDate
      ? v.toDate()
      : v instanceof Date
      ? v
      : typeof v === "string"
      ? new Date(v)
      : null;

  // ---------- data fetching (unchanged except reloadTick deps) ----------
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const snap = await getDocs(collection(db, "transfer-history"));
        const rows = snap.docs.map((d) => d.data());
        const totalsLocal = { total: 0, Ibrar: 0, Ahmad: 0 };

        const daysInMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        const daily = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          Ibrar: 0,
          Ahmad: 0,
        }));

        for (const t of rows) {
          const amt = parseFloat(t.amount) || 0;
          totalsLocal.total += amt;
          const r = norm(t.receiver);
          if (r === "ibrar") totalsLocal.Ibrar += amt;
          else if (r === "ahmad") totalsLocal.Ahmad += amt;

          const d = asDate(t.date ?? t.createdAt ?? t.timestamp) || new Date();
          if (
            d.getFullYear() === selectedYear &&
            d.getMonth() === selectedMonth
          ) {
            const idx = d.getDate() - 1;
            if (r === "ibrar") daily[idx].Ibrar += amt;
            else if (r === "ahmad") daily[idx].Ahmad += amt;
          }
        }
        setTotals(totalsLocal);
        setDailyData(daily);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        const daysInMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        setDailyData(
          Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            Ibrar: 0,
            Ahmad: 0,
          }))
        );
      }
    };
    fetchTransactions();
  }, [selectedMonth, selectedYear, reloadTick]);
  useEffect(() => {
    const fetchAllExpenseBreakdown = async () => {
      try {
        const snapshot = await getDocs(collection(db, "expenses"));
        const data = snapshot.docs.map((doc) => doc.data());
        const out = {
          Ibrar: { office: 0, personal: 0 },
          Ahmad: { office: 0, personal: 0 },
          Admin: { office: 0, personal: 0 },
        };
        let tot = 0;
        data.forEach((item) => {
          const name = norm(item.name);
          const type = norm(item.type);
          const amt = Number(item.amount || 0);
          tot += amt;
          if (name === "ibrar" || name === "ahmad" || name === "admin") {
            const who =
              name === "ibrar" ? "Ibrar" : name === "ahmad" ? "Ahmad" : "Admin";
            if (type === "office") out[who].office += amt;
            else if (type === "personal") out[who].personal += amt;
          }
        });
        setExpenseBreakdown(out);
        setTotalExpenses(tot);
      } catch (e) {
        console.error("Failed to compute breakdown:", e);
        setTotalExpenses(0);
      }
    };
    fetchAllExpenseBreakdown();
  }, [reloadTick]);

  useEffect(() => {
    const toDate = (v) => {
      if (v && typeof v.toDate === "function") return v.toDate();
      if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? new Date() : d;
      }
      if (v instanceof Date) return v;
      return new Date();
    };
    let tSnapCache = null,
      eSnapCache = null;

    const build = () => {
      if (!tSnapCache && !eSnapCache) return;
      const tItems = (tSnapCache ? tSnapCache.docs : []).map((d) => {
        const x = d.data() || {};
        const date = toDate(x.date ?? x.createdAt);
        return {
          type: "transfer",
          name: `${x.sender ?? "Admin"} → ${x.receiver ?? ""}`.trim(),
          title: x.paymentMethod || "Transfer",
          amount: Number(x.amount || 0),
          status: "Success",
          ts: date.getTime(),
        };
      });
      const eItems = (eSnapCache ? eSnapCache.docs : []).map((d) => {
        const x = d.data() || {};
        const date = toDate(x.createdAt ?? x.date);
        return {
          type: "expense",
          name: x.name || "Admin",
          title: x.title || (x.type ? `${x.type} Expense` : "Expense"),
          amount: Number(x.amount || 0),
          status: "Success",
          ts: date.getTime(),
        };
      });
      setActivity(
        [...tItems, ...eItems].sort((a, b) => b.ts - a.ts).slice(0, 20)
      );
    };

    const tRef = query(
      collection(db, "transfer-history"),
      orderBy("date", "desc"),
      limit(40)
    );
    const eRef = query(
      collection(db, "expenses"),
      orderBy("createdAt", "desc"),
      limit(40)
    );

    const unsubT = onSnapshot(
      tRef,
      (snap) => {
        tSnapCache = snap;
        build();
      },
      (err) => console.error("Transfers onSnapshot error:", err)
    );
    const unsubE = onSnapshot(
      eRef,
      (snap) => {
        eSnapCache = snap;
        build();
      },
      (err) => console.error("Expenses onSnapshot error:", err)
    );

    return () => {
      unsubT();
      unsubE();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  const handleViewHistory = () => navigate("/transfer-history/all");

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (transferDisabled) return;
    setTransferDisabled(true);
    const receiver = e.target.receiver.value;
    const amount = e.target.amount.value;
    const paymentMethod = e.target.paymentMethod.value;
    const remarks = e.target.remarks.value;
    try {
      await addDoc(collection(db, "transfer-history"), {
        sender: "Admin",
        receiver,
        paymentMethod,
        remarks,
        amount: parseFloat(amount),
        date: Timestamp.now(),
      });
      setTotals((prev) => {
        const amt = parseFloat(amount);
        return {
          ...prev,
          total: (prev.total || 0) + amt,
          Ibrar: receiver === "Ibrar" ? (prev.Ibrar || 0) + amt : prev.Ibrar,
          Ahmad: receiver === "Ahmad" ? (prev.Ahmad || 0) + amt : prev.Ahmad,
        };
      });
      if (!transferToastShown) {
        toast.success("Transfer successful!");
        setTransferToastShown(true);
      }
      e.target.reset();
      setShowPopup(false);
    } catch (error) {
      setTransferDisabled(false);
      console.error("Error:", error);
      toast.error("Transfer failed!");
    }
  };

  const handleAdminExpenseSubmit = async (e) => {
    e.preventDefault();
    if (adminExpenseDisabled) return;
    setAdminExpenseDisabled(true);
    const form = e.target;
    const title = form.title.value;
    const type = form.type.value;
    const amount = form.amount.value;
    const remarks = form.remarks.value;
    let name = "Admin";
    let email = currentUserEmail;
    let role = "admin";
    if (currentUserEmail === "ahmad@ahmad.com") {
      name = "Ahmad";
      role = "user";
    } else if (currentUserEmail === "ibrar@ibrar.com") {
      name = "Ibrar";
      role = "user";
    }
    try {
      await addDoc(collection(db, "expenses"), {
        name,
        email,
        title,
        type,
        remarks,
        amount: parseFloat(amount),
        date: new Date().toISOString().split("T")[0],
        createdAt: Timestamp.now(),
        role,
      });
      form.reset();
      if (!adminExpenseToastShown) {
        toast.success("Expense added!");
        setAdminExpenseToastShown(true);
      }
    } catch (err) {
      setAdminExpenseDisabled(false);
      console.error("Error saving admin expense:", err);
      toast.error("Failed to save expense.");
    }
  };

  // format helpers
  const OFFICE_COLOR = "#10b981",
    PERSONAL_COLOR = "#a855f7",
    RING_BG = "#e5e7eb";
  const fmtAmt = (n) => `Rs ${Math.round(Number(n || 0)).toLocaleString()}`;
  const fmtDT = (ms) => new Date(ms).toLocaleString();
  const mkDonutData = (value, other) => {
    const total = Math.max(value + other, 1);
    return [
      { name: "value", value },
      { name: "rest", value: Math.max(total - value, 0.0001) },
    ];
  };
  const filteredActivity =
    activityFilter === "All"
      ? activity
      : activity.filter((a) =>
          activityFilter === "Transfers"
            ? a.type === "transfer"
            : a.type === "expense"
        );
  const IconWrap = ({ children }) => (
    <span className="inline-flex items-center justify-center w-4 h-4 mr-2">
      {children}
    </span>
  );
  const IconTransfer = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 7h11M13 3l4 4-4 4" />
      <path d="M17 17H6M10 21l-4-4 4-4" />
    </svg>
  );
  const IconReceipt = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 7h6M9 11h6M9 15h6" />
    </svg>
  );
  const IconClock = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
  const IconList = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
  const IconTrash = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
  const goToHistory = (type, who) => {
    const seg = who === "All" ? "all" : who;
    if (type === "t") navigate(`/transfer-history/${seg}`);
    else navigate(`/expense-history/${seg}`);
    setOpenMenu(null);
  };

  // ----- delete helpers (unchanged logic) -----
  const parseTS = (v) =>
    v && typeof v.toDate === "function"
      ? v.toDate()
      : typeof v === "string"
      ? new Date(v)
      : v instanceof Date
      ? v
      : null;
  const endOfDayExclusive = (d) => {
    const x = new Date(d);
    x.setHours(24, 0, 0, 0);
    return x;
  };
  const firstOfMonth = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1, 0, 0, 0, 0);
  };
  const firstOfNextMonth = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m, 1, 0, 0, 0, 0);
  };
  const deleteInBatches = async (coll, shouldDelete) => {
    const snap = await getDocs(collection(db, coll));
    let count = 0,
      batch = writeBatch(db),
      n = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (!shouldDelete(data)) continue;
      batch.delete(doc(db, coll, d.id));
      n++;
      count++;
      if (n >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        n = 0;
      }
    }
    if (n > 0) await batch.commit();
    return count;
  };
  const performDelete = async (scope, startDate, endDate) => {
    if (!isAdmin) return toast.error("Only admin can remove data.");
    setDeleting(true);
    try {
      const start = startDate ? new Date(startDate) : new Date(1970, 0, 1);
      const end = endDate ? new Date(endDate) : new Date(3000, 0, 1);
      const inRange = (d) => d && d >= start && d < end;
      const delTransfers = () =>
        deleteInBatches("transfer-history", (x) =>
          inRange(parseTS(x.date ?? x.createdAt ?? x.timestamp))
        );
      const delExpenses = () =>
        deleteInBatches("expenses", (x) =>
          inRange(parseTS(x.createdAt) ?? parseTS(x.date))
        );
      let removed = 0;
      if (scope === "all") {
        const [a, b] = await Promise.all([delTransfers(), delExpenses()]);
        removed = a + b;
      } else if (scope === "transfers") removed = await delTransfers();
      else removed = await delExpenses();
      toast.success(`Removed ${removed} record(s).`);
      setReloadTick((t) => t + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove data.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setOpenDeleteMenu(false);
    }
  };
  const quickDelete = (kind) => {
    if (!isAdmin) return toast.error("Only admin can remove data.");
    const now = new Date();
    if (kind === "all") return performDelete("all", null, null);
    if (kind === "today") {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      return performDelete("all", s, endOfDayExclusive(s));
    }
    if (kind === "thisMonth") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return performDelete("all", s, e);
    }
    setShowDeleteModal(true);
  };

  // ------------------- UI -------------------
  return (
    <div className="flex h-screen overflow-hidden dashboard-bg">
      {/* Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen md:w-56 xl:w-64 flex-col bg-black text-white shadow-2xl z-20 overflow-visible">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img
            src="/logo_text_all_white_auto.png"
            alt="Subtle"
            className="h-10 object-contain"
          />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setShowPopup(true);
              setShowExpensePopup(false);
              setTransferDisabled(false);
              setTransferToastShown(false);
            }}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition inline-flex items-center"
          >
            <IconWrap>
              <IconTransfer />
            </IconWrap>
            Transfer
          </button>

          <button
            onClick={() => {
              setShowExpensePopup(true);
              setShowPopup(false);
            }}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition inline-flex items-center"
          >
            <IconWrap>
              <IconReceipt />
            </IconWrap>
            Admin Expense
          </button>

          {/* T.History */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("t")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
              <IconClock /> T.History
            </button>
            {openMenu === "t" && (
              <div className="absolute left-full top-0 ml-2 z-50 w-40 rounded-lg border border-white/10 bg-neutral-900/95 text-white shadow-xl backdrop-blur">
                {userOptions.map((u) => (
                  <button
                    key={`t-${u}`}
                    onClick={() => goToHistory("t", u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* E.History */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("e")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
              <IconList /> E.History
            </button>
            {openMenu === "e" && (
              <div className="absolute left-full top-0 ml-2 z-50 w-40 rounded-lg border border-white/10 bg-neutral-900/95 text-white shadow-xl backdrop-blur">
                {userOptions.map((u) => (
                  <button
                    key={`e-${u}`}
                    onClick={() => goToHistory("e", u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove Data */}
          {isAdmin && (
            <div
              className="relative"
              onMouseEnter={() => setOpenDeleteMenu(true)}
              onMouseLeave={() => setOpenDeleteMenu(false)}
            >
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
                <IconTrash /> Remove Data
              </button>
              {openDeleteMenu && (
                <div className="absolute left-full top-0 ml-2 z-50 w-52 rounded-lg border border-white/10 bg-neutral-900/95 text-white shadow-xl backdrop-blur">
                  <button
                    onClick={() => quickDelete("all")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Delete <b>ALL</b>
                  </button>
                  <button
                    onClick={() => quickDelete("today")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Delete <b>Today</b>
                  </button>
                  <button
                    onClick={() => quickDelete("thisMonth")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Delete <b>This Month</b>
                  </button>
                  <button
                    onClick={() => quickDelete("custom")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                  >
                    Pick Day / Month / Range…
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-90 text-white py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-56 xl:ml-64 h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
              Admin Dashboard
            </span>
          </h1>

          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((s) => !s)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              >
                {auth.currentUser?.photoURL ? (
                  <img
                    src={auth.currentUser.photoURL}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white grid place-items-center text-sm font-semibold">
                    {(
                      (auth.currentUser?.displayName ||
                        auth.currentUser?.email ||
                        "U")[0] || "U"
                    ).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-gray-800">
                    {auth.currentUser?.displayName ||
                      (auth.currentUser?.email
                        ? auth.currentUser.email.split("@")[0]
                        : "User")}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
                    {auth.currentUser?.email}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="text-gray-500"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-white shadow-xl">
                    <div className="px-3 py-2 border-b">
                      <div className="text-sm font-semibold text-gray-800">
                        {auth.currentUser?.displayName ||
                          (auth.currentUser?.email
                            ? auth.currentUser.email.split("@")[0]
                            : "User")}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {auth.currentUser?.email}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <div className="md:hidden relative">
              <button
                className="p-2 rounded-lg border bg-white hover:bg-gray-50"
                aria-label="Menu"
                onClick={() => setShowMobileMenu((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-700"
                >
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>

              {showMobileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMobileMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border flex flex-col gap-2 py-2 px-3 z-50 min-w-[180px]">
                    <button
                      onClick={() => {
                        setShowPopup(true);
                        setShowExpensePopup(false);
                        setShowMobileMenu(false);
                      }}
                      className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 w-full text-left transition inline-flex items-center"
                    >
                      <IconWrap>
                        <IconTransfer />
                      </IconWrap>
                      Transfer
                    </button>
                    <button
                      onClick={() => {
                        setShowExpensePopup(true);
                        setShowPopup(false);
                        setShowMobileMenu(false);
                      }}
                      className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 w-full text-left transition inline-flex items-center"
                    >
                      <IconWrap>
                        <IconReceipt />
                      </IconWrap>
                      Admin Expense
                    </button>
                    <button
                      onClick={() => {
                        handleViewHistory();
                        setShowMobileMenu(false);
                      }}
                      className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 w-full text-left transition inline-flex items-center"
                    >
                      <IconWrap>
                        <IconClock />
                      </IconWrap>
                      T.History
                    </button>
                    <button
                      onClick={() => {
                        selectedUser
                          ? navigate(
                              `/expense-history/${
                                selectedUser === "Admin"
                                  ? "Admin"
                                  : selectedUser
                              }`
                            )
                          : navigate(`/expense-history/all`);
                        setShowMobileMenu(false);
                      }}
                      className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 w-full text-left transition inline-flex items-center"
                    >
                      <IconWrap>
                        <IconList />
                      </IconWrap>
                      E.History
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 transition inline-flex items-center"
                      >
                        <IconWrap>
                          <IconTrash />
                        </IconWrap>
                        Remove Data
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT GRID (2xl split to avoid squeeze on laptops) */}
        <div className="grid grid-cols-1 2xl:grid-cols-5 gap-5">
          {/* LEFT STACK */}
          <div className="2xl:col-span-2 space-y-5">
            {/* Totals row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Cash", val: totals.total },
                { label: "Ibrar", val: totals.Ibrar },
                { label: "Ahmad", val: totals.Ahmad },
                { label: "Total Expenses", val: totalExpenses },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl p-4 shadow-sm text-white bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] ring-1 ring-white/15"
                >
                  <p className="text-xs font-medium text-white/90">{c.label}</p>
                  <div className="mt-1 text-2xl font-bold">
                    ₨ {Number(c.val || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-day chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Latest Transactions
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    className="text-sm border rounded-md px-2 py-1 text-gray-600 bg-white"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    className="text-sm border rounded-md px-2 py-1 text-gray-600 bg-white"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(
                      (y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="h-56 sm:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      strokeWidth={1.5}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={{ strokeWidth: 1.5, stroke: "#d1d5db" }}
                      tickLine={{ strokeWidth: 1.5, stroke: "#d1d5db" }}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      allowDecimals={false}
                      axisLine={{ strokeWidth: 1.5, stroke: "#d1d5db" }}
                      tickLine={{ strokeWidth: 1.5, stroke: "#d1d5db" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Ibrar" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ahmad" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut circles */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                Expenses
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 justify-items-center">
                {[
                  {
                    who: "Ibrar",
                    type: "office",
                    color: OFFICE_COLOR,
                    label: "Ibrar Office",
                  },
                  {
                    who: "Ibrar",
                    type: "personal",
                    color: PERSONAL_COLOR,
                    label: "Ibrar Personal",
                  },
                  {
                    who: "Ahmad",
                    type: "office",
                    color: OFFICE_COLOR,
                    label: "Ahmad Office",
                  },
                  {
                    who: "Ahmad",
                    type: "personal",
                    color: PERSONAL_COLOR,
                    label: "Ahmad Personal",
                  },
                  {
                    who: "Admin",
                    type: "office",
                    color: OFFICE_COLOR,
                    label: "Admin Office",
                  },
                  {
                    who: "Admin",
                    type: "personal",
                    color: PERSONAL_COLOR,
                    label: "Admin Personal",
                  },
                ].map((cfg) => {
                  const value = expenseBreakdown[cfg.who][cfg.type];
                  const other =
                    cfg.type === "office"
                      ? expenseBreakdown[cfg.who].personal
                      : expenseBreakdown[cfg.who].office;
                  return (
                    <div
                      key={cfg.label}
                      className="flex flex-col items-center w-[92px]"
                    >
                      <PieChart width={78} height={78}>
                        <Pie
                          data={mkDonutData(value, other)}
                          innerRadius={28}
                          outerRadius={36}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={cfg.color} />
                          <Cell fill={RING_BG} />
                        </Pie>
                      </PieChart>
                      <div className="mt-1 text-center leading-tight">
                        <div className="text-sm font-semibold text-gray-900">
                          {fmtAmt(value)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Latest Activity */}
          <div className="hidden md:block 2xl:col-span-3 bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Latest Activity
              </h2>
              <div className="flex gap-2">
                {["All", "Transfers", "Expenses"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActivityFilter(t)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activityFilter === t
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_minmax(120px,1fr)_minmax(110px,1fr)] bg-gray-50/80 px-4 py-2 text-xs font-semibold text-gray-600 sticky top-0 z-10">
                  <div>Name / Title</div>
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Status</div>
                </div>

                <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-gray-100">
                  {filteredActivity.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_minmax(120px,1fr)_minmax(110px,1fr)] items-center px-4 py-3 text-sm hover:bg-gray-50/80 min-h-[56px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            row.type === "expense"
                              ? "bg-rose-400"
                              : "bg-emerald-400"
                          }`}
                        />
                        <div className="truncate">
                          <span className="font-medium">{row.name}</span>
                          {row.title ? (
                            <span className="text-gray-500">
                              {" "}
                              — {row.title}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-gray-600 whitespace-nowrap">
                        {fmtDT(row.ts)}
                      </div>
                      <div
                        className={`text-right font-semibold whitespace-nowrap ${
                          row.type === "expense"
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {row.type === "expense" ? "-" : "+"}
                        {fmtAmt(row.amount)}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredActivity.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No activity yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer Popup — VIP UI */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md mx-3 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl">
            <div className="h-1.5 w-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] rounded-t-2xl" />
            <button
              onClick={() => {
                setShowPopup(false);
                setTransferDisabled(false);
                setTransferToastShown(false);
              }}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/25 border border-white/30 text-gray-700 hover:bg-white/40 font-bold"
              aria-label="Close"
            >
              ×
            </button>

            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-gray-900 text-center">
                {(() => {
                  if (currentUserEmail === "ahmad@ahmad.com")
                    return "Welcome Ahmad";
                  if (currentUserEmail === "ibrar@ibrar.com")
                    return "Welcome Ibrar";
                  return "Transfer Amount";
                })()}
              </h2>

              <form
                onSubmit={handleTransferSubmit}
                onChange={() => {
                  setTransferDisabled(false);
                  setTransferToastShown(false);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    name="receiver"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  >
                    <option value="">Select User</option>
                    <option value="Ibrar">Ibrar</option>
                    <option value="Ahmad">Ahmad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 px-3 rounded-lg bg-white/70 text-gray-800 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    placeholder="Enter Reason for Payment"
                    rows="3"
                    className="w-full px-3 py-2 rounded-lg bg-white/85 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={transferDisabled}
                  className="w-full h-11 rounded-lg text-white font-semibold shadow-lg bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {transferDisabled ? "Saved" : "Add"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Expense Popup — VIP UI */}
      {showExpensePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md mx-3 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl">
            <div className="h-1.5 w-full bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] rounded-t-2xl" />
            <button
              onClick={() => setShowExpensePopup(false)}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/25 border border-white/30 text-gray-700 hover:bg-white/40 font-bold"
              aria-label="Close"
            >
              ×
            </button>

            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-gray-900 text-center">
                Admin Expense Entry
              </h2>

              <form
                onSubmit={handleAdminExpenseSubmit}
                onChange={() => {
                  setAdminExpenseDisabled(false);
                  setAdminExpenseToastShown(false);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 px-3 rounded-lg bg-white/70 text-gray-800 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Expense Title"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expense Type
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-white/85 text-gray-900 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                  >
                    <option value="">Select Type</option>
                    <option value="Office">Office</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks (optional)
                  </label>
                  <textarea
                    name="remarks"
                    placeholder="Enter any comments about this expense..."
                    rows="3"
                    className="w-full px-3 py-2 rounded-lg bg-white/85 text-gray-900 placeholder-gray-500 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminExpenseDisabled}
                  className="w-full h-11 rounded-lg text-white font-semibold shadow-lg bg-[linear-gradient(298deg,#0BBFEF_0%,#D12CBF_100%)] hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {adminExpenseDisabled ? "Saved" : "Save Expense"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Data Modal (admin) */}
      {showDeleteModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">Remove Data</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Scope */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  Scope:
                </span>
                {[
                  { k: "all", label: "Transfers + Expenses" },
                  { k: "transfers", label: "Transfers only" },
                  { k: "expenses", label: "Expenses only" },
                ].map((o) => (
                  <label
                    key={o.k}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={o.k}
                      checked={deleteScope === o.k}
                      onChange={(e) => setDeleteScope(e.target.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              {/* Mode */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">By:</span>
                {[
                  { k: "day", label: "Day" },
                  { k: "month", label: "Month" },
                  { k: "range", label: "Date Range" },
                ].map((o) => (
                  <label
                    key={o.k}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={o.k}
                      checked={deleteMode === o.k}
                      onChange={(e) => setDeleteMode(e.target.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              {/* Inputs */}
              {deleteMode === "day" && (
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={deleteDay}
                    onChange={(e) => setDeleteDay(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
              {deleteMode === "month" && (
                <div className="flex items-center gap-3">
                  <input
                    type="month"
                    value={deleteMonth}
                    onChange={(e) => setDeleteMonth(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
              {deleteMode === "range" && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="date"
                    value={deleteStart}
                    onChange={(e) => setDeleteStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Start date"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={deleteEnd}
                    onChange={(e) => setDeleteEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="End date"
                  />
                </div>
              )}

              <div className="text-[13px] text-rose-600">
                Warning: This operation permanently deletes matching records
                from Firestore.
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  disabled={
                    deleting ||
                    (!deleteDay && deleteMode === "day") ||
                    (!deleteMonth && deleteMode === "month") ||
                    (deleteMode === "range" && (!deleteStart || !deleteEnd))
                  }
                  onClick={() => {
                    if (deleteMode === "day") {
                      const s = new Date(deleteDay);
                      if (isNaN(+s)) return toast.error("Select a valid day.");
                      const e = endOfDayExclusive(s);
                      performDelete(deleteScope, s, e);
                    } else if (deleteMode === "month") {
                      if (!deleteMonth) return toast.error("Select a month.");
                      const s = firstOfMonth(deleteMonth);
                      const e = firstOfNextMonth(deleteMonth);
                      performDelete(deleteScope, s, e);
                    } else {
                      const s = new Date(deleteStart);
                      const e = endOfDayExclusive(new Date(deleteEnd));
                      if (isNaN(+s) || isNaN(+e))
                        return toast.error("Select a valid range.");
                      performDelete(deleteScope, s, e);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBoard;
