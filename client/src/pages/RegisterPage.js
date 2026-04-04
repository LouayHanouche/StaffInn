import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Toast } from '../components/Toast';
export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [role, setRole] = useState('CANDIDATE');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hotelName, setHotelName] = useState('');
    const [fullName, setFullName] = useState('');
    const [toast, setToast] = useState(null);
    const onSubmit = async (event) => {
        event.preventDefault();
        setToast(null);
        try {
            await register({
                role,
                email,
                password,
                hotelName: role === 'HOTEL' ? hotelName : undefined,
                fullName: role === 'CANDIDATE' ? fullName : undefined,
            });
            navigate('/');
        }
        catch (error) {
            if (error instanceof ApiError) {
                setToast(error.message);
                return;
            }
            setToast('Échec de l\'inscription, veuillez réessayer.');
        }
    };
    return (_jsxs("div", { className: "login-page", children: [_jsxs("aside", { className: "login-sidebar", children: [_jsx("div", { className: "login-logo", children: _jsx("img", { src: "/logo.svg", alt: "StaffInn", className: "login-logo__image" }) }), _jsx("p", { className: "login-tagline", children: "Rejoignez la plateforme" })] }), _jsxs("div", { className: "login-form-container", children: [_jsxs("div", { className: "login-form-header", children: [_jsx("img", { src: "/logo.svg", alt: "StaffInn", className: "login-form-logo" }), _jsx("h1", { className: "login-form-title", children: "Cr\u00E9er un compte" }), _jsx("p", { className: "login-form-subtitle", children: "Commencez votre parcours" })] }), _jsxs("form", { className: "login-form", onSubmit: onSubmit, children: [_jsxs("div", { className: "role-toggle", style: { marginTop: 0, marginBottom: 24 }, children: [_jsx("button", { type: "button", className: `role-toggle__btn ${role === 'CANDIDATE' ? 'role-toggle__btn--active' : ''}`, onClick: () => setRole('CANDIDATE'), children: "Candidat" }), _jsx("button", { type: "button", className: `role-toggle__btn ${role === 'HOTEL' ? 'role-toggle__btn--active' : ''}`, onClick: () => setRole('HOTEL'), children: "Recruteur" })] }), role === 'CANDIDATE' && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Nom complet" }), _jsx("input", { type: "text", className: "form-input", value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Jean Dupont", required: true })] })), role === 'HOTEL' && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Nom de l'h\u00F4tel" }), _jsx("input", { type: "text", className: "form-input", value: hotelName, onChange: (e) => setHotelName(e.target.value), placeholder: "H\u00F4tel Le Magnifique", required: true })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Adresse Email" }), _jsx("input", { type: "email", className: "form-input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "votre@email.com", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Mot de Passe" }), _jsx("input", { type: "password", className: "form-input", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Minimum 10 caract\u00E8res", required: true, minLength: 10 })] }), _jsx("button", { type: "submit", className: "btn btn--secondary", children: "S'inscrire" }), _jsxs("div", { className: "login-links", children: [_jsx("span", { className: "login-links__text", children: "D\u00E9j\u00E0 inscrit ?" }), _jsx(Link, { to: "/login", className: "login-links__link", children: "Se connecter" })] })] })] }), _jsx(Toast, { message: toast, type: "error" })] }));
};
