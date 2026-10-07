export type ShellFace = "open" | "closed";

export const TOTAL_SHELLS = 16;

export const SIGNS = [
  { opened: 0, name: "Opira", slug: "opira" },
  { opened: 1, name: "Okanran", slug: "okanran" },
  { opened: 2, name: "Eji Oko", slug: "eji-oko" },
  { opened: 3, name: "Ogunda", slug: "ogunda" },
  { opened: 4, name: "Irosun", slug: "irosun" },
  { opened: 5, name: "Ose", slug: "ose" },
  { opened: 6, name: "Obara", slug: "obara" },
  { opened: 7, name: "Odi", slug: "odi" },
  { opened: 8, name: "Eji Ogbe", slug: "eji-ogbe" },
  { opened: 9, name: "Osa", slug: "osa" },
  { opened: 10, name: "Ofun", slug: "ofun" },
  { opened: 11, name: "Owonrin", slug: "owonrin" },
  { opened: 12, name: "Ejila Sebora", slug: "ejila-sebora" },
  { opened: 13, name: "Ika", slug: "ika" },
  { opened: 14, name: "Oturupon", slug: "oturupon" },
  { opened: 15, name: "Ofun Kanran", slug: "ofun-kanran" },
  { opened: 16, name: "Irete", slug: "irete" },
] as const;

export const DOMAINS = [
  "Vie, longévité et protection",
  "Santé, maladie et rétablissement",
  "Argent, prospérité et dettes",
  "Travail, emploi et carrière",
  "Activité, commerce, entreprise et projet",
  "Études, examen et formation",
  "Mariage, couple et relation",
  "Enfant, grossesse et descendance",
  "Famille, proches et ancêtres",
  "Logement, terrain et lieu de vie",
  "Voyage, déplacement et migration",
  "Conflit, ennemis et rivalité",
  "Justice, litige et démarches administratives",
  "Perte, vol, fraude et trahison",
  "Réussite, fonction, honneur et reconnaissance",
  "Choix, décision et changement important",
  "Paix, stabilité et équilibre personnel",
  "Vie spirituelle, destinée et obligations traditionnelles",
  "Situation générale ou autre préoccupation",
] as const;

export function secureRandom(maxExclusive: number) {
  if (maxExclusive <= 0) return 0;
  const maxUint = 0x100000000;
  const limit = maxUint - (maxUint % maxExclusive);
  const sample = new Uint32Array(1);
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return sample[0] % maxExclusive;
}

export function secureShuffle<T>(values: readonly T[]) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = secureRandom(index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function createHiddenGrid() {
  const faces: ShellFace[] = [
    ...Array<ShellFace>(8).fill("open"),
    ...Array<ShellFace>(8).fill("closed"),
  ];
  const labels = secureShuffle(Array.from({ length: TOTAL_SHELLS }, (_, index) => index + 1));
  return secureShuffle(faces).map((face, index) => ({ id: `${labels[index]}-${index}`, label: labels[index], face }));
}
