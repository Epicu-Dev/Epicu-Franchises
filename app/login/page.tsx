"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import MessageAlert from "@/components/message-alert";
import { FormLabel } from "@/components/form-label";
import { isUserLoggedIn } from "@/utils/auth";

export default function LoginPage() {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("error");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Vérifier si l'utilisateur est déjà connecté et le rediriger
  useEffect(() => {
    if (isUserLoggedIn()) {
      router.push("/home");
    }
  }, [router]);

  // Appel de préchauffage Airtable en arrière-plan dès l'arrivée sur la page
  useEffect(() => {
    const warmupAirtable = async () => {
      try {
        // Appel en arrière-plan sans attendre ni afficher d'erreur à l'utilisateur
        fetch("/api/warmup", { method: "GET" })
          .catch(() => {
            // On ignore silencieusement les erreurs de préchauffage
            // L'important est que le premier appel "réel" soit plus rapide
          });
      } catch (error) {
        // Ignore silencieusement les erreurs de préchauffage
      }
    };

    warmupAirtable();
  }, []);

  const showMessageWithType = (msg: string, type: "error" | "success" | "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

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
        
        // Stocker les données utilisateur pour éviter le problème de "utilisateur inconnu"
        localStorage.setItem("userProfile", JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          firstname: data.user.firstname,
          lastname: data.user.lastname,
          role: data.user.role,
          villes: data.user.villes,
          telephone: "",
          identifier: ""
        }));
        localStorage.setItem("userProfileCacheTime", Date.now().toString());
        
        showMessageWithType("Connexion réussie ! Redirection...", "success");
        setTimeout(() => {
          router.push("/home");
        }, 1500);
      } else {
        // Gestion des erreurs spécifiques
        let errorMessage = "Erreur de connexion";

        if (data.message) {
          if (data.message.includes("Invalid credentials") || data.message.includes("Invalid email or password")) {
            errorMessage = "Identifiant ou mot de passe incorrect";
          } else if (data.message.includes("User not found")) {
            errorMessage = "Aucun compte trouvé avec cet identifiant";
          } else if (data.message.includes("Account locked")) {
            errorMessage = "Compte temporairement verrouillé";
          } else if (data.message.includes("Too many attempts")) {
            errorMessage = "Trop de tentatives. Réessayez plus tard";
          } else {
            errorMessage = data.message;
          }
        }
        showMessageWithType(errorMessage, "error");
      }
    } catch (error) {
      showMessageWithType("Erreur de connexion au serveur. Vérifiez votre connexion internet.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-primary">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/login.png')`,
          }}
        />
        {/* Logo Epicu en bas à gauche */}
        <div className="absolute bottom-8 left-8">
          <img
            alt="Logo Epicu"
            className="h-30 w-auto "
            src="/images/logo.png"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-page-bg px-6 ">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 ">
                Bienvenue !
              </h1>
              <p className=" text-sm pl-8 pr-8 font-light">
                Votre réseau réuni ici pour vous aider à prendre les meilleures
                décisions
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <FormLabel htmlFor="identifiant" isRequired={true}>
                  Identifiant
                </FormLabel>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black text-sm ",
                    inputWrapper:
                      "bg-page-bg hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="identifiant"
                  placeholder="Saisis ton identifiant"
                  size="lg"
                  type="text"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                />
              </div>
              <div>
                <FormLabel htmlFor="password" isRequired={true}>
                  Mot de passe
                </FormLabel>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black text-sm ",
                    inputWrapper:
                      "bg-page-bg hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="password"
                  placeholder="Saisis ton mot de passe"
                  size="lg"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full "
                color="primary"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            {/* Message d'erreur/succès amélioré */}
            {message && (
              <MessageAlert
                autoHide={messageType === "success"}
                className="mt-6"
                message={message}
                type={messageType}
                onClose={() => setMessage("")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
