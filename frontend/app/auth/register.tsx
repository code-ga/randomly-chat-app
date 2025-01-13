import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/auth";
interface FormValues {
  username: string;
  email: string;
  password: string;
}

const SignupPage: React.FC = () => {
  const [formValues, setFormValues] = useState<FormValues>({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { register } = useAuth();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!formValues.username) {
      newErrors.username = "Username is required";
    }

    if (!formValues.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formValues.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formValues.password) {
      newErrors.password = "Password is required";
    } else if (formValues.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Handle successful signup (e.g., API call)
      const result = await register?.(
        formValues.username,
        formValues.email,
        formValues.password
      );
      if (!result) {
        setErrors({ message: "Signup failed" });
        return;
      }
      if (!result.success) {
        setErrors({ message: result.message });
        return;
      }
      console.log("Signup successful:", formValues);
      navigate("/");
      // Clear form after successful signup
      setFormValues({ username: "", email: "", password: "" });
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-96 p-8 bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-white mb-6">Signup</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-400"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formValues.username}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="text-red-500 mt-1 text-sm">{errors.username}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 mt-1 text-sm">{errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-400"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 mt-1 text-sm">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 mt-4 bg-blue-500 hover:bg-blue-600 rounded-md text-white"
          >
            Signup
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-400">
          Already have an account?
          <Link to="/login" className="text-blue-500 mx-2">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
