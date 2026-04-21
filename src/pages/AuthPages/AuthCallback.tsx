import { useEffect } from 'react';

/**
 * OAuth callback page — handles Microsoft OAuth popup redirect.
 * Extracts the access_token from the URL fragment and sends it
 * back to the opener window, then closes.
 */
const AuthCallback = () => {
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (error) {
            // If opened as popup, close automatically
            if (window.opener) {
                window.close();
            }
            return;
        }

        // The popup polling in LoginPage will read the URL and extract the token
        // This page just needs to exist as the redirect target
        // If not in a popup, redirect to login
        if (!window.opener) {
            window.location.href = accessToken ? '/dashboard' : '/login';
        }
    }, []);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
