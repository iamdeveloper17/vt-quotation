import { useEffect, useState } from "react";
import invoice2 from '../images/invoice2.png';

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState(""); // 👈 Add this

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole"); // 👈 Get role

    if (storedName && storedEmail && storedRole) {
      setUserName(storedName);
      setUserEmail(storedEmail);
      setUserRole(storedRole);
    }
  }, []);

  return (
    <div className="w-full py-5 lg:py-10 ">
      {/* Greeting */}
      <h2 className="text-2xl sm:text-3xl text-[#fffbf3] mb-2">
        Welcome, {userName}!
      </h2>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        <div>
          <h1 className="text-xl sm:text-2xl text-white mb-2">Quotation Dashboard</h1>

          <h2 className="text-lg sm:text-xl text-zinc-200 mb-4">
            Manage Your Quotations Efficiently
          </h2>
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
            Welcome to the Quotation Dashboard, where you can create, track, and manage all your quotations in one place. Generate professional quotations, edit existing records, and monitor payment details seamlessly. Stay organized and in control of your business transactions with real-time quotation tracking and management.
          </p>
        </div>

        <div className="flex justify-center">
          <img 
            src={invoice2} 
            alt="Invoice illustration" 
            className="w-full max-w-md object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

