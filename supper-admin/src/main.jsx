import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryProvider } from "./providers/QueryProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <QueryProvider>
            <App />
        </QueryProvider>
    </React.StrictMode>
);

// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import App from "./App.jsx";
// import "./index.css";
// createRoot(document.getElementById("root")).render(
//     <StrictMode>
//         <App />
//     </StrictMode>
// );
