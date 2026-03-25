/**
 * Main entry point for Tomato Planner
 * Initializes the application and mounts the root component
 */

import "./styles/tailwind.css";
import "./components/app/tomato-planner-app.js";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (!appRoot) {
    throw new Error("App root element not found");
  }

  // Mount the Lit app component
  const app = document.createElement("tomato-planner-app");
  appRoot.appendChild(app);

  console.log("🍅 Tomato Planner initialized");
});
