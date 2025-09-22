"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import MessageAlert from "@/components/message-alert";
import { FormLabel } from "@/components/form-label";
import { isUserLoggedIn } from "@/utils/auth";

export default function SignupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("error");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    nom: string;
    prenom: string;
    email: string;
    villes: { id: string; ville: string }[];
  } | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("q");

  // Vérifier si l'utilisateur est déjà connecté et le rediriger
  useEffect(() => {
    if (isUserLoggedIn()) {
      router.push("/home");
    }
  }, [router]);

  // Valider le token et récupérer les informations de l'utilisateur
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setMessage("Token manquant. Veuillez utiliser le lien reçu par email.");
        setMessageType("error");
        setIsValidatingToken(false);

        return;
      }

      try {
        const res = await fetch("/api/collaborateurs/validate_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setUserInfo({
            nom: data.nom || "",
            prenom: data.prenom || "",
            email: data.email || "",
            villes: data.villes || [],
          });
          setIsValidatingToken(false);
        } else {
          setMessage(data.error || "Token invalide ou expiré");
          setMessageType("error");
          setIsValidatingToken(false);
        }
      } catch {
        setMessage("Erreur lors de la validation du token");
        setMessageType("error");
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const showMessageWithType = (msg: string, type: "error" | "success" | "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre minuscule";
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre majuscule";
    }

    if (!/(?=.*\d)/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Validation des mots de passe
    if (password !== confirmPassword) {
      showMessageWithType("Les mots de passe ne correspondent pas", "error");
      setIsLoading(false);

      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      showMessageWithType(passwordError, "error");
      setIsLoading(false);

      return;
    }

    try {
      const res = await fetch("/api/collaborateurs/set_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessageWithType("Mot de passe initialisé avec succès ! Redirection...", "success");

        // Rediriger vers la page de login après 2 secondes
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        let errorMessage = "Erreur lors de l'initialisation du mot de passe";

        if (data.error) {
          if (data.error.includes("Invalid token")) {
            errorMessage = "Token invalide ou expiré";
          } else if (data.error.includes("Token expired")) {
            errorMessage = "Le lien a expiré. Veuillez demander un nouveau lien";
          } else {
            errorMessage = data.error;
          }
        }
        showMessageWithType(errorMessage, "error");
      }
    } catch {
      showMessageWithType("Erreur de connexion au serveur. Vérifiez votre connexion internet.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Validation du token en cours...</p>
        </div>
      </div>
    );
  }

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
            className="h-30 w-auto"
            src="/images/logo.png"
          />
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-page-bg px-6 ">
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 ">
                Bonjour {userInfo.prenom} {userInfo.nom} !
              </h1>
              {userInfo && (
                <div className="mb-4">
                  {userInfo.villes && userInfo.villes.length > 0 && (

                    <p className="text-lg text-gray-700 mb-1">
                      {userInfo.villes.length === 1 ? 'Ville EPICU' : 'Villes EPICU'} : {userInfo.villes.map(v => v.ville).join(", ")}
                    </p>)}
                  <p className="text-sm text-gray-600 mb-2">
                    {userInfo.email}
                  </p>

                </div>
              )}
              <p className=" text-sm pl-8 pr-8 font-light">
                Veuillez définir votre mot de passe pour finaliser votre inscription
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <FormLabel htmlFor="password" isRequired={true}>
                  Nouveau mot de passe
                </FormLabel>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black text-sm ",
                    inputWrapper:
                      "bg-page-bg hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="password"
                  placeholder="Saisissez votre nouveau mot de passe"
                  size="lg"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 caractères, avec majuscule, minuscule et chiffre
                </p>
              </div>

              <div>
                <FormLabel htmlFor="confirmPassword" isRequired={true}>
                  Confirmer le mot de passe
                </FormLabel>
                <Input
                  required
                  classNames={{
                    input: "bg-white text-black text-sm ",
                    inputWrapper:
                      "bg-page-bg hover:border-gray-400 focus-within:border-gray-500",
                  }}
                  id="confirmPassword"
                  placeholder="Confirmez votre mot de passe"
                  size="lg"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                color="primary"
                isDisabled={!password || !confirmPassword}
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? "Initialisation..." : "Initialiser le mot de passe"}
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
