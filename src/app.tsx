import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Component, Suspense } from "solid-js";
import "./app.css";
import { inject } from "@vercel/analytics";
import { getCookie } from "vinxi/http";
import { isServer } from "solid-js/web";
import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from "@kobalte/core";

const getServerCookies = () => {
  "use server"
  const colorMode = getCookie("kb-color-mode");
  return colorMode ? `kb-color-mode=${colorMode}` : "";
};

const App: Component = () => {
  inject();

  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <Router
      root={(props) => (
        <>
          <ColorModeScript storageType={storageManager.type} />
          <ColorModeProvider storageManager={storageManager}>
            <Suspense>{props.children}</Suspense>
          </ColorModeProvider>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
};

export default App;
