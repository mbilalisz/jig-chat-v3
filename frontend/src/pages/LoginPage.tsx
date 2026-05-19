import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import apiClient from "../api/client";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"error" | "conflict">("error");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { user, token } = response.data;

      login(user, token);
      navigate("/chat");
    } catch (err: any) {
      const status = err.response?.status;
      setErrorType(status === 409 ? "conflict" : "error");
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.284l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.768-5.764-5.768zm3.391 8.232c-.154.433-.766.789-1.054.84-.282.049-.636.078-1.026-.048-.242-.078-1.018-.333-1.942-.739-1.579-.693-2.586-2.304-2.664-2.407-.078-.103-.639-.85-.639-1.619 0-.769.403-1.147.547-1.303.144-.156.312-.195.416-.195.104 0 .208.001.299.006.095.004.221-.036.345.263.124.3.424 1.034.461 1.11.037.076.061.165.012.263-.049.098-.074.159-.148.245-.075.085-.157.19-.225.255-.075.076-.153.159-.066.308.087.149.387.639.829 1.034.57.51 1.051.669 1.201.744.149.075.236.062.324-.039.088-.101.377-.439.477-.589.1-.15.2-.126.337-.075.137.05 1.146.463 1.343.562.198.099.33.148.378.232.048.083.048.483-.106.916z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#41525d]">
            JIG - Chat Login
          </h1>
          <p className="text-[#667781] text-sm mt-2 text-center">
            Sign in to JIG's Chat App to start messaging
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              className={`p-3 rounded text-sm text-center ${
                errorType === "conflict"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#41525d]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-[#d1d7db] rounded focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. bilal@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#41525d]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[#d1d7db] rounded focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full shadow-sm shadow-orange-300 cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#f0f2f5] text-center">
          <p className="text-xs text-[#667781]">
            Test Account: <strong>bilal@example.com</strong> /{" "}
            <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
