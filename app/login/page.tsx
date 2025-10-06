"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import PublicNav from "@/components/PublicNav";
import ForgotPassword from "@/components/ForgotPassword";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Redirect to appropriate dashboard
      if (currentUser.role === "admin") {
        router.push("/dashboard/admin");
      } else if (currentUser.role === "procurement_officer") {
        router.push("/dashboard/procurement");
      } else if (currentUser.role === "department_head") {
        router.push("/dashboard/department");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError(
          `Unexpected server response (${response.status}): ${text.slice(
            0,
            200
          )}`
        );
        setLoading(false);
        return;
      }

      if (response.ok) {
        setCurrentUser(data.user);

        // Redirect based on user role
        if (data.user.role === "admin") {
          router.push("/dashboard/admin");
        } else if (data.user.role === "procurement_officer") {
          router.push("/dashboard/procurement");
        } else if (data.user.role === "department_head") {
          router.push("/dashboard/department");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('/tum2.jpg')",
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <div className="relative z-10">
        <PublicNav currentPage="login" />

        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                Sign in to your account
              </h2>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-error-warning-line text-red-500 mr-2"></i>
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i
                          className={`ri-${
                            showPassword ? "eye-off" : "eye"
                          }-line text-gray-400 hover:text-gray-600`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-bs-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bs-green disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>

                <div className="mt-4 text-sm text-center text-gray-600">
                  Don't have an account?{" "}
                  <a
                    href="/register"
                    className="text-bs-green hover:text-green-700 font-medium"
                  >
                    Register here
                  </a>
                </div>
              </div>
            </form>

            {/* Forgot password component */}
            <div className="mt-4">
              <ForgotPassword />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
