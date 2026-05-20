'use client';

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildLocalizedPathname,
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
} from "@/lib/i18n";
import { langs } from "@/utils/langs";




const AppBarComponent = () => {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryLocale = searchParams?.get("lang");
  const [currentLang, setCurrentLang] = React.useState<SupportedLocale>(DEFAULT_LOCALE);
  const [selectedLang, setSelectedLang] = React.useState("한국어");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const pathLang = getLocaleFromPathname(pathname) || currentLang;
  const adminClearanceHistoryPath = `/${pathLang}/admin/clearance-history`;
  const adminOrderClearanceManagementPath = `/${pathLang}/admin/clearance-management`;
  const adminClearanceManagementPath = `/${pathLang}/admin/store/clearance-management`;
  const isAdminPath = pathname?.startsWith(`/${pathLang}/admin`) || false;
  const isAdminClearanceHistoryPath =
    pathname?.startsWith(adminClearanceHistoryPath) || false;
  const isAdminOrderClearanceManagementPath =
    pathname?.startsWith(adminOrderClearanceManagementPath) || false;
  const isAdminClearanceManagementPath =
    pathname?.startsWith(adminClearanceManagementPath) || false;
  const labels = currentLang === "en"
    ? {
        clearanceHistory: "Clearance History",
        clearanceManagement: "Clearance Management",
        storeClearanceManagement: "Store Clearance",
      }
    : {
        clearanceHistory: "청산내역",
        clearanceManagement: "청산관리",
        storeClearanceManagement: "가맹점 청산관리",
      };

  React.useEffect(() => {
    const nextLang =
      getLocaleFromPathname(pathname) ||
      (isSupportedLocale(queryLocale) ? queryLocale : null) ||
      DEFAULT_LOCALE;
    const nextLangConfig = langs.find((l) => l.lang === nextLang);

    setCurrentLang(nextLang);
    setSelectedLang(nextLangConfig?.fullName || "한국어");
  }, [pathname, queryLocale]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const setGoogleTranslateLocale = (locale: SupportedLocale) => {
    if (locale === "en") {
      document.cookie = "googtrans=/ko/en; path=/; max-age=31536000; SameSite=Lax";
      return;
    }

    document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  };



  function handleLangChange({ lang, fullName }: (typeof langs)[number]) {
    const nextPathname = buildLocalizedPathname(pathname, lang);
    const nextSearchParams = new URLSearchParams(searchParams?.toString());

    document.cookie = `${LOCALE_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    setGoogleTranslateLocale(lang);

    if (getLocaleFromPathname(nextPathname)) {
      nextSearchParams.delete("lang");
    } else {
      nextSearchParams.set("lang", lang);
    }

    const queryString = nextSearchParams.toString();
    const nextUrl = `${nextPathname}${queryString ? `?${queryString}` : ""}`;

    setSelectedLang(fullName);
    handleClose();

    window.location.assign(nextUrl);
  }

  return (
    <AppBar className=" px-4 sm:px-16 md:px-24" position="static" sx={{ height: "50px" }}>
      <Toolbar disableGutters sx={{ "&.MuiToolbar-root": { minHeight: "50px", height: "50px" } }}>
        
        <div className=" flex flex-row justify-between w-full items-center">
          
          {/*
          <Link href="/">
            <div className="flex flex-row">
              <Typography sx={{ color: "#fff" }}>LOGO</Typography>
            </div>
          </Link>
          */}

          <div className="w-[140px] sm:w-[250px] flex flex-row justify-between items-center">
            <div className="notranslate" translate="no">
              <Button
                size="small"
                aria-label="change lang button"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                style={{ color: "#fff" }}
                color="inherit"
              >
                {selectedLang}
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                aria-label="Languages list"
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {langs.map((lang) => (
                  <MenuItem
                    key={lang.lang}
                    selected={currentLang === lang.lang}
                    onClick={() => handleLangChange(lang)}
                  >
                    {lang.fullName}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>

          {isAdminPath && (
            <div className="flex items-center gap-2 overflow-x-auto pl-3">
              <Button
                size="small"
                onClick={() => router.push(adminClearanceHistoryPath)}
                sx={{
                  color: "#fff",
                  borderColor: isAdminClearanceHistoryPath
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.35)",
                  backgroundColor: isAdminClearanceHistoryPath
                    ? "rgba(255,255,255,0.18)"
                    : "transparent",
                  borderRadius: "9999px",
                  px: 1.75,
                  py: 0.5,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.75)",
                    backgroundColor: "rgba(255,255,255,0.12)",
                  },
                }}
                variant="outlined"
              >
                {labels.clearanceHistory}
              </Button>

              <Button
                size="small"
                onClick={() => router.push(adminOrderClearanceManagementPath)}
                sx={{
                  color: "#fff",
                  borderColor: isAdminOrderClearanceManagementPath
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.35)",
                  backgroundColor: isAdminOrderClearanceManagementPath
                    ? "rgba(255,255,255,0.18)"
                    : "transparent",
                  borderRadius: "9999px",
                  px: 1.75,
                  py: 0.5,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.75)",
                    backgroundColor: "rgba(255,255,255,0.12)",
                  },
                }}
                variant="outlined"
              >
                {labels.clearanceManagement}
              </Button>

              <Button
                size="small"
                onClick={() => router.push(adminClearanceManagementPath)}
                sx={{
                  color: "#fff",
                  borderColor: isAdminClearanceManagementPath
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.35)",
                  backgroundColor: isAdminClearanceManagementPath
                    ? "rgba(255,255,255,0.18)"
                    : "transparent",
                  borderRadius: "9999px",
                  px: 1.75,
                  py: 0.5,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.75)",
                    backgroundColor: "rgba(255,255,255,0.12)",
                  },
                }}
                variant="outlined"
              >
                {labels.storeClearanceManagement}
              </Button>
            </div>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

AppBarComponent.displayName = "AppBarComponent";

export default AppBarComponent;
