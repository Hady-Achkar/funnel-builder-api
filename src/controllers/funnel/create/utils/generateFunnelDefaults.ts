import { Funnel } from "../../../../generated/prisma-client";

interface FunnelDefaults {
  name: Pick<Funnel, "name">["name"];
  slug: Pick<Funnel, "slug">["slug"];
}

const generateRandomCode = (length: number = 4): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const generateFunnelDefaults = (
  providedName?: Pick<Funnel, "name">["name"],
  providedSlug?: Pick<Funnel, "slug">["slug"]
): FunnelDefaults => {
  let finalName = providedName;
  if (!finalName) {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear().toString().slice(-2);
    const randomCode = generateRandomCode(4);

    finalName = `Funnel-${day}_${month}_${year}-${randomCode}`;
  }

  const finalSlug = providedSlug || generateSlugFromName(finalName);

  return {
    name: finalName,
    slug: finalSlug,
  };
};
