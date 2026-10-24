# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Razorpay payments

The backend requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in its environment. For local development, these can be set in `backend/.env` or `backend/.env.razorpay.local`; both files are ignored by Git. The frontend uses only `VITE_RAZORPAY_KEY_ID`, configured in `frontend/.env.development.local`. Keep the frontend key ID paired with the backend key pair, and never expose the secret to the frontend.

Set `VITE_API_URL` to the backend API base URL ending in `/api`, then run the backend with `cd backend && npm start` and the frontend with `cd frontend && npm run dev`. Sign in, open a course, and use its checkout button to test the Razorpay modal. Test orders require a course price of at least INR 1 and an authenticated user.

For deployment, configure the matching live Razorpay key ID and secret as server-side environment variables, and expose only the live key ID to the frontend build.
