import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import logo from "../assets/logo.png";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const store = useDashboardStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'none' | 'email' | 'otp' | 'password'>('none');
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const getErrorMessage = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === "string") return err;
    
    const errMsg = err.message || "";
    const errStr = JSON.stringify(err);
    if (
      err.status === 504 || 
      errMsg.includes("504") || 
      errStr.includes("504") || 
      errStr.toLowerCase().includes("timeout") ||
      errStr === "{}"
    ) {
      return "Gateway Timeout (504). Your Supabase project timed out trying to send a confirmation email. Please disable 'Confirm email' under Authentication -> Providers -> Email in your Supabase dashboard to bypass email confirmation.";
    }

    return errMsg || "An error occurred. Please try again.";
  };

  const handleSubmit = async () => {
    if (forgotPasswordStep === 'email') {
      if (!email) {
        setError("Please enter your email address.");
        return;
      }
    } else if (forgotPasswordStep === 'otp') {
      if (!otp || otp.length !== 6) {
        setError("Please enter the 6-digit OTP code.");
        return;
      }
    } else if (forgotPasswordStep === 'password') {
      if (!newPassword || newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    } else if (isOtpMode) {
      if (!otp || otp.length !== 6) {
        setError("Please enter the 6-digit OTP code.");
        return;
      }
    } else if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (forgotPasswordStep === 'email') {
      const { error: apiError } = await supabase.auth.resetPasswordForEmail(email);
      if (apiError) {
        setError(getErrorMessage(apiError));
      } else {
        setForgotPasswordStep('otp');
        setSuccessMessage("Verification code sent to your email.");
      }
    } else if (forgotPasswordStep === 'otp') {
      if (typeof (store as any).setRecoveringPassword === 'function') {
        (store as any).setRecoveringPassword(true);
      }
      const { data, error: apiError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });
      if (apiError) {
        setError(getErrorMessage(apiError));
        if (typeof (store as any).setRecoveringPassword === 'function') {
          (store as any).setRecoveringPassword(false);
        }
      } else {
        setTempToken(data.session?.access_token || null);
        setForgotPasswordStep('password');
        setSuccessMessage("Code verified! Please enter your new password.");
      }
    } else if (forgotPasswordStep === 'password') {
      const { data, error: apiError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (apiError) {
        setError(getErrorMessage(apiError));
      } else {
        if (typeof (store as any).setRecoveringPassword === 'function') {
          (store as any).setRecoveringPassword(false);
        }
        if (data.user) {
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || "User",
          };
          let token = tempToken;
          if (!token) {
            const { data: sessionData } = await supabase.auth.getSession();
            token = sessionData.session?.access_token || "";
          }
          store.setAuth(userObj, token);
          onSuccess();
        } else {
          setForgotPasswordStep('none');
          setIsLogin(true);
          setSuccessMessage("Password reset successful! Please log in with your new password.");
        }
      }
    } else if (isOtpMode) {
      const { data, error: apiError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      
      if (apiError) {
        setError(getErrorMessage(apiError));
        setIsLoading(false);
        return;
      }

      if (data.session && data.user) {
        // Create user object matching existing store expectation
        const userObj = {
          email: data.user.email,
          name: data.user.user_metadata?.full_name || name,
        };
        store.setAuth(userObj, data.session.access_token);
        onSuccess();
      }
    } else if (isLogin) {
      const { data, error: apiError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (apiError) {
        const msg = getErrorMessage(apiError);
        if (msg.toLowerCase().includes("email not confirmed")) {
          // Send OTP again if not confirmed
          const res = await supabase.auth.resend({
            type: 'signup',
            email,
          });
          if (res.error) {
            setError(getErrorMessage(res.error));
          } else {
            setIsOtpMode(true);
            setSuccessMessage("Verification code resent to your email.");
          }
        } else {
          setError(msg);
        }
        setIsLoading(false);
        return;
      }

      if (data.session && data.user) {
        const userObj = {
          email: data.user.email,
          name: data.user.user_metadata?.full_name || "User",
        };
        store.setAuth(userObj, data.session.access_token);
        onSuccess();
      }
    } else {
      if (!name) {
        setError("Please provide your full name.");
        setIsLoading(false);
        return;
      }
      
      const { data, error: apiError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (apiError) {
        setError(getErrorMessage(apiError));
      } else if (data.session && data.user) {
        // If email confirmation is disabled in Supabase, we get a session immediately!
        const userObj = {
          email: data.user.email,
          name: data.user.user_metadata?.full_name || name,
        };
        store.setAuth(userObj, data.session.access_token);
        onSuccess();
      } else {
        setIsOtpMode(true);
        setSuccessMessage("Registration successful! Please check your email for the verification code.");
      }
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (resendError) {
      setError(getErrorMessage(resendError));
    } else {
      setSuccessMessage("Verification code resent!");
    }
    setIsLoading(false);
  };

  const handleResendForgotPasswordOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    const { error: resendError } = await supabase.auth.resetPasswordForEmail(email);
    
    if (resendError) {
      setError(getErrorMessage(resendError));
    } else {
      setSuccessMessage("Verification code resent!");
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Brand Header */}
        <View style={styles.headerContainer}>
          <Image
            source={typeof logo === "string" ? { uri: logo } : logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>EduSync</Text>
          <Text style={styles.brandSubtitle}>Your intelligent learning companion</Text>
        </View>

        {/* Input Card Container */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {forgotPasswordStep === 'email'
              ? "Reset Password"
              : forgotPasswordStep === 'otp'
              ? "Enter Reset Code"
              : forgotPasswordStep === 'password'
              ? "Set New Password"
              : isOtpMode
              ? "Verify Email"
              : isLogin
              ? "Welcome Back"
              : "Create Account"}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {successMessage && (
            <View style={[styles.errorContainer, { backgroundColor: "#ecfdf5" }]}>
              <Feather name="check-circle" size={14} color="#10b981" />
              <Text style={[styles.errorText, { color: "#10b981" }]}>{successMessage}</Text>
            </View>
          )}

          {forgotPasswordStep === 'email' ? (
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : forgotPasswordStep === 'otp' ? (
            <View style={styles.inputContainer}>
              <Feather name="key" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="6-Digit OTP Code"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          ) : forgotPasswordStep === 'password' ? (
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Feather
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={18}
                  color="#94a3b8"
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
          ) : isOtpMode ? (
            <View style={styles.inputContainer}>
              <Feather name="key" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="6-Digit OTP Code"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          ) : (
            <>

            {/* Full Name Input (Signup Mode Only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full name"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email Address Input */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color="#94a3b8"
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>

          {/* Forgot Password Link / Resend Code Links */}
          {forgotPasswordStep === 'none' && !isOtpMode && isLogin && (
            <TouchableOpacity 
              onPress={() => {
                setError(null);
                setSuccessMessage(null);
                setForgotPasswordStep('email');
              }}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {forgotPasswordStep === 'otp' && (
            <TouchableOpacity onPress={handleResendForgotPasswordOtp} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Resend Code</Text>
            </TouchableOpacity>
          )}

          {isOtpMode && forgotPasswordStep === 'none' && (
            <TouchableOpacity onPress={handleResendOtp} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Resend Code</Text>
            </TouchableOpacity>
          )}

          </>
          )}

          {/* Action Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#8b5cf6", "#6366f1"]} // Soft Violet-500 to Indigo-500
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {forgotPasswordStep === 'email'
                      ? "Send Reset Code"
                      : forgotPasswordStep === 'otp'
                      ? "Verify Code"
                      : forgotPasswordStep === 'password'
                      ? "Update Password"
                      : isOtpMode
                      ? "Verify Account"
                      : isLogin
                      ? "Sign In"
                      : "Sign Up"}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" style={styles.arrowIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Toggle between Login and Signup */}
        {forgotPasswordStep === 'none' && !isOtpMode && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.footerLink}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {(isOtpMode || forgotPasswordStep !== 'none') && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => {
              if (typeof (store as any).setRecoveringPassword === 'function') {
                (store as any).setRecoveringPassword(false);
              }
              setIsOtpMode(false);
              setForgotPasswordStep('none');
              setError(null);
              setSuccessMessage(null);
            }}>
              <Text style={styles.footerLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Slate-50 matching the screenshot background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 48,
    width: "100%",
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 22,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.25)",
      },
    }),
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a", // Slate-900
    fontFamily: "System",
    marginBottom: 6,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b", // Slate-500
    fontFamily: "System",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
      },
    }),
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "System",
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc", // Soft Slate-50 matching the screenshot input box
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
    ...Platform.select({
      web: {
        outlineStyle: "none",
        outlineWidth: 0,
        borderWidth: 0,
      },
    }),
  },
  eyeIcon: {
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#6366f1", // Soft Indigo
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "System",
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    ...Platform.select({
      web: {
        display: "flex",
      },
    }),
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
    marginRight: 6,
  },
  arrowIcon: {
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "System",
  },
  footerLink: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
});
