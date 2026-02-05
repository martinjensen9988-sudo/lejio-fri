// Azure AD B2C Authentication Hook
import { useMsal } from "@azure/msal-react";
import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
}

export const useAzureAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (inProgress === "none") {
      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        setUser({
          id: account.localAccountId || account.homeAccountId,
          email: account.username || "",
          name: account.name || account.username || "",
          isAuthenticated: true,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [accounts, inProgress]);

  const login = useCallback(async () => {
    try {
      await instance.loginPopup({
        scopes: ["openid", "profile", "email"],
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [instance]);

  const logout = useCallback(async () => {
    try {
      await instance.logoutPopup({
        mainWindowRedirectUri: "/",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [instance]);

  const getAccessToken = useCallback(async () => {
    try {
      const response = await instance.acquireTokenSilent({
        account: accounts[0],
        scopes: ["openid", "profile", "email"],
      });
      return response.accessToken;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }, [instance, accounts]);

  return {
    user,
    loading,
    isAuthenticated: user?.isAuthenticated || false,
    login,
    logout,
    getAccessToken,
  };
};
