// Azure AD B2C Authentication Configuration
import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "6fda041e-3e0d-4b6f-89f2-a4ff42f5e529",
    authority: "https://martinjensen9988gmail.b2clogin.com/f7326d70-6d3a-42ce-9791-421a31a4a768/B2C_1_SignUpSignIn",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        if (level === LogLevel.Error) {
          console.error(message);
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Wait for MSAL to initialize
msalInstance.initialize();
