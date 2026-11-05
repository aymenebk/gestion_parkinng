import React, { createContext, useContext, useMemo, useState } from "react";
import { I18nManager } from "react-native";
import { Lang } from "./types";
import { getStrings } from "./i18n";

type Strings = ReturnType<typeof getStrings>;
interface LangValue { lang: Lang; T: Strings; isAr: boolean; toggle: () => void }

const Ctx = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const value = useMemo<LangValue>(() => ({
    lang,
    T: getStrings(lang),
    isAr: lang === "ar",
    toggle: () => setLang(l => (l === "fr" ? "ar" : "fr")),
  }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used inside <LangProvider>");
  return v;
}

/** Layout direction is mirrored per component (no app restart needed), so the native RTL flag is forced off. */
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

/** `flexDirection: "row"` that mirrors in Arabic. */
export const rowDir = (isAr: boolean) => (isAr ? "row-reverse" : "row") as "row" | "row-reverse";
export const textAlign = (isAr: boolean) => (isAr ? "right" : "left") as "right" | "left";
