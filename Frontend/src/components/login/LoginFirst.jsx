import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

const LoginFirst = () => {
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ Loading state

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://vt-quotation.onrender.com/login",
        data,
        { withCredentials: true } // ✅ very important to match CORS credentials
      );

      // ✅ Validate response
      if (!response.data?.token || !response.data?.user) {
        throw new Error("Login failed. Please try again.");
      }

      // ✅ Save user info to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userEmail", response.data.user.email);
      localStorage.setItem("userName", response.data.user.name);
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("canCreateQuotation", response.data.user.canCreateQuotation);
      localStorage.setItem("canCreatePurchaseOrder", response.data.user.canCreatePurchaseOrder);      
      navigate("/home/dashboard");
    } catch (error) {
      setApiError(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#fff7e6]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

        {/* Show API error message */}
        {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

        <div className="mb-3">
          <label className="font-medium">Email</label>
          <input
            type="email"
            {...register("email")}
            required
            className="w-full border p-2 rounded"
          />
          <p className="text-red-500 text-sm">{errors.email?.message}</p>
        </div>

        <div className="mb-3">
          <label className="font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              required
              className="w-full border p-2 rounded pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white p-2 rounded hover:cursor-pointer ${
            isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-2 hover:cursor-pointer"
        >
          Back
        </button>
      </form>
    </div>
  );
};

export default LoginFirst;
