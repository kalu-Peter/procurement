"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setDebugToken(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Call the PHP API directly
      const res = await fetch(
        "http://localhost:8000/api/auth/instant_reset.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: newPassword }),
        }
      );

      // Attempt to parse JSON but handle HTML error responses gracefully
      let data: any = null;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If we received HTML (Next.js 404 page or other), show useful message
        setError(
          `Unexpected response from server (${res.status}): ${text.slice(
            0,
            200
          )}`
        );
        setLoading(false);
        return;
      }

      // data now contains the parsed JSON
      if (res.ok) {
        setMessage(data.message || "Password has been reset.");
        if (data.new_password) setDebugToken(data.new_password);
        else setDebugToken(newPassword);
      } else {
        setError(
          data.error || `Failed to reset password (status ${res.status})`
        );
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-2">Forgot your password?</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter your email and we'll send instructions to reset your password.
      </p>

      {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bs-green"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bs-green"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bs-green"
            placeholder="Confirm new password"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-bs-green text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </form>

      {debugToken && (
        <div className="mt-3 text-sm text-gray-700">
          New password (copy this & sign in):{" "}
          <code className="block break-words bg-gray-100 p-2 rounded mt-1">
            {debugToken}
          </code>
        </div>
      )}
    </div>
  );
}
