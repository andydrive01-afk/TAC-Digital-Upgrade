import { db } from "@workspace/db";
import { heroes, plans, coverageCities, siteConfig, apps, stores } from "@workspace/db";
import { count } from "drizzle-orm";

let seeded = false;

export async function seedDefaultData() {
  if (seeded) return;
  seeded = true;

  const [heroCount] = await db.select({ c: count() }).from(heroes);
  if ((heroCount?.c ?? 0) === 0) {
    await db.insert(heroes).values([
      {
        badge: "Até 1 Giga de Velocidade",
        title: "Internet fibra óptica de",
        titleHighlight: "verdade",
        subtitle: "em Jaguaruna e região",
        imageUrl: "",
        ctaPrimary: "Ver Planos",
        ctaPrimaryHref: "/#planos",
        ctaSecondary: "Consultar Cobertura",
        ctaSecondaryHref: "/#cobertura",
        order: 0,
        active: true,
      },
    ]);
  }

  const [planCount] = await db.select({ c: count() }).from(plans);
  if ((planCount?.c ?? 0) === 0) {
    await db.insert(plans).values([
      { tab: "fibra", name: "Fibra 400 Mega", speed: "400", price: "89", priceCents: "90", badge: "", isFeatured: false, icons: ["wifi","speed","support24","install24"], features: ["Streaming HD sem travar","Wi-Fi incluso","Suporte 24h","Instalação em até 24h"], planKey: "fibra400", order: 0, active: true },
      { tab: "fibra", name: "Fibra 600 Mega", speed: "600", price: "99", priceCents: "90", badge: "", isFeatured: false, icons: ["wifi6","streaming4k","support24","install24"], features: ["Streaming 4K","Wi-Fi 6","Suporte 24h","Instalação prioritária"], planKey: "fibra600", order: 1, active: true },
      { tab: "fibra", name: "Fibra 800 Mega", speed: "800", price: "109", priceCents: "90", badge: "MAIS CONTRATADO", isFeatured: true, icons: ["wifi6","streaming4k","homeoffice","gaming"], features: ["Streaming 4K+","Wi-Fi 6 AX","Home office de alta performance","Gaming sem lag"], planKey: "fibra800", order: 2, active: true },
      { tab: "fibra", name: "Fibra 1 Giga", speed: "1000", price: "119", priceCents: "90", badge: "", isFeatured: false, icons: ["speed","multidevice","wifi6","support24"], features: ["Velocidade máxima","Múltiplos dispositivos simultâneos","Wi-Fi 6 AX incluso","Suporte VIP 24h"], planKey: "fibra1g", order: 3, active: true },
      { tab: "tv", name: "TAC TV Essencial", speed: "400", price: "119", priceCents: "90", badge: "", isFeatured: false, icons: ["tv","channels","wifi","support24"], features: ["Canais ao vivo","400 Mega fibra incluso","Suporte 24h","Instalação em até 24h"], planKey: "tv400", order: 0, active: true },
      { tab: "tv", name: "TAC TV Plus", speed: "600", price: "139", priceCents: "90", badge: "MAIS POPULAR", isFeatured: true, icons: ["tv","channels","premium","wifi6"], features: ["Mais canais ao vivo","600 Mega fibra incluso","Conteúdo premium","Suporte VIP 24h"], planKey: "tv600", order: 1, active: true },
      { tab: "tv", name: "TAC TV Premium", speed: "1000", price: "169", priceCents: "90", badge: "", isFeatured: false, icons: ["tv","premium","wifi6","support24"], features: ["Canais premium + esportes","1 Giga fibra incluso","Wi-Fi 6 AX incluso","Suporte VIP 24h"], planKey: "tv1g", order: 2, active: true },
    ]);
  }

  const [cityCount] = await db.select({ c: count() }).from(coverageCities);
  if ((cityCount?.c ?? 0) === 0) {
    await db.insert(coverageCities).values([
      { name: "Jaguaruna", state: "SC", active: true, order: 0 },
      { name: "Tubarão", state: "SC", active: true, order: 1 },
      { name: "Criciúma", state: "SC", active: true, order: 2 },
      { name: "Laguna", state: "SC", active: true, order: 3 },
      { name: "Imbituba", state: "SC", active: true, order: 4 },
      { name: "Içara", state: "SC", active: true, order: 5 },
      { name: "Sangão", state: "SC", active: true, order: 6 },
      { name: "Pedras Grandes", state: "SC", active: true, order: 7 },
    ]);
  }

  const configRows = await db.select().from(siteConfig);
  if (configRows.length === 0) {
    await db.insert(siteConfig).values([
      { key: "google_places_api_key", value: "" },
      { key: "google_place_search_query", value: "TAC Telecom Jaguaruna SC" },
      { key: "google_place_id", value: "" },
      { key: "logo_url", value: "" },
      { key: "favicon_url", value: "" },
    ]);
  }

  const [storeCount] = await db.select({ c: count() }).from(stores);
  if ((storeCount?.c ?? 0) === 0) {
    await db.insert(stores).values([
      { name: "Matriz Jaguaruna",        address: "Rua Engenheiro Annes Gualberto, 1236 — Centro", city: "Jaguaruna — SC",        lat: "-28.6146",     lng: "-49.0256",     mapsUrl: "https://www.google.com/maps?q=-28.6146,-49.0256",                                                                                                                                                  order: 0, active: true },
      { name: "Unidade Içara",           address: "Rodovia SC-445, 4810 — Centro",                 city: "Içara — SC",            lat: "-28.7118",     lng: "-49.3032",     mapsUrl: "https://www.google.com/maps?q=-28.7118,-49.3032",                                                                                                                                                  order: 1, active: true },
      { name: "Unidade Morro da Fumaça", address: "R. Pref. Virgínio Maccari, 126 — Centro",       city: "Morro da Fumaça — SC",  lat: "-28.653284",   lng: "-49.209999",   mapsUrl: "https://www.google.com/maps?q=-28.653284,-49.209999",                                                                                                                                              order: 2, active: true },
      { name: "Unidade Balneário Rincão",address: "Av. Leoberto Leal, 327 — Centro",               city: "Balneário Rincão — SC", lat: "-28.822521",   lng: "-49.222919",   mapsUrl: "https://www.google.com/maps/place/28%C2%B049'21.1%22S+49%C2%B013'22.5%22W/@-28.8225212,-49.2251082,17z",                                                                                      order: 3, active: true },
      { name: "Unidade Sangão",          address: "R. João José Silvano — Morro Grande",           city: "Sangão — SC",           lat: "-28.668840",   lng: "-49.106110",   mapsUrl: "https://www.google.com/maps/place/28%C2%B040'07.8%22S+49%C2%B006'22.0%22W/@-28.6688404,-49.1082983,17z",                                                                                      order: 4, active: true },
      { name: "Unidade Treze de Maio",   address: "R. Ademar Ghisi",                               city: "Treze de Maio — SC",    lat: "-28.558813",   lng: "-49.149606",   mapsUrl: "https://www.google.com/maps/place/28%C2%B033'31.7%22S+49%C2%B008'58.6%22W/@-28.558813,-49.1517947,17z",                                                                                      order: 5, active: true },
      { name: "Unidade Bal. Esplanada",  address: "R. Antônio Lima, S/N — Balneário Esplanada",   city: "Jaguaruna — SC",        lat: "-28.559253",   lng: "-49.186591",   mapsUrl: "https://maps.google.com/?cid=17105075346311767577&hl=pt-BR&gl=BR",                                                                                                                              order: 6, active: true },
      { name: "Unidade Bal. Campo Bom",  address: "R. José Cândido Coelho — Balneário Campo Bom", city: "Jaguaruna — SC",        lat: "-28.831110",   lng: "-49.234690",   mapsUrl: "https://maps.google.com/?cid=7982292855595746525&hl=pt-BR&gl=BR",                                                                                                                               order: 7, active: true },
      { name: "Unidade Bal. Camacho",    address: "Rodovia Claudino Abel Botega — Bal. Camacho",  city: "Jaguaruna — SC",        lat: "-28.474635",   lng: "-49.030991",   mapsUrl: "https://maps.google.com/?cid=12227651356689930108&hl=pt-BR&gl=BR",                                                                                                                              order: 8, active: true },
    ]);
  }

  const [appCount] = await db.select({ c: count() }).from(apps);
  if ((appCount?.c ?? 0) === 0) {
    await db.insert(apps).values([
      { name: "Disney+",   description: "Filmes e séries Disney, Marvel, Star Wars e National Geographic.", iconUrl: "", url: "https://www.disneyplus.com/pt-br", order: 0, active: true },
      { name: "Max",       description: "Séries originais, filmes e conteúdo HBO, DC e Warner Bros.", iconUrl: "", url: "https://play.max.com/pt-br",            order: 1, active: true },
      { name: "Looke",     description: "Streaming nacional com filmes brasileiros e produções independentes.", iconUrl: "", url: "https://www.looke.com.br",      order: 2, active: true },
      { name: "Deezer",    description: "Música streaming com mais de 90 milhões de músicas e podcasts.", iconUrl: "", url: "https://www.deezer.com/br",            order: 3, active: true },
      { name: "ExitLag",   description: "Otimizador de conexão para gamers — reduz ping e lag em jogos online.", iconUrl: "", url: "https://www.exitlag.com",      order: 4, active: true },
      { name: "Globoplay", description: "Novelas, jornalismo, séries e filmes da Globo sob demanda.", iconUrl: "", url: "https://globoplay.globo.com",              order: 5, active: true },
    ]);
  }
}
