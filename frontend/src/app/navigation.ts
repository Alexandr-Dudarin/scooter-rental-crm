export type Section = "overview" | "scooters" | "rentals";

export const sectionPaths: Record<Section, string> = {
  overview: "/overview",
  scooters: "/scooters",
  rentals: "/rentals"
};

export const sectionTitles: Record<
  Section,
  { title: string; subtitle: string }
> = {
  overview: {
    title: "Добрый день",
    subtitle: "Вот что происходит с вашим парком сегодня."
  },
  scooters: {
    title: "Самокаты",
    subtitle: "Управляйте техникой, зарядом и состоянием парка."
  },
  rentals: {
    title: "Аренды",
    subtitle: "Следите за активными поездками и историей аренд."
  }
};

export function sectionFromPath(pathname: string): Section {
  const match = Object.entries(sectionPaths).find(([, path]) => path === pathname);
  return (match?.[0] as Section | undefined) ?? "overview";
}
