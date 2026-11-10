// Shared by the server layout (boot script) and the client theme hooks, so no "use client" here.
export const THEME_KEY = "sap-theme";

// Portals only: public pages (login, registration, verification) always stay light.
export const THEMED_PATH = /^\/(admin|tp|aa|sna|lcrc|toa-assessor|toa)(\/|$)/;

// Runs in <head> before the first paint so a dark portal never flashes light.
export const THEME_BOOT_SCRIPT = `try{if(${THEMED_PATH}.test(location.pathname)&&localStorage.getItem("${THEME_KEY}")==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}}catch(e){}`;
