import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Toast } from '../components/Toast';
export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const onSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        }
        catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Échec de la connexion, veuillez réessayer.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "login-page", children: [_jsxs("aside", { className: "login-sidebar", children: [_jsx("div", { className: "login-logo", children: _jsx("img", { src: "/logo.svg", alt: "StaffInn", className: "login-logo__image" }) }), _jsx("p", { className: "login-tagline", children: "Plateforme de recrutement pour l'h\u00F4tellerie et le tourisme" }), _jsxs("div", { className: "login-features", children: [_jsxs("div", { className: "login-feature", children: [_jsx("span", { className: "login-feature__icon", children: "\uD83C\uDFE8" }), _jsx("span", { children: "Trouvez les meilleurs talents" })] }), _jsxs("div", { className: "login-feature", children: [_jsx("span", { className: "login-feature__icon", children: "\uD83D\uDC65" }), _jsx("span", { children: "G\u00E9rez vos candidatures" })] }), _jsxs("div", { className: "login-feature", children: [_jsx("span", { className: "login-feature__icon", children: "\uD83D\uDCCB" }), _jsx("span", { children: "Publiez vos offres" })] })] })] }), _jsxs("div", { className: "login-form-container", children: [_jsxs("div", { className: "login-form-header", children: [_jsx("img", { src: "/logo.svg", alt: "StaffInn", className: "login-form-logo" }), _jsx("h1", { className: "login-form-title", children: "Connexion" }), _jsx("p", { className: "login-form-subtitle", children: "Connectez-vous \u00E0 votre espace personnel" })] }), _jsxs("form", { className: "login-form", onSubmit: onSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Adresse Email" }), _jsx("input", { type: "email", className: "form-input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "votre@email.com", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Mot de Passe" }), _jsx("input", { type: "password", className: "form-input", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 10 })] }), _jsx("button", { type: "submit", className: "btn btn--primary btn--lg", disabled: isLoading, children: isLoading ? 'Connexion...' : 'Se Connecter' }), _jsxs("div", { className: "login-links", children: [_jsx("span", { className: "login-links__text", children: "Pas encore de compte ?" }), _jsx(Link, { to: "/register", className: "login-links__link", children: "Cr\u00E9er un compte" })] })] })] }), _jsx(Toast, { message: errorMessage, type: "error" })] }));
};
