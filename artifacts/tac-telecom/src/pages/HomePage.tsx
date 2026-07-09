import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Zap, Headphones, Radio, Wifi, MessageCircle, Phone, Star,
  ChevronLeft, ChevronRight, MapPin, ExternalLink,
  Play, User, Menu, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WHATSAPP_LINK = "https://wa.me/554836600800";

// ── Static fallbacks (used while loading or on API error) ────────────────────
const STATIC_CITIES = [
  "Jaguaruna", "Tubarão", "Criciúma", "Laguna", "Imbituba", "Içara", "Sangão", "Pedras Grandes",
];

const STATIC_REVIEWS = [
  { authorName: "Carlos Mendes", authorPhoto: "", rating: 5, text: "Melhor internet que já tive em Jaguaruna. O pessoal instalou no mesmo dia que pedi e o ping nos jogos é muito baixo.", relativeTime: "" },
  { authorName: "Ana Paula Santos", authorPhoto: "", rating: 5, text: "Suporte maravilhoso! Uma vez deu problema na minha rua e o técnico estava aqui em menos de uma hora. Vale cada centavo.", relativeTime: "" },
  { authorName: "Ricardo Oliveira", authorPhoto: "", rating: 5, text: "Trabalho em home office em Tubarão e precisava de estabilidade. O plano de 1 Giga da TAC nunca me deixou na mão.", relativeTime: "" },
];

// ── API types ────────────────────────────────────────────────────────────────
type Hero = {
  id: number; badge: string; title: string; titleHighlight: string;
  subtitle: string; imageUrl: string; ctaPrimary: string; ctaPrimaryHref: string;
  ctaSecondary: string; ctaSecondaryHref: string; order: number; active: boolean;
};
type Plan = {
  id: number; tab: string; name: string; speed: string; price: string;
  priceCents: string; badge: string; isFeatured: boolean; icons: string[];
  features: string[]; bonusIds: number[]; planKey: string; order: number; active: boolean;
};

type App = { id: number; name: string; description: string; iconUrl: string; url: string; order: number; active: boolean; };
type Store = { id: number; name: string; address: string; city: string; lat: string; lng: string; mapsUrl: string; order: number; active: boolean; };
type BonusProduct = { id: number; name: string; imageUrl: string; alt: string; };
type City = { id: number; name: string; state: string; active: boolean; order: number };
type GoogleReview = { authorName: string; authorPhoto: string; rating: number; text: string; relativeTime: string };
type GoogleReviewsData = { configured: boolean; rating?: number; totalRatings?: number; reviews?: GoogleReview[]; writeReviewUrl?: string };

// ── Site Logo ─────────────────────────────────────────────────────────────────
function SiteLogo({ logoUrl, textSize = "text-2xl" }: { logoUrl?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo"
          className="h-8 w-auto max-w-[120px] object-contain shrink-0"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      )}
      <span className={`${textSize} font-black tracking-tighter text-primary`}>
        TAC<span className="text-foreground">Telecom</span>
      </span>
    </div>
  );
}

// ── Plan Card ────────────────────────────────────────────────────────────────
function SpeedBadge({ speed, tab }: { speed: string; tab: string }) {
  if (tab === "tv") return <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"><span className="text-primary font-black text-xs leading-tight text-center">TAC<br/>TV</span></div>;
  if (tab === "telefone") {
    const label = speed === "0" || speed === "" ? "∞\nIlim." : `${speed}\nMin`;
    return <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"><span className="text-primary font-black text-xs leading-tight text-center whitespace-pre-line">{label}</span></div>;
  }
  const label = speed === "1000" ? "1\nGiga" : `${speed}\nMega`;
  return (
    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
      <span className="text-primary font-black text-sm leading-tight text-center whitespace-pre-line">{label}</span>
    </div>
  );
}

function PlanCard({ plan, bonusMap }: { plan: Plan; bonusMap: Map<number, BonusProduct> }) {
  const featured = plan.isFeatured;
  const bonuses = (plan.bonusIds ?? []).map(id => bonusMap.get(id)).filter(Boolean) as BonusProduct[];
  return (
    <Card className={`h-full flex flex-col relative overflow-hidden transition-colors ${
      featured ? "bg-card border-primary shadow-[0_0_30px_rgba(22,163,74,0.15)]" : "bg-card border-border/50 hover:border-primary/50"
    }`}>
      {featured && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />}
      <CardHeader>
        {plan.badge && <Badge className={`w-fit mb-3 ${featured ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`} variant={featured ? "default" : "secondary"}>{plan.badge}</Badge>}
        {plan.tab === "tv" && <CardDescription className="text-base font-semibold text-foreground">{plan.name.replace(/TAC TV\s*/i, "TAC TV · ")}</CardDescription>}
        <SpeedBadge speed={plan.speed} tab={plan.tab} />
        <CardTitle className={plan.price ? "text-4xl font-black" : "text-2xl font-black text-primary"}>
          {plan.price ? (
            <>R$ {plan.price}<span className="text-2xl text-muted-foreground">,{plan.priceCents}</span><span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span></>
          ) : (
            <>Consulte-nos!<span className="text-sm font-normal text-muted-foreground block mt-1">fale pelo WhatsApp</span></>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span className={`text-sm ${featured && i === 0 ? "font-semibold text-primary" : ""}`}>{f}</span>
            </li>
          ))}
        </ul>
        {bonuses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Incluso no plano</p>
            <div className="flex flex-wrap gap-2">
              {bonuses.map(b => (
                <img
                  key={b.id}
                  src={b.imageUrl}
                  alt={b.alt || b.name}
                  title={b.alt || b.name}
                  className="w-10 h-10 rounded-full object-cover border border-border bg-muted"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className={`w-full ${featured ? "text-base h-12" : ""}`} asChild data-testid={`button-contratar-${plan.planKey}`}>
          {plan.price
            ? <Link href={`/contratar?plano=${plan.planKey}`}>Contratar este plano</Link>
            : <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp</a>
          }
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Store Accordion Item ──────────────────────────────────────────────────────
function StoreAccordionItem({ store }: { store: Store }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${open ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card hover:border-border"}`}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm">{store.name}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/30">
          <p className="text-sm text-muted-foreground mt-3 mb-0.5 leading-relaxed">{store.address}</p>
          <p className="text-xs text-muted-foreground/60 mb-3">{store.city}</p>
          {store.mapsUrl && (
            <a href={store.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              Como chegar
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── App Card ─────────────────────────────────────────────────────────────────
function AppCard({ app }: { app: App }) {
  const inner = (
    <div className={`flex flex-col items-center p-4 rounded-2xl bg-card border border-border/50 transition-colors h-full ${app.url ? "hover:border-primary/50 hover:bg-primary/5 cursor-pointer" : ""}`}>
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border/50 flex items-center justify-center mb-3 overflow-hidden shrink-0">
        {app.iconUrl
          ? <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain p-1" />
          : <span className="text-2xl font-black text-primary select-none">{app.name.charAt(0)}</span>
        }
      </div>
      <p className="text-sm font-bold text-center leading-tight mb-1">{app.name}</p>
      {app.description && (
        <p className="text-xs text-muted-foreground text-center leading-snug line-clamp-2">{app.description}</p>
      )}
    </div>
  );

  if (app.url) {
    return (
      <a href={app.url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return <div className="h-full">{inner}</div>;
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────
const STATIC_HERO: Hero = {
  id: 0, badge: "Até 1 Giga de Velocidade", title: "Internet fibra óptica de", titleHighlight: "verdade",
  subtitle: "em Jaguaruna e região", imageUrl: "", ctaPrimary: "Ver Planos", ctaPrimaryHref: "/#planos",
  ctaSecondary: "Consultar Cobertura", ctaSecondaryHref: "/#cobertura", order: 0, active: true,
};

function HeroCarousel({ heroes }: { heroes: Hero[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const data = heroes.length > 0 ? heroes : [STATIC_HERO];

  const go = useCallback((next: number, d: number) => {
    setDir(d);
    setIdx((next + data.length) % data.length);
  }, [data.length]);

  useEffect(() => {
    if (data.length <= 1) return;
    timerRef.current = setTimeout(() => go(idx + 1, 1), 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, data.length, go]);

  const hero = data[idx]!;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, transition: { duration: 0.3 } }),
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
      {hero.imageUrl && (
        <img src={hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 z-0 pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-background z-0" style={{ opacity: hero.imageUrl ? 0.7 : 1 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={hero.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            {hero.badge && (
              <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 text-primary bg-primary/5 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                {hero.badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6">
              {hero.title}{" "}
              {hero.titleHighlight && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{hero.titleHighlight}</span>
              )}
              {hero.subtitle && <span className="block">{hero.subtitle}</span>}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
              Streaming sem travar. Ping baixo. Wi-Fi 6. Instalação em 24h.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                <a href={hero.ctaPrimaryHref}>{hero.ctaPrimary}</a>
              </Button>
              {hero.ctaSecondary && (
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                  <a href={hero.ctaSecondaryHref}>{hero.ctaSecondary}</a>
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel controls */}
        {data.length > 1 && (
          <div className="flex items-center gap-4 mt-10">
            <button onClick={() => go(idx - 1, -1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {data.map((_, i) => (
                <button key={i} onClick={() => go(i, i > idx ? 1 : -1)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground"}`} />
              ))}
            </div>
            <button onClick={() => go(idx + 1, 1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<"fibra" | "tv" | "telefone">("fibra");

  // API data states
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<string[]>(STATIC_CITIES);
  const [reviewsData, setReviewsData] = useState<GoogleReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [bonusMap, setBonusMap] = useState<Map<number, BonusProduct>>(new Map());
  const [apps, setApps] = useState<App[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteStats, setSiteStats] = useState([
    { value: "20.000+", label: "Clientes" },
    { value: "99.8%",   label: "Uptime" },
    { value: "+20",     label: "Anos no Mercado" },
    { value: "6",       label: "Cidades Atendidas" },
  ]);
  const [coverageSubmitted, setCoverageSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/content/heroes")
      .then(r => r.ok ? r.json() : [])
      .then((data: Hero[]) => setHeroes(data))
      .catch(() => {});

    fetch("/api/content/plans")
      .then(r => r.ok ? r.json() : [])
      .then((data: Plan[]) => setPlans(data))
      .catch(() => {});

    fetch("/api/content/cities")
      .then(r => r.ok ? r.json() : [])
      .then((data: City[]) => { if (data.length > 0) setCities(data.map(c => c.name)); })
      .catch(() => {});

    fetch("/api/google-reviews")
      .then(r => r.ok ? r.json() : null)
      .then((data: GoogleReviewsData | null) => setReviewsData(data))
      .catch(() => setReviewsData(null))
      .finally(() => setReviewsLoading(false));

    fetch("/api/content/config")
      .then(r => r.ok ? r.json() : {})
      .then((cfg: Record<string, string>) => {
        if (cfg["logo_url"]) setLogoUrl(cfg["logo_url"]);
        if (cfg["favicon_url"]) setFaviconUrl(cfg["favicon_url"]);
        setSiteStats([
          { value: cfg["stat_1_value"] || "20.000+", label: cfg["stat_1_label"] || "Clientes" },
          { value: cfg["stat_2_value"] || "99.8%",   label: cfg["stat_2_label"] || "Uptime" },
          { value: cfg["stat_3_value"] || "+20",     label: cfg["stat_3_label"] || "Anos no Mercado" },
          { value: cfg["stat_4_value"] || "6",       label: cfg["stat_4_label"] || "Cidades Atendidas" },
        ]);
      })
      .catch(() => {});

    fetch("/api/content/bonus-products")
      .then(r => r.ok ? r.json() : [])
      .then((data: BonusProduct[]) => {
        const m = new Map<number, BonusProduct>();
        data.forEach(b => m.set(b.id, b));
        setBonusMap(m);
      })
      .catch(() => {});

    fetch("/api/content/apps")
      .then(r => r.ok ? r.json() : [])
      .then((data: App[]) => setApps(data))
      .catch(() => {});

    fetch("/api/content/stores")
      .then(r => r.ok ? r.json() : [])
      .then((data: Store[]) => setStores(data))
      .catch(() => {});
  }, []);

  // Inject favicon dynamically when config loads
  useEffect(() => {
    if (!faviconUrl) return;
    const isSvg = faviconUrl.startsWith("data:image/svg") || /\.svg(\?|$)/i.test(faviconUrl);
    // Remove any previously injected dynamic favicons
    document.querySelectorAll("link[data-dyn-favicon]").forEach(el => el.remove());
    const add = (rel: string, type: string, href: string, sizes?: string) => {
      const el = document.createElement("link");
      el.rel = rel; el.type = type; el.href = href;
      if (sizes) el.setAttribute("sizes", sizes);
      el.setAttribute("data-dyn-favicon", "1");
      document.head.appendChild(el);
    };
    if (isSvg) {
      // SVG: um único arquivo cobre todas as resoluções vetorialmente
      add("icon", "image/svg+xml", faviconUrl);
    } else {
      // PNG/JPG: define em múltiplos tamanhos + apple-touch-icon
      add("icon", "image/png", faviconUrl, "any");
      add("apple-touch-icon", "image/png", faviconUrl, "180x180");
    }
  }, [faviconUrl]);

  const fibraPlans    = plans.filter(p => p.tab === "fibra");
  const tvPlans       = plans.filter(p => p.tab === "tv");
  const telefonePlans = plans.filter(p => p.tab === "telefone");
  const visiblePlans  = planTab === "fibra" ? fibraPlans : planTab === "tv" ? tvPlans : telefonePlans;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleCoverageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoverageSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* WhatsApp Floating Button */}
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        aria-label="Fale conosco no WhatsApp" data-testid="link-whatsapp-floating">
        <MessageCircle className="w-8 h-8" />
      </a>

      {/* Nav */}
      <header className="sticky top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <SiteLogo logoUrl={logoUrl} />

          {/* Desktop nav — internal page links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">Planos</a>
            <a href="#cobertura" className="text-muted-foreground hover:text-primary transition-colors">Cobertura</a>
            <a href="#contato" className="text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </nav>

          {/* Desktop action links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="https://www.portaldoassinante.com/tactelecom"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              TAC Play
            </a>
            <a
              href="/contratar"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Wifi className="w-4 h-4" />
              Assine
            </a>
            <a
              href="http://sac.tactelecom.com.br:8080/sac/login/?sys=SAC"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <User className="w-4 h-4" />
              Central do Cliente
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">Planos</a>
            <a href="#cobertura" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">Cobertura</a>
            <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">Contato</a>
            <div className="my-1 border-t border-border/50" />
            <a href="https://www.portaldoassinante.com/tactelecom" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Play className="w-4 h-4 fill-current" /> TAC Play
            </a>
            <a href="/contratar" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
              <Wifi className="w-4 h-4" /> Assine
            </a>
            <a href="http://sac.tactelecom.com.br:8080/sac/login/?sys=SAC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <User className="w-4 h-4" /> Central do Cliente
            </a>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Carousel */}
        <HeroCarousel heroes={heroes} />

        {/* Stats */}
        <section className="border-y border-border bg-card/50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
              {siteStats.map((s, i) => (
                <div key={i}>
                  <p className="text-3xl font-black">{s.value}</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* City Selector */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Internet fibra em qual cidade?</h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {cities.map(city => (
                <button key={city} onClick={() => setSelectedCity(city)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border ${selectedCity === city ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(22,163,74,0.3)]" : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"}`}
                  data-testid={`button-city-${city.toLowerCase().replace(/\s+/g, "-")}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="planos" className="py-24 bg-card/30 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Planos Fibra Óptica</h2>
              {selectedCity && <p className="text-xl text-primary font-medium">Disponível em {selectedCity} — instalação express</p>}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-card border border-border rounded-full p-1 gap-1 flex-wrap justify-center">
                {([["fibra", "🌐 Fibra Óptica"], ["tv", "📺 TAC TV"], ["telefone", "📞 Telefonia"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setPlanTab(id)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${planTab === id ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(22,163,74,0.3)]" : "text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Cards */}
            {(() => {
              const gridClass =
                planTab === "fibra"    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl" :
                planTab === "tv"       ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl" :
                                         "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl";
              return visiblePlans.length > 0 ? (
                <motion.div key={planTab} className={`grid gap-6 mx-auto ${gridClass}`}
                  variants={containerVariants} initial="hidden" animate="visible">
                  {visiblePlans.map(plan => (
                    <motion.div key={plan.id} variants={itemVariants} className={plan.isFeatured ? "lg:-mt-4 lg:mb-4 z-10" : ""}>
                      <PlanCard plan={plan} bonusMap={bonusMap} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className={`grid gap-6 mx-auto ${gridClass}`}>
                  {[1,2,3].map(i => (
                    <Card key={i} className="animate-pulse h-72"><CardContent className="p-6"><div className="space-y-3"><div className="h-16 w-16 rounded-full bg-muted" /><div className="h-8 bg-muted rounded w-2/3" /><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-4/5" /></div></CardContent></Card>
                  ))}
                </div>
              );
            })()}

            {/* Legal disclaimer */}
            <p className="mt-10 max-w-4xl mx-auto text-xs text-muted-foreground/60 text-center leading-relaxed border-t border-border/30 pt-8">
              Em conformidade com as normas de proteção ao consumidor, a Tac Telecom informa que os serviços de TV e Telefonia são disponibilizados por meio de parcerias comerciais com empresas especializadas que, efetivamente, prestam tais serviços. Por exigências técnicas e regulatórias, estes serviços requerem a conexão com nosso serviço de internet banda larga, estando assim enquadrados como Serviços de Comunicação Multimídia (SCM).
            </p>
          </div>
        </section>

        {/* Apps */}
        {apps.length > 0 && (
          <section className="py-20 bg-background border-t border-border/30">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Apps disponíveis nos planos</h2>
                <p className="text-muted-foreground">Serviços e aplicativos que você pode usar com a sua conexão TAC Telecom</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                {apps.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why TAC */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Por que a TAC é diferente?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                { icon: <Zap className="w-8 h-8" />, title: "Instalação em 24h", desc: "Sem enrolação. Pediu hoje, a equipe tá na sua porta amanhã." },
                { icon: <Headphones className="w-8 h-8" />, title: "Suporte local", desc: "Fala com gente daqui. Atendimento humano, direto e rápido." },
                { icon: <Radio className="w-8 h-8" />, title: "Fibra até sua casa", desc: "A verdadeira fibra óptica, de ponta a ponta, sem gargalos." },
                { icon: <Wifi className="w-8 h-8" />, title: "Wi-Fi 6 incluso", desc: "Roteadores de última geração em todos os planos para cobrir toda a casa." },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">O que nossos clientes dizem</h2>
              {reviewsData?.configured && reviewsData.rating && (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex gap-1 text-primary">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`w-6 h-6 ${i <= Math.round(reviewsData.rating!) ? "fill-current" : "opacity-30"}`} />)}
                  </div>
                  <span className="text-2xl font-black">{reviewsData.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">no Google · {reviewsData.totalRatings?.toLocaleString("pt-BR")} avaliações</span>
                </div>
              )}
              {(!reviewsData?.configured || !reviewsData.rating) && !reviewsLoading && (
                <p className="text-muted-foreground">4.9 estrelas no Google · +850 avaliações</p>
              )}
            </div>

            {reviewsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-card border border-border/50 rounded-xl p-6 animate-pulse">
                    <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(j => <div key={j} className="w-5 h-5 rounded bg-muted" />)}</div>
                    <div className="space-y-2 mb-6"><div className="h-3 bg-muted rounded w-full" /><div className="h-3 bg-muted rounded w-5/6" /></div>
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {!reviewsLoading && (
              <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
                variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
                {(reviewsData?.configured && reviewsData.reviews?.length ? reviewsData.reviews.slice(0, 3) : STATIC_REVIEWS).map((review, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="h-full bg-card border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="pt-6 flex flex-col h-full">
                        <div className="flex gap-1 mb-4 text-primary">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`w-5 h-5 ${i <= review.rating ? "fill-current" : "opacity-20"}`} />)}
                        </div>
                        <p className="text-muted-foreground mb-6 flex-1 text-sm leading-relaxed">"{review.text}"</p>
                        <div className="flex items-center gap-3">
                          {review.authorPhoto ? (
                            <img src={review.authorPhoto} alt={review.authorName} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{review.authorName.charAt(0)}</div>
                          )}
                          <div>
                            <p className="font-bold text-foreground text-sm">{review.authorName}</p>
                            {review.relativeTime && <p className="text-xs text-muted-foreground">{review.relativeTime}</p>}
                          </div>
                          <div className="ml-auto">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="flex justify-center mt-4">
              <a href={reviewsData?.writeReviewUrl ?? "https://share.google/ZQ5207XOUWQl8LwTa"} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-800 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow text-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Avaliar a TAC Telecom no Google
              </a>
            </div>
          </div>
        </section>

        {/* Coverage Form */}
        <section id="cobertura" className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 z-0" />
          <div className="container relative z-10 mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Consultar cobertura na sua rua</h2>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-primary/80">
                <span>Internet fibra em Jaguaruna</span>
                <span className="hidden sm:inline">•</span>
                <span>Fibra óptica em Tubarão</span>
                <span className="hidden sm:inline">•</span>
                <span>Internet gamer em Criciúma</span>
              </div>
            </div>

            <Card className="bg-card border-border/50 p-6 md:p-8">
              {!coverageSubmitted ? (
                <form onSubmit={handleCoverageSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="street">Rua e Bairro</Label>
                      <Input id="street" placeholder="Ex: Av. Principal, Centro" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Select required>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
                        <SelectContent>
                          {cities.map(city => <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-lg">Consultar</Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8" /></div>
                  <h3 className="text-2xl font-bold mb-2">Quase lá!</h3>
                  <p className="text-muted-foreground mb-8">Para agilizar seu atendimento e confirmar a disponibilidade exata, fale com a gente no WhatsApp.</p>
                  <Button size="lg" className="h-14 px-8 text-lg" asChild>
                    <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><MessageCircle className="w-5 h-5 mr-2" />Fale no WhatsApp para agilizar</a>
                  </Button>
                </div>
              )}
            </Card>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">Cidades com cobertura TAC Telecom</p>
              <div className="flex flex-wrap justify-center gap-2">
                {cities.map(city => <Badge key={city} variant="outline" className="bg-background text-muted-foreground">{city}</Badge>)}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contato" className="bg-card border-t border-border">
        {/* Nossas Lojas */}
        {stores.length > 0 && (
          <div className="border-b border-border/50 bg-background/40">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Nossas Lojas</h2>
                  <p className="text-muted-foreground text-sm">Atendimento presencial em toda a região — clique na loja para ver o endereço</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stores.map(store => <StoreAccordionItem key={store.id} store={store} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main footer body */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">

            {/* Col 1 — Logo + Social + CTA */}
            <div className="flex flex-col gap-8">
              <div>
                <SiteLogo logoUrl={logoUrl} textSize="text-4xl" />
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-sm">
                  Conectando famílias e empresas em Jaguaruna e região com fibra óptica de verdade — velocidade, estabilidade e suporte local 24h.
                </p>
              </div>

              {/* Social */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Siga a TAC Telecom</p>
                <div className="flex gap-3">
                  <a href="https://www.instagram.com/tactelecom/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="w-11 h-11 rounded-2xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://www.facebook.com/tactelecom/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="w-11 h-11 rounded-2xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* WhatsApp + Phone CTAs */}
              <div className="flex flex-col gap-3">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold px-7 py-4 rounded-2xl hover:bg-[#20c05c] transition-colors w-full sm:w-fit text-base shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-6 h-6 shrink-0" />
                  Falar no WhatsApp
                </a>
                <a href="tel:4836600800"
                  className="inline-flex items-center justify-center gap-3 bg-card border border-border text-foreground font-semibold px-7 py-3.5 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-colors w-full sm:w-fit text-sm">
                  <Phone className="w-5 h-5 shrink-0 text-primary" />
                  (48) 3660-0800
                </a>
              </div>
            </div>

            {/* Col 2 — Contact + Quick links */}
            <div className="flex flex-col gap-8 md:border-l md:border-border/30 md:pl-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contato</p>
                <a href="mailto:atendimento@tactelecom.com.br"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit group">
                  <div className="w-9 h-9 rounded-xl bg-muted border border-border group-hover:border-primary/50 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm">atendimento@tactelecom.com.br</span>
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Links Rápidos</p>
                <nav className="flex flex-col gap-3">
                  <a href="#planos" className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit">Planos de Internet</a>
                  <a href="#cobertura" className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit">Consultar Cobertura</a>
                  <a href="/contratar" className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit">Contratar Plano</a>
                  <a href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit">Área Administrativa</a>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 TAC Telecom. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
