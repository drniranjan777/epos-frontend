import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Do not retry client errors (validation, permission, not found).
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton duration={3500} />
    </QueryClientProvider>
  );
}
