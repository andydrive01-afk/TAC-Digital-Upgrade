import { db } from "@workspace/db";
import { heroes, plans, coverageCities, siteConfig, apps, stores } from "@workspace/db";
import { count } from "drizzle-orm";

let seeded = false;
let seedingPromise: Promise<void> | null = null;

export async function seedDefaultData() {
  if (seeded) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = _doSeed().finally(() => {
    seedingPromise = null;
  });
  return seedingPromise;
}

async function _doSeed() {
  if (seeded) return;

  try {
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
        // ── Fibra ──────────────────────────────────────────────────────────────
        { tab: "fibra", name: "Plano Essencial",    speed: "550",  price: "109", priceCents: "90", badge: "",               isFeatured: false, icons: ["wifi6","install24","tv","support24"],    features: ["550 MB de internet","Instalação GRÁTIS","Wi-Fi 6 comodato","TAC TV + TAC Music (aplicativos)","Suporte 24h","1 cabeamento até 15m"],                                       bonusIds: [], planKey: "fibra-essencial", order: 0, active: true },
        { tab: "fibra", name: "Plano Família",       speed: "650",  price: "119", priceCents: "90", badge: "MAIS CONTRATADO", isFeatured: true,  icons: ["wifi6","tv","streaming","install24"],    features: ["650 MB de internet","Instalação grátis","Roteador Wi-Fi Premium","TAC PLAY — TV ao vivo no celular","Deezer — músicas sem anúncios","Looke — séries e filmes"],             bonusIds: [], planKey: "fibra-familia",   order: 1, active: true },
        { tab: "fibra", name: "Plano TAC Indica",    speed: "700",  price: "129", priceCents: "90", badge: "",               isFeatured: false, icons: ["wifi6","tv","gaming","install24"],       features: ["700 MB de internet","Instalação grátis","Roteador Wi-Fi Premium","TAC PLAY — TV ao vivo no celular","ExitLag — jogue sem travamentos","+1 aplicativo de sua escolha"],     bonusIds: [], planKey: "fibra-indica",    order: 2, active: true },
        { tab: "fibra", name: "Plano Casa Completa", speed: "800",  price: "149", priceCents: "90", badge: "",               isFeatured: false, icons: ["wifi6","tv","streaming","homeoffice"],   features: ["800 MB de internet","Instalação grátis","Roteador Wi-Fi Premium","TAC PLAY — TV ao vivo no celular","Deezer — músicas sem anúncios","Looke — séries e filmes"],             bonusIds: [], planKey: "fibra-casa",      order: 3, active: true },
        { tab: "fibra", name: "Plano Empresa",       speed: "650",  price: "159", priceCents: "90", badge: "",               isFeatured: false, icons: ["upload","support24","install24","wifi6"], features: ["650 MB de internet","Instalação grátis","2 roteadores Wi-Fi Premium","Suporte premium prioritário","70% de velocidade de upload","Visita técnica em até 8h úteis"],      bonusIds: [], planKey: "fibra-empresa",   order: 4, active: true },
        { tab: "fibra", name: "Plano Premium",       speed: "1000", price: "199", priceCents: "90", badge: "",               isFeatured: false, icons: ["wifi6","tv","streaming","support24"],    features: ["1.000 MB de internet","Instalação GRÁTIS","Wi-Fi 6 comodato","TAC TV + Looke + Deezer + MAX","Suporte 24h","2 cabeamentos até 15m cada"],                                 bonusIds: [], planKey: "fibra-premium",   order: 5, active: true },
        // ── TAC TV ─────────────────────────────────────────────────────────────
        { tab: "tv", name: "TV Life Line",   speed: "0", price: "",    priceCents: "",   badge: "CONSULTE-NOS", isFeatured: false, icons: ["tv","channels"],                       features: ["Consulte Taxa de Instalação","Disponível em até 4 Pontos","+De 40 Canais"],  bonusIds: [], planKey: "tv-lifeline", order: 0, active: true },
        { tab: "tv", name: "TV Start HD",    speed: "0", price: "79",  priceCents: "90", badge: "",             isFeatured: false, icons: ["tv","channels","install24"],            features: ["Instalação Grátis (1 Ponto)","Disponível em até 4 Pontos","+De 60 Canais"], bonusIds: [], planKey: "tv-start",    order: 1, active: true },
        { tab: "tv", name: "TV Top HD",      speed: "0", price: "119", priceCents: "90", badge: "MAIS POPULAR", isFeatured: true,  icons: ["tv","channels","premium","install24"],  features: ["Instalação Grátis (2 Pontos)","Disponível em até 4 Pontos","+De 90 Canais"], bonusIds: [], planKey: "tv-top",     order: 2, active: true },
        { tab: "tv", name: "TV Premium HD",  speed: "0", price: "149", priceCents: "90", badge: "",             isFeatured: false, icons: ["tv","premium","channels","install24"],  features: ["Instalação Grátis (2 Pontos)","Disponível em até 4 Pontos","+De 110 Canais"],bonusIds: [], planKey: "tv-premium", order: 3, active: true },
        { tab: "tv", name: "TV Plus HD",     speed: "0", price: "209", priceCents: "70", badge: "",             isFeatured: false, icons: ["tv","premium","channels","install24"],  features: ["Instalação Grátis","Disponível em até 4 Pontos","Toda Grade de Canais Disponível"], bonusIds: [], planKey: "tv-plus", order: 4, active: true },
        // ── Telefonia ──────────────────────────────────────────────────────────
        { tab: "telefone", name: "50 Minutos",  speed: "50",  price: "29", priceCents: "90", badge: "",             isFeatured: false, icons: ["phone","support24"], features: ["50 minutos","Fixo e móvel do Brasil","Identificador de chamadas","Portabilidade gratuita"],  bonusIds: [], planKey: "tel-50",        order: 0, active: true },
        { tab: "telefone", name: "150 Minutos", speed: "150", price: "39", priceCents: "90", badge: "",             isFeatured: false, icons: ["phone","support24"], features: ["150 minutos","Fixo e móvel do Brasil","Identificador de chamadas","Portabilidade gratuita"], bonusIds: [], planKey: "tel-150",       order: 1, active: true },
        { tab: "telefone", name: "300 Minutos", speed: "300", price: "49", priceCents: "90", badge: "MAIS POPULAR", isFeatured: true,  icons: ["phone","support24"], features: ["300 minutos","Fixo e móvel do Brasil","Identificador de chamadas","Portabilidade gratuita"], bonusIds: [], planKey: "tel-300",       order: 2, active: true },
        { tab: "telefone", name: "Ilimitado",   speed: "0",   price: "59", priceCents: "90", badge: "",             isFeatured: false, icons: ["phone","support24"], features: ["Minutos ilimitados","Fixo e móvel do Brasil","Identificador de chamadas","Portabilidade gratuita"], bonusIds: [], planKey: "tel-ilimitado", order: 3, active: true },
      ]);
    }

    const [cityCount] = await db.select({ c: count() }).from(coverageCities);
    if ((cityCount?.c ?? 0) === 0) {
      await db.insert(coverageCities).values([
        { name: "Jaguaruna",        state: "SC", active: true, order: 0 },
        { name: "Içara",            state: "SC", active: true, order: 1 },
        { name: "Morro da Fumaça",  state: "SC", active: true, order: 2 },
        { name: "Sangão",           state: "SC", active: true, order: 3 },
        { name: "Treze de Maio",    state: "SC", active: true, order: 4 },
        { name: "Balneário Rincão", state: "SC", active: true, order: 5 },
      ]);
    }

    const configRows = await db.select().from(siteConfig);
    if (configRows.length === 0) {
      await db.insert(siteConfig).values([
        { key: "google_places_api_key",     value: "" },
        { key: "google_place_search_query", value: "TAC Telecom Jaguaruna SC" },
        { key: "google_place_id",           value: "" },
        { key: "logo_url",                  value: "" },
        { key: "favicon_url",               value: "" },
        { key: "stat_1_value",              value: "20.000+" },
        { key: "stat_1_label",              value: "Clientes" },
        { key: "stat_2_value",              value: "99.8%" },
        { key: "stat_2_label",              value: "Uptime" },
        { key: "stat_3_value",              value: "+20" },
        { key: "stat_3_label",              value: "Anos no Mercado" },
        { key: "stat_4_value",              value: "6" },
        { key: "stat_4_label",              value: "Cidades Atendidas" },
      ]);
    }

    const [storeCount] = await db.select({ c: count() }).from(stores);
    if ((storeCount?.c ?? 0) === 0) {
      await db.insert(stores).values([
        { name: "Matriz Jaguaruna",         address: "Rua Engenheiro Annes Gualberto, 1236 — Centro", city: "Jaguaruna — SC",        lat: "-28.6146",   lng: "-49.0256",   mapsUrl: "https://www.google.com/maps?q=-28.6146,-49.0256",                                                                         order: 0, active: true },
        { name: "Unidade Içara",            address: "Rodovia SC-445, 4810 — Centro",                 city: "Içara — SC",            lat: "-28.7118",   lng: "-49.3032",   mapsUrl: "https://www.google.com/maps?q=-28.7118,-49.3032",                                                                         order: 1, active: true },
        { name: "Unidade Morro da Fumaça",  address: "R. Pref. Virgínio Maccari, 126 — Centro",       city: "Morro da Fumaça — SC",  lat: "-28.653284", lng: "-49.209999", mapsUrl: "https://www.google.com/maps?q=-28.653284,-49.209999",                                                                     order: 2, active: true },
        { name: "Unidade Balneário Rincão", address: "Av. Leoberto Leal, 327 — Centro",               city: "Balneário Rincão — SC", lat: "-28.822521", lng: "-49.222919", mapsUrl: "https://www.google.com/maps/place/28%C2%B049'21.1%22S+49%C2%B013'22.5%22W/@-28.8225212,-49.2251082,17z",              order: 3, active: true },
        { name: "Unidade Sangão",           address: "R. João José Silvano — Morro Grande",           city: "Sangão — SC",           lat: "-28.668840", lng: "-49.106110", mapsUrl: "https://www.google.com/maps/place/28%C2%B040'07.8%22S+49%C2%B006'22.0%22W/@-28.6688404,-49.1082983,17z",              order: 4, active: true },
        { name: "Unidade Treze de Maio",    address: "R. Ademar Ghisi",                               city: "Treze de Maio — SC",    lat: "-28.558813", lng: "-49.149606", mapsUrl: "https://www.google.com/maps/place/28%C2%B033'31.7%22S+49%C2%B008'58.6%22W/@-28.558813,-49.1517947,17z",              order: 5, active: true },
        { name: "Unidade Bal. Esplanada",   address: "R. Antônio Lima, S/N — Balneário Esplanada",   city: "Jaguaruna — SC",        lat: "-28.760296", lng: "-49.127131", mapsUrl: "https://maps.google.com/?cid=17105075346311767577&hl=pt-BR&gl=BR",                                                      order: 6, active: true },
        { name: "Unidade Bal. Campo Bom",   address: "R. José Cândido Coelho — Balneário Campo Bom", city: "Jaguaruna — SC",        lat: "-28.719285", lng: "-49.060878", mapsUrl: "https://maps.google.com/?cid=7982292855595746525&hl=pt-BR&gl=BR",                                                       order: 7, active: true },
        { name: "Unidade Bal. Camacho",     address: "Rodovia Claudino Abel Botega — Bal. Camacho",  city: "Jaguaruna — SC",        lat: "-28.612224", lng: "-48.869418", mapsUrl: "https://maps.google.com/?cid=12227651356689930108&hl=pt-BR&gl=BR",                                                      order: 8, active: true },
      ]);
    }

    const [appCount] = await db.select({ c: count() }).from(apps);
    if ((appCount?.c ?? 0) === 0) {
      await db.insert(apps).values([
        { name: "Disney+",   description: "Filmes e séries Disney, Marvel, Star Wars e National Geographic.",       iconUrl: "", url: "https://www.disneyplus.com/pt-br", order: 0, active: true },
        { name: "Max",       description: "Séries originais, filmes e conteúdo HBO, DC e Warner Bros.",            iconUrl: "", url: "https://play.max.com/pt-br",        order: 1, active: true },
        { name: "Looke",     description: "Streaming nacional com filmes brasileiros e produções independentes.",   iconUrl: "", url: "https://www.looke.com.br",           order: 2, active: true },
        { name: "Deezer",    description: "Música streaming com mais de 90 milhões de músicas e podcasts.",        iconUrl: "", url: "https://www.deezer.com/br",           order: 3, active: true },
        { name: "ExitLag",   description: "Otimizador de conexão para gamers — reduz ping e lag em jogos online.", iconUrl: "", url: "https://www.exitlag.com",            order: 4, active: true },
        { name: "Globoplay", description: "Novelas, jornalismo, séries e filmes da Globo sob demanda.",            iconUrl: "", url: "https://globoplay.globo.com",         order: 5, active: true },
      ]);
    }

    // Mark as seeded only after all operations complete successfully
    seeded = true;
  } catch (err) {
    // MySQL error 1146 = ER_NO_SUCH_TABLE — tables haven't been created yet
    // (setup-db hasn't been called). seeded stays false so the next request retries.
    const mysqlCode = (err as { code?: string; errno?: number })?.code ?? "";
    const mysqlErrno = (err as { errno?: number })?.errno ?? 0;
    if (mysqlCode === "ER_NO_SUCH_TABLE" || mysqlErrno === 1146) {
      // debug-level: expected before first setup-db call
      return;
    }
    throw err;
  }
}
