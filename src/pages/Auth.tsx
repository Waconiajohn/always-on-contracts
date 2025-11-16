import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Rate limiting state
  const loginAttemptsRef = useRef<{ count: number; timestamp: number }>({ count: 0, timestamp: Date.now() });
  const MAX_LOGIN_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Defer vault check to avoid blocking auth state changes
        setTimeout(async () => {
          try {
            const { data: vault, error } = await supabase
              .from('career_vault')
              .select('resume_raw_text, review_completion_percentage')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error checking vault:', error);
              // If error, default to onboarding
              navigate("/career-vault");
              return;
            }
            
            // If vault exists and has resume, go to home, otherwise start onboarding
            navigate(vault?.resume_raw_text ? "/home" : "/career-vault");
          } catch (err) {
            console.error('Unexpected error:', err);
            navigate("/career-vault");
          }
        }, 0);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTimeout(async () => {
          try {
            const { data: vault, error } = await supabase
              .from('career_vault')
              .select('resume_raw_text, review_completion_percentage')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error checking vault:', error);
              navigate("/career-vault");
              return;
            }
            
            navigate(vault?.resume_raw_text ? "/home" : "/career-vault");
          } catch (err) {
            console.error('Unexpected error:', err);
            navigate("/career-vault");
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side password validation for signup
    if (!isLogin) {
      if (password.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for basic password requirements
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        toast({
          title: "Weak password",
          description: "Password should contain uppercase, lowercase, and numbers for better security.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Rate limiting check for login attempts
    if (isLogin) {
      const now = Date.now();
      const timeSinceFirstAttempt = now - loginAttemptsRef.current.timestamp;
      
      // Reset counter if window has passed
      if (timeSinceFirstAttempt > RATE_LIMIT_WINDOW) {
        loginAttemptsRef.current = { count: 0, timestamp: now };
      }
      
      // Check if rate limit exceeded
      if (loginAttemptsRef.current.count >= MAX_LOGIN_ATTEMPTS) {
        const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceFirstAttempt) / 60000);
        toast({
          title: "Too many attempts",
          description: `Please wait ${remainingTime} minutes before trying again.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Increment failed login attempts
          loginAttemptsRef.current.count += 1;
          throw error;
        }
        
        // Reset on successful login
        loginAttemptsRef.current = { count: 0, timestamp: Date.now() };
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        
        // Send welcome email for new signups
        if (data?.user) {
          try {
            const { sendOnboardingEmail } = await import("@/services/onboardingEmailService");
            await sendOnboardingEmail("welcome", {
              userId: data.user.id,
              email: data.user.email!,
              firstName: fullName?.split(" ")[0] || null,
              appUrl: window.location.origin,
              senderName: "First Source Team",
            });
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't block signup if email fails
          }
        }
        
        toast({
          title: "Account created!",
          description: "You can now sign in to your account.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl text-center">
            {isLogin ? "Welcome Back" : "Get Started"}
          </CardTitle>
          <CardDescription className="text-center text-lg">
            {isLogin
              ? "Sign in to access your career intelligence platform"
              : "Join mid-career and executive professionals turning experience into advantage"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="text-lg h-12"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {!isLogin && "(minimum 8 characters)"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="text-lg h-12"
              />
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>
            <Button
              type="submit"
              className="w-full text-lg h-12"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-lg"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
