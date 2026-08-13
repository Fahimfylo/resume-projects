import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AOS from "aos";
import "aos/dist/aos.css";

AOS.init({
  duration: 800,
  offset: 100,
  once: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000 },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <SnackbarProvider
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SnackbarProvider>
    </Provider>
  </StrictMode>
);
