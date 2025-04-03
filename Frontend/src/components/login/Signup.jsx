import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data) => {
    setApiError("");
    setSuccessMessage("");

    const { name, email, password } = data;

    try {
      const apiKey = "7f60299b0a2e4fa0865bcdee71856e1e";
      let skipValidation = false;
      let isRealEmail = true;

      try {
        const emailCheck = await fetch(
          `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`
        );

        const emailText = await emailCheck.text();
        const emailData = JSON.parse(emailText);
        console.log("Email Check Response:", emailData);

        // Quota reached fallback
        if (emailData.error?.code === "quota_reached") {
          console.warn("Quota exceeded. Skipping email verification.");
          skipValidation = true;
        } else {
          isRealEmail =
            emailData.is_valid_format?.value &&
            emailData.deliverability === "DELIVERABLE" &&
            emailData.is_smtp_valid?.value;
        }

        if (!skipValidation && !isRealEmail) {
          setApiError("The email address is not valid or active. Please enter a real email.");
          return;
        }
      } catch (err) {
        console.warn("Email Validation Error:", err.message);
        // Continue without blocking signup
      }

      // Proceed with signup
      const response = await fetch("https://vt-quotation.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();
      console.log("Signup Response:", result);

      if (!response.ok || !result.user) {
        setApiError(result.message || "Signup failed. Try again.");
        return;
      }

      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userName", result.user.name);
      setSuccessMessage("Signup successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Signup Error:", err.message);
      setApiError(err.message || "Something went wrong during signup.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#fff7e6]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">Create an Account</h2>

        {/* ✅ Show messages */}
        {apiError && <p className="text-red-500 text-sm text-center mb-4">{apiError}</p>}
        {successMessage && <p className="text-green-600 text-sm text-center mb-4">{successMessage}</p>}

        <div className="mb-3">
          <label className="font-medium">Full Name</label>
          <input type="text" {...register("name")} className="w-full border p-2 rounded" />
          <p className="text-red-500 text-sm">{errors.name?.message}</p>
        </div>

        <div className="mb-3">
          <label className="font-medium">Email</label>
          <input type="email" {...register("email")} className="w-full border p-2 rounded" />
          <p className="text-red-500 text-sm">{errors.email?.message}</p>
        </div>

        <div className="mb-3">
          <label className="font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full border p-2 rounded pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 hover:cursor-pointer"
        >
          Sign Up
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

export default Signup;
