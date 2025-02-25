import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
	<StrictMode>
		{/* React Query Wrapper */}
		<QueryClientProvider client={queryClient}>
			{/* Plan Provider Wrapper (useContext) */}
			<App />

			<Toaster
				position="top-right"
				toastOptions={{
					// Define default options
					className: "",
					duration: 2000,
					style: {
						background: "#000",
						color: "#fff",
						fontWeight: "bold",
					},
				}}
			/>
		</QueryClientProvider>
	</StrictMode>,
);
