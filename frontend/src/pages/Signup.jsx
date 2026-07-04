import React, { useState } from "react";
import { ShieldPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { initializePayment } from "../services/payment.js";

import InputField from "../components/InputField.jsx";
import AccountCreationForm from "../components/AccountCreationForm.jsx";
import PharmacyDetailsForm from "../components/PharmacyDetailsForm.jsx";
import BusinessLocationForm from "../components/BusinessLocationForm.jsx";
import SubscriptionSelectionForm from "../components/SubscriptionSelectionForm.jsx";
import DocumentUploadForm from "../components/DocumentUploadForm.jsx";
import TermsAndConfirmationForm from "./TermsAndConfirmationForm.jsx";

const Signup = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [localError, setLocalError] = useState("");
    const [localLoading, setLocalLoading] = useState(false);
    const [isPhoneFocused, setIsPhoneFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        pharmacyName: "",
        licenseNumber: "",
        taxId: "",
        pharmacyType: "Retail",
        address: {
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "Ethiopia"
        },
        businessEmail: "",
        businessPhone: "",
        website: "",
        selectedTier: "starter",
        billingCycle: "monthly",
        documents: { pharmacyLicense: null, pharmacistLicense: null },
        acceptTerms: false,
        acceptPrivacy: false,
        newsletter: false
    });

    const {
        createAccount,
        finalizeRegistration,
        user,
        loading: authLoading,
        error: authError
    } = useAuth();
    const { t } = useSettings();
    const navigate = useNavigate();

    const updateField = (field, value) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const updateAddress = (field, value) =>
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));

    const nextStep = () => {
        setLocalError("");
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setLocalError("");
        setCurrentStep(prev => prev - 1);
    };

    const handlePhoneChange = e => {
        let value = e.target.value;
        if (value.startsWith("+251")) value = value.substring(4);
        else if (value.startsWith("0")) value = value.substring(1);
        updateField("phone", value);
    };

    const handleStepOneSubmit = async e => {
        e.preventDefault();
        setLocalError("");
        setLocalLoading(true);
        try {
            if (!formData.name.trim()) throw new Error("Name is required");
            if (!formData.phone.trim())
                throw new Error("Phone number is required");
            if (!/^9\d{8}$/.test(formData.phone))
                throw new Error("Invalid Ethiopian phone number");
            if (formData.password !== formData.confirmPassword)
                throw new Error("Passwords do not match");
            if (formData.password.length < 6)
                throw new Error("Password must be at least 6 characters");

            await createAccount(
                formData.email,
                formData.password,
                formData.name,
                formData.phone
            );
            nextStep();
        } catch (error) {
            setLocalError(error.message || "Authentication failed");
        } finally {
            setLocalLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setLocalError("");
        setLocalLoading(true);
        try {
            if (!formData.acceptTerms) {
                throw new Error(
                    "You must accept the Terms of Service to continue"
                );
            }

            const payload = {
                pharmacyData: { ...formData },
                subscriptionData: { ...formData },
                documents: { ...formData.documents }
            };

            const result = await finalizeRegistration(payload);
            const newPharmacyId = result.pharmacyId;

            const { checkoutUrl, txRef } = await initializePayment(
                formData.billingCycle
            );

            sessionStorage.setItem("pending_payment_txRef", txRef);
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error(error);
            setLocalError(error.message || "Registration failed");
        } finally {
            if (!window.location.href.includes("checkout")) {
                setLocalLoading(false);
            }
        }
    };

    const displayError = localError || authError;
    const isLoading = localLoading || authLoading;

    return (
        <div
            className="min-h-screen flex flex-col md:flex-row bg-slate-50"
            style={{ fontFamily: "'Lexend', sans-serif" }}
        >
            {" "}
            {/* 📱 MOBILE HEADER (Visible only on small screens) */}
            <div className="md:hidden bg-gradient-to-br from-teal-600 to-teal-500 text-white p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <ShieldPlus size={28} />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight">
                        PharmaCare
                    </span>
                </div>
                <p className="text-sm opacity-90">Modern Pharmacy Solutions</p>
            </div>
            {/* 💻 LEFT SIDE - BRANDING (Desktop only) */}
            <div className="hidden md:flex md:flex-[1.2] bg-gradient-to-br from-teal-600 to-teal-500 flex-col justify-center p-16 lg:p-24 text-white relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full"></div>

                <div className="flex items-center gap-4 mb-12 relative">
                    <div className="bg-white/20 p-3 rounded-2xl shadow-lg">
                        <ShieldPlus size={40} />
                    </div>
                    <span className="text-4xl font-extrabold tracking-tight">
                        PharmaCare
                    </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-8 relative">
                    Modern <br /> Pharmacy <br /> Solutions.
                </h1>

                <p className="text-xl opacity-90 max-w-md leading-relaxed relative">
                    Simplified inventory management with real-time tracking,
                    glowing analytics, and a vibrant user experience.
                </p>

                <div className="mt-16 flex gap-6 relative">
                    <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
                        <div className="font-bold text-2xl">99.9%</div>
                        <div className="text-sm opacity-80">Accuracy Rate</div>
                    </div>
                    <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
                        <div className="font-bold text-2xl">24/7</div>
                        <div className="text-sm opacity-80">Real-time Sync</div>
                    </div>
                </div>
            </div>
            {/* 🔐 RIGHT SIDE - FORM */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16 overflow-y-auto">
                <div className="w-full max-w-xl py-8">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5, 6].map(step => (
                            <div
                                key={step}
                                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                    step <= currentStep
                                        ? "bg-teal-600"
                                        : "bg-slate-200"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 rounded-2xl border border-red-100">
                            <AlertCircle
                                size={20}
                                className="text-red-600 mt-0.5 flex-shrink-0"
                            />
                            <div className="text-red-800 text-sm leading-relaxed">
                                {displayError}
                            </div>
                        </div>
                    )}

                    {/* Render Current Step */}
                    {currentStep === 1 && (
                        <AccountCreationForm
                            formData={formData}
                            updateField={updateField}
                            handlePhoneChange={handlePhoneChange}
                            isPhoneFocused={isPhoneFocused}
                            setIsPhoneFocused={setIsPhoneFocused}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            showConfirmPassword={showConfirmPassword}
                            setShowConfirmPassword={setShowConfirmPassword}
                            onSubmit={handleStepOneSubmit}
                            isLoading={isLoading}
                        />
                    )}
                    {currentStep === 2 && (
                        <PharmacyDetailsForm
                            formData={formData}
                            updateField={updateField}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 3 && (
                        <BusinessLocationForm
                            formData={formData}
                            updateField={updateField}
                            updateAddress={updateAddress}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 4 && (
                        <SubscriptionSelectionForm
                            formData={formData}
                            updateField={updateField}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 5 && (
                        <DocumentUploadForm
                            formData={formData}
                            updateField={updateField}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 6 && (
                        <TermsAndConfirmationForm
                            formData={formData}
                            updateField={updateField}
                            onSubmit={handleFinalSubmit}
                            onBack={prevStep}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Footer Nav */}
                    <div className="text-center mt-12 text-slate-500 text-base">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-teal-600 font-bold hover:text-teal-700 transition ml-1"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
