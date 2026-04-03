import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import sevinroLogo from "@/assets/sevinro-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img src={sevinroLogo} alt="Sevinro Distributors" className="h-20 object-contain" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-[hsl(35,90%,65%)] hover:bg-[hsl(35,90%,55%)] text-white font-semibold"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}
