import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, uploadCv } from '../lib/api';
import { Toast } from '../components/Toast';
import { DashboardLayout } from '../components/DashboardLayout';
export const CandidateProfile = () => {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState({
        message: null,
        type: 'ok',
    });
    const profileQuery = useQuery({
        queryKey: ['candidate-profile'],
        queryFn: () => api.get('/candidates/profile'),
        refetchInterval: 15_000,
    });
    const updateProfileMutation = useMutation({
        mutationFn: (payload) => api.put('/candidates/profile', payload),
        onSuccess: async () => {
            setToast({ message: 'Profil enregistré', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                setToast({ message: error.message, type: 'error' });
                return;
            }
            setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
        },
    });
    const uploadMutation = useMutation({
        mutationFn: (file) => uploadCv(file),
        onSuccess: async () => {
            setToast({ message: 'CV téléchargé', type: 'ok' });
            await queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
        },
        onError: () => setToast({ message: 'Fichier invalide (PDF/DOCX, max 5MB)', type: 'error' }),
    });
    const profile = profileQuery.data?.profile;
    const onSubmitProfile = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await updateProfileMutation.mutateAsync({
            fullName: String(formData.get('fullName') ?? ''),
            position: String(formData.get('position') ?? ''),
            experienceYears: Number(formData.get('experienceYears') ?? 0),
            skills: String(formData.get('skills') ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
        });
    };
    return (_jsxs(DashboardLayout, { title: "Mon Profil", children: [_jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\uD83D\uDC64 Profil Candidat" }) }), _jsxs("div", { className: "profile-card", children: [_jsx("div", { className: "profile-card__avatar", children: profile?.fullName?.[0]?.toUpperCase() ?? '👤' }), _jsx("h3", { className: "profile-card__name", children: profile?.fullName ?? 'Candidat' }), _jsx("p", { className: "profile-card__subtitle", children: profile?.position ?? 'Poste non défini' }), _jsxs("p", { className: "profile-card__subtitle", style: { marginTop: 8 }, children: ["\uD83D\uDCC5 ", profile?.experienceYears ?? 0, " ans d'exp\u00E9rience"] }), profile?.skills && profile.skills.length > 0 && (_jsx("div", { className: "skills-list", style: { marginTop: 16 }, children: profile.skills.slice(0, 6).map((skill, idx) => (_jsx("span", { className: "skill-tag", children: skill }, idx))) })), _jsxs("div", { className: "cv-upload-section", children: [_jsx("label", { className: "form-label", children: "\uD83D\uDCC4 CV" }), profile?.cvPath ? (_jsxs("div", { className: "cv-status cv-status--uploaded", children: [_jsx("span", { children: "\u2705 CV t\u00E9l\u00E9charg\u00E9" }), _jsx("a", { href: `/api${profile.cvPath}`, target: "_blank", rel: "noopener noreferrer", className: "btn btn--ghost btn--sm", children: "Voir" })] })) : (_jsx("p", { className: "text-muted", style: { marginBottom: 8 }, children: "Aucun CV t\u00E9l\u00E9charg\u00E9" })), _jsxs("div", { className: "cv-upload-wrapper", children: [_jsx("input", { type: "file", id: "candidate-cv-upload", accept: ".pdf,.doc,.docx", className: "cv-upload-input", onChange: (event) => {
                                                            const file = event.target.files?.[0];
                                                            if (file)
                                                                void uploadMutation.mutateAsync(file);
                                                        } }), _jsxs("label", { htmlFor: "candidate-cv-upload", className: "cv-upload-btn", children: [_jsx("span", { className: "cv-upload-btn__icon", children: "\uD83D\uDCE4" }), _jsx("span", { className: "cv-upload-btn__text", children: profile?.cvPath ? 'Remplacer le CV' : 'Télécharger un CV' }), _jsx("span", { className: "cv-upload-btn__hint", children: "PDF, DOC, DOCX (max 5MB)" })] })] })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card__header", children: _jsx("h2", { className: "card__title", children: "\u270F\uFE0F Mettre \u00E0 jour" }) }), _jsxs("form", { onSubmit: onSubmitProfile, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Nom complet" }), _jsx("input", { name: "fullName", className: "form-input", defaultValue: profile?.fullName ?? '', required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Poste" }), _jsx("input", { name: "position", className: "form-input", defaultValue: profile?.position ?? '', required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Ann\u00E9es d'exp\u00E9rience" }), _jsx("input", { name: "experienceYears", type: "number", className: "form-input", defaultValue: profile?.experienceYears ?? 0, min: 0, max: 60, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Comp\u00E9tences (s\u00E9par\u00E9es par virgule)" }), _jsx("input", { name: "skills", className: "form-input", defaultValue: profile?.skills?.join(', ') ?? '', required: true })] }), _jsx("button", { type: "submit", className: "btn btn--primary", disabled: updateProfileMutation.isPending, children: updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer' })] })] })] }), _jsx(Toast, { message: toast.message, type: toast.type })] }));
};
