"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

export default function LoginPage() {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifiant, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("expiresAtAccess", data.expiresAtAccess);
        localStorage.setItem("expiresAtRefresh", data.expiresAtRefresh);
        router.push("/home");
      } else {
        setMessage(data.message || "Erreur de connexion");
      }
    } catch (_error) {
      setMessage("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23f59e0b;stop-opacity:1" /><stop offset="100%" style="stop-color:%23d97706;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23a)"/><rect x="100" y="200" width="400" height="300" fill="%23ffffff" opacity="0.1" rx="8"/><circle cx="300" cy="350" r="50" fill="%23ffffff" opacity="0.2"/><rect x="150" y="250" width="300" height="20" fill="%23ffffff" opacity="0.3" rx="4"/><rect x="150" y="280" width="250" height="20" fill="%23ffffff" opacity="0.3" rx="4"/><rect x="150" y="310" width="200" height="20" fill="%23ffffff" opacity="0.3" rx="4"/></svg>')`,
          }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenue !
              </h1>
              <p className="text-gray-600 text-sm">
                Votre réseau réuni ici pour vous aider à prendre les meilleures
                décisions
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="identifiant">
                  Identifiant*
                </label>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black",
                    inputWrapper:
                      "bg-white border-gray-300 hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="identifiant"
                  placeholder="Saisis ton identifiant"
                  size="lg"
                  type="text"
                  value={identifiant}
                  variant="bordered"
                  onChange={(e) => setIdentifiant(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                  Mot de passe*
                </label>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black",
                    inputWrapper:
                      "bg-white border-gray-300 hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="password"
                  placeholder="Saisis ton mot de passe"
                  size="lg"
                  type="password"
                  value={password}
                  variant="bordered"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-gray-800 text-white hover:bg-gray-700"
                color="default"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            {message && (
              <div className="mt-4 p-3 rounded-md text-sm text-center">
                {message.includes("Erreur") ? (
                  <p className="text-red-600">{message}</p>
                ) : (
                  <p className="text-blue-600">{message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
