export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameLenPlus = (name.length + 1);
  return document.cookie
    .split(';')
    .map(c => c.trim())
    .filter(cookie => {
      return cookie.substring(0, nameLenPlus) === `${name}=`;
    })
    .map(cookie => {
      return decodeURIComponent(cookie.substring(nameLenPlus));
    })[0] || null;
};

export const setCookie = (name: string, val: string, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (val || "") + expires + "; path=/; SameSite=Strict";
};

export const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
