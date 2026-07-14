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
// Cities are loaded exclusively from the API (admin panel is the source of truth)
const STATIC_CITIES: string[] = [];

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
function TacLogoSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 17500 17600"
      fill="currentColor"
      className={className}
      style={style}
      aria-label="TAC Telecom"
      role="img"
    >
      <path d="M3850.55 6702.04c-53.95,363.88 -146.67,797.17 -214.8,1124.37 -223.71,1074.22 -438.03,2267.7 -644.31,3353.43 -142.11,747.97 -294.7,1488.93 -430.74,2238.59 -230.15,1268.27 -373.74,1231.67 345.54,966.31 583.17,-215.16 1443.59,-444.81 2058.95,-610.84 71.76,-19.37 205.1,-45.25 262.51,-69.13 91.22,-37.93 83.23,-118.79 100.16,-231.47l184.12 -1157.42c62.56,-379.2 124.25,-762.73 185.9,-1141.99 213.3,-1312.39 442.98,-2718.68 638.82,-4036.77 55.76,-375.28 28.8,-439.13 228.05,-438.6 890.07,2.35 1780.29,-1.29 2670.36,0.1 110.01,0.17 238.44,6.31 346.29,-0.15 111.58,-6.68 147.02,-60.76 162.29,-168.2 27.81,-195.76 52.63,-387.07 82.04,-580.31 42.5,-279.29 170.47,-926.69 103.37,-1170.44 -90.39,-328.32 -362.31,-561.31 -780.54,-560.82l-6667.11 0.72c-447.17,0.25 -894.96,1.55 -1342.07,-0.67 -524.09,-2.6 -471.18,179.53 -565.59,761.39 -38.35,236.37 -191.35,968.43 -160.74,1166.67 27.32,176.96 133.47,334.08 245.13,415.14 161.57,117.29 286.96,137.17 524.49,137.13 277.44,-0.05 2451.66,-15.44 2667.9,2.96z"/>
      <path d="M9581.13 10843.18c-83.6,34.74 -516.5,14.12 -649.13,15.6 -150.79,1.69 -219.47,27.06 -138.32,-125.59 156.25,-293.91 413,-883.5 547.42,-1111.3 35.68,69.68 251.58,1157.13 240.03,1221.29zm2256.94 1853.98c28.87,-115.46 -84.08,-518.78 -113.7,-663.3 -44.96,-219.32 -91.93,-435.76 -140.51,-653.72l-852.7 -3966.44c-5.98,-27.87 -12.8,-55.84 -18.76,-84.6 -11.09,-53.51 -22.91,-109.15 -34.61,-164.64 -26.31,-124.87 -18.53,-237.39 -143.14,-250.13 -216.12,-22.11 -563.47,-0.07 -794.47,-0.69 -133.69,-0.36 -702.31,-22.18 -771.86,25.87 -42.29,29.22 -500.38,875.34 -572.41,1000.82l-837.3 1515.07c-258.03,472.29 -601.66,1072.65 -841.21,1538.96l-1097.58 2048.99c-379.27,744.79 -137.05,595.75 131.06,535.37 110.33,-24.85 211.44,-46.06 319.57,-69.88l1312.72 -262.43c117.25,-20.54 227.31,-9.63 277.53,-109.95l188.98 -403.17c19.63,-46.7 39.35,-84.45 63.67,-137.4 36.39,-79.25 65.35,-215.04 166.39,-226.67 206.69,-23.78 554.2,1.68 780.15,-2.77 264.13,-5.19 530.08,5.21 793.75,2.64 210.98,-2.05 172.76,-6.45 210.79,185.04 19.26,96.96 37.29,238.84 77.79,307.6 103.91,25.07 798.93,-63.9 952.81,-78.32 192.36,-18.02 822.18,-46.17 943.03,-86.26z"/>
      <path d="M15080.05 6954.6c-1292.9,82.45 -2203.82,720.08 -2731.54,1416.67 -611.34,806.95 -1029.56,1952.51 -526.42,3174.66 110.77,269.05 223,442.65 369.82,654.89 92.88,134.28 250.59,301.42 374.48,404.87 83.13,69.42 92.97,50.1 218.7,45.66 1246.41,-43.98 2258.89,-42.09 3475.83,116.82 210.26,27.46 240.43,-29.04 376,-122.6 184.46,-127.3 425.14,-311.52 569.56,-468.76 94.05,-102.41 207.65,-172 53.25,-324.78l-816.13 -728.23c-60.27,-53.04 -218.74,-217.19 -278.58,-241.21 -177.43,-71.2 -282.73,66.2 -362.8,134.44 -342.75,292.08 -956.66,586.84 -1570.29,355.85 -1033.36,-388.98 -878.81,-1952.91 268.1,-2479.64 913.54,-419.55 1418.03,124.28 1596.11,154.12 160.14,26.83 256.91,-92.02 349.46,-157.46l1164.94 -898.77c122.68,-175.36 -315.18,-456.27 -447.59,-545.24 -99,-66.52 -210.59,-134.85 -331.58,-187.9 -557.64,-244.46 -1050.99,-348.04 -1751.31,-303.39z"/>
      <path d="M-0 15779.45c118.71,24.93 792.81,-231.88 969.85,-286.38 1052.86,-324.11 1931.52,-579.76 3031.72,-820.79 1430.19,-313.34 2892.15,-582.24 4385.04,-754.21 2194.34,-252.77 5019.2,-364.73 7227.78,10.57 1301.69,221.2 1243.05,397.91 1342.03,-140.44 129.29,-703.21 208.04,-656.57 -323.11,-760.22 -505.87,-98.72 -1192.06,-168.66 -1708.24,-209.95 -794.9,-63.59 -1705.86,-51.49 -2500.06,-10.48 -3032.19,156.57 -5932.85,597.36 -8797.49,1475.34 -925.64,283.7 -2364.27,797.48 -3246.56,1242.64 -125.42,63.28 -371.07,158.31 -380.96,253.92z"/>
      <path d="M9476.76 12.24c-387.72,83.54 -428.55,601.3 -140.27,772.08 151.15,89.54 358.01,61.82 554.95,83.42 189.21,20.76 379.68,55.54 549.15,97.32 685.69,169.05 1292.34,523.11 1688.58,893.61 59.61,55.74 109.27,88.1 168.23,149.53 383.98,400.06 686.1,810.03 894.36,1356.89 333.73,876.32 194.97,1420.08 322,1611.2 83.24,125.24 242.11,210.33 460.35,172.7 401.19,-69.17 346.91,-539.48 300.92,-933.72 -101.09,-866.57 -412,-1615.36 -924.31,-2293.54 -48.65,-64.4 -88.21,-112.37 -140.96,-176.42 -640.59,-777.67 -1568.01,-1365.72 -2573.64,-1610.58 -229.42,-55.86 -926.5,-172.68 -1159.36,-122.5z"/>
      <path d="M9451.92 1399.5c-306.71,80.25 -352.4,410.21 -261.82,598.97 130.35,271.66 358.36,204.57 682.43,256.49 733.59,117.53 1346.77,536.87 1726.14,1086.81 124.07,179.85 232.66,386.36 312.29,626.1 100.04,301.2 101.27,488.59 124.92,814.12 18.97,261.16 250.99,432.75 547.59,361.86 275.11,-65.76 315.41,-312.87 296.58,-628.33 -16.41,-274.93 -70.61,-549.58 -147.22,-791.38 -155.86,-491.92 -409.61,-887.5 -681.96,-1194.83 -164.96,-186.15 -284.67,-288.1 -486.16,-452.43 -328.46,-267.88 -834.46,-506.19 -1269.68,-607.49 -198.07,-46.1 -648.57,-120.79 -843.1,-69.89z"/>
      <path d="M9478.5 2783.44c-335.06,56.77 -466.93,472.05 -229.4,714.55 222.13,226.76 371.73,7.21 859.62,323.82 200.69,130.23 407.25,380.42 477.62,688.71 40.64,178.05 1.55,350.95 106.19,487.52 175.61,229.2 617.86,232.52 745.99,-104.58 59.64,-156.93 19.1,-399.34 -11.66,-541.33 -71.2,-328.61 -198.82,-596.43 -373.7,-811.07 -170.48,-209.24 -356.65,-383.23 -636.89,-531.84 -201.13,-106.66 -659.53,-272.94 -937.78,-225.8z"/>
      <path d="M15675.36 16661.19c51.15,-105.63 24.61,-656.01 24.21,-828.57 44.9,46.05 190.92,399.75 214.83,453.05 35.56,79.24 70.18,153.82 103.6,228.16 41.37,92.02 51.78,165.91 157.97,160.21 98.56,-5.29 116.62,-110.05 150.46,-183.82 46.47,-101.31 281.69,-633.13 306.72,-652.91 -2.05,135.65 -18.86,720.58 10.9,802.38 58.42,45.75 152.58,43.79 248.8,26.56 67.12,-71.34 42.64,-234.21 42.38,-368.53 -0.26,-134.68 0.63,-269.4 0.14,-404.07 -0.49,-134.66 -0.49,-269.4 -0.41,-404.07 0.1,-172.06 30.75,-303.86 -70.86,-323.18 -25.9,-4.93 -166.57,-5.42 -193.89,-1.51 -65.24,9.36 -75.81,31.94 -103.01,95.88l-253.51 553.53c-25.1,51.43 -41.65,85.07 -65.8,136.6 -22.65,48.32 -36.61,98.39 -71.53,134.72 -48.4,-59.46 -241.06,-489.21 -288.07,-595.99 -24.24,-55.06 -110.02,-251.7 -145.01,-288.54 -63.18,-66.53 -288.39,-57.98 -338.57,10.23 -20.18,42.46 -7.26,939.21 -6.95,1115.25 0.38,213.19 -81.6,428.52 277.59,334.61z"/>
      <path d="M13118.1 15994.68c-79.91,-660.33 785.74,-761.25 867.41,-144.7 86.17,650.48 -791.34,773.28 -867.41,144.7zm-312.35 57.72c124.28,958.68 1622.7,850.74 1490.64,-257.96 -48.82,-409.86 -393.32,-721.37 -875.08,-647.33 -228.51,35.12 -376.01,147.71 -475.74,286.51 -105.2,146.4 -171.03,378.02 -139.82,618.79z"/>
      <path d="M9206.23 15449.99c96.98,0.38 292.74,32.83 315.85,-63.55 36.84,-153.6 3.36,-222.04 -142.68,-222.38 -888.35,-2.99 -773.83,-59.17 -774.12,282.24l-0.58 966.87c-0.2,144.59 -21.48,202.59 43.34,244.22 51.24,32.91 535.12,16.38 615.91,16.33 163.54,-0.11 280.11,48.8 280,-130.67 -0.11,-144.58 -8.55,-149.84 -135.69,-150.04l-487.52 -0.33 2.32 -349.6 384.18 -1.01c119.58,0.47 146.02,-9.24 148.09,-133.72 1.71,-103.11 -6.05,-147.62 -119.23,-147.54l-419.13 1.24 5.51 -311.38 283.74 -0.67z"/>
      <path d="M4863.78 15450.61c88.05,-0.06 503.07,10.61 552.23,-13.55 59.39,-29.19 60.21,-146.69 40.64,-210.85 -24.09,-79.02 -101.61,-62.96 -204.49,-62.95l-202.03 0.33c-502.88,0.47 -502.65,-59.15 -502.66,210.55l-0.08 822.56c0.72,493.81 -48.25,476.64 228.55,477.55 147.12,0.49 600.46,8.72 681.81,-14.37 26.11,-59.81 52.81,-191.37 -12.64,-253.68 -40.18,-26.61 -446.56,-6.72 -587.45,-18.6 -0.8,-424.42 -30.64,-345.49 178.04,-345.83 75.95,-0.12 288.77,22.38 331.95,-32.66 21.82,-38.76 26.96,-153.82 4.52,-204.12 -53.35,-61.79 -86.85,-42.92 -177.73,-42.62l-337.67 0.97 7.01 -312.73z"/>
      <path d="M11788.4 15404.72c118.25,-186.29 -355.49,-318.18 -672.42,-241.86 -854.23,205.7 -717.73,1644.76 298.61,1536.87 153.55,-16.3 505.32,-101.06 367.15,-293.3 -132.58,-184.46 -145.36,-63.04 -317.06,-16.32 -571.04,155.38 -784.44,-611.5 -381.42,-884.87 105.02,-71.23 251.62,-93.65 393.42,-47.83 147.05,47.52 187.03,143.73 311.72,-52.68z"/>
      <path d="M2356.98 15191.85c-28.47,32.16 -30.84,157.95 -15.04,206.46 29.61,90.96 303.64,50.63 409.61,52.59 25.1,249.16 -37.79,1149.24 32.93,1206.88 64.59,31.87 185.59,20.06 249.94,3.25 64.7,-137.92 0.01,-963.95 27.12,-1210.96 101.37,-0.43 347.46,37.67 399.6,-36.04 37.7,-42.13 32.89,-168.82 4.41,-214.13 -27.04,-31.39 -28.07,-33.49 -89.02,-35.97l-346.72 0.37c-85.71,-0.35 -624.76,-26.75 -672.82,27.56z"/>
      <path d="M6923.41 15201.31c-43.86,-37.59 -213.56,-65.37 -271.28,-14.91 -49.7,43.46 -27.74,242.35 -27.69,317.61 0.15,226.08 -0.06,452.17 0.14,678.25 0.47,542.63 -41.05,490.92 200.51,491.06 117.82,0.07 592.44,17.52 663.86,-13.49 56.57,-63.25 49.6,-197.66 -1.6,-257.64 -136.19,-33.61 -396.24,9.69 -551.18,-13.62 -25.69,-267.72 25.65,-1011.08 -12.77,-1187.28z"/>
    </svg>
  );
}

function SiteLogo({ logoUrl, textSize = "text-2xl" }: { logoUrl?: string; textSize?: string }) {
  // If a custom logo URL is set in the admin, use it; otherwise fall back to inline SVG
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="TAC Telecom"
        className="h-10 w-auto max-w-[160px] object-contain shrink-0"
        style={{ filter: "brightness(0) invert(1)" }}
      />
    );
  }
  return (
    <TacLogoSvg
      className={`w-auto shrink-0 ${textSize === "text-4xl" ? "h-48" : "h-10"}`}
      style={{ color: "currentColor" }}
    />
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

// ── Store Map Section ─────────────────────────────────────────────────────────
function StoreMapSection({ stores }: { stores: Store[] }) {
  const [selectedId, setSelectedId] = useState<number>(stores[0]?.id ?? -1);
  const selected = stores.find(s => s.id === selectedId) ?? stores[0];

  const embedUrl = selected?.lat && selected?.lng
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selected.lat)},${encodeURIComponent(selected.lng)}&z=16&output=embed`
    : null;

  return (
    <div className="border-b border-border/50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border/60 shadow-xl">

            {/* ── Left: store list ── */}
            <div className="flex flex-col" style={{ background: "#0a0a0a" }}>
              <div className="px-8 pt-8 pb-5">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">Onde nos Encontrar?</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#a0a0a0" }}>
                  Sempre tem uma loja perto de você!{" "}
                  <span className="font-medium" style={{ color: "#22c55e" }}>Clique e veja o mais próximo de você.</span>
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 max-h-[420px] lg:max-h-none">
                {stores.map(store => {
                  const isSelected = store.id === selectedId;
                  return (
                    <div
                      key={store.id}
                      className="rounded-xl transition-all duration-150"
                      style={isSelected
                        ? { background: "#22c55e", border: "2px solid #22c55e" }
                        : { background: "transparent", border: "2px solid #22c55e" }
                      }
                    >
                      {/* Clickable row to select store */}
                      <button
                        type="button"
                        onClick={() => setSelectedId(store.id)}
                        className="w-full flex items-start justify-between gap-3 px-5 py-3.5 text-left"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: isSelected ? "#fff" : "#22c55e" }} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: isSelected ? "#fff" : "#fff" }}>
                              {store.name}
                            </p>
                            {isSelected && (
                              <div className="mt-1 space-y-0.5">
                                {store.address && <p className="text-xs leading-relaxed" style={{ color: "#fff" }}>{store.address}</p>}
                                {store.city && <p className="text-xs" style={{ color: "#fff" }}>{store.city}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 shrink-0 mt-0.5 transition-transform"
                          style={{ color: isSelected ? "#000" : "#22c55e", transform: isSelected ? "rotate(90deg)" : undefined }}
                        />
                      </button>
                      {/* "Como chegar" link — outside the button to avoid nested interactives */}
                      {isSelected && store.mapsUrl && (
                        <div className="px-5 pb-3">
                          <a
                            href={store.mapsUrl}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                            style={{ color: "#fff" }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Como chegar
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: map ── */}
            <div className="relative bg-muted min-h-[320px] lg:min-h-0">
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  title={`Mapa — ${selected?.name}`}
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  Mapa indisponível
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
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
  const [citiesLoading, setCitiesLoading] = useState(true);
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
  const [coverageName, setCoverageName] = useState("");
  const [coverageCpf, setCoverageCpf] = useState("");
  const [coverageStreet, setCoverageStreet] = useState("");
  const [coverageCity, setCoverageCity] = useState("");
  const [coverageWhatsappUrl, setCoverageWhatsappUrl] = useState(WHATSAPP_LINK);

  useEffect(() => {
    fetch("/api/content/heroes")
      .then(r => r.ok ? r.json() : [])
      .then((data: Hero[]) => setHeroes(data))
      .catch(() => {});

    fetch("/api/content/plans")
      .then(r => r.ok ? r.json() : [])
      .then((data: Plan[]) => setPlans(data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : (typeof p.features === "string" ? JSON.parse(p.features as unknown as string) : []),
        icons:    Array.isArray(p.icons)    ? p.icons    : (typeof p.icons    === "string" ? JSON.parse(p.icons    as unknown as string) : []),
        bonusIds: Array.isArray(p.bonusIds) ? p.bonusIds : (typeof p.bonusIds === "string" ? JSON.parse(p.bonusIds as unknown as string) : []),
      }))))
      .catch(() => {});

    fetch("/api/content/cities")
      .then(r => r.json())
      .then((data: City[]) => { if (Array.isArray(data) && data.length > 0) setCities(data.map(c => c.name)); })
      .catch(() => {})
      .finally(() => setCitiesLoading(false));

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
    const msg = `Olá! Quero saber: tem disponibilidade na minha rua? Nome: ${coverageName}, CPF: ${coverageCpf}, Endereço: ${coverageStreet} - ${coverageCity} — SC`;
    setCoverageWhatsappUrl(`https://wa.me/554836600800?text=${encodeURIComponent(msg)}`);
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

          {/* Desktop phone CTA */}
          <a
            href="https://wa.me/554836600800"
            target="_blank" rel="noopener noreferrer"
            className="hidden lg:flex flex-col items-center leading-tight px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors group"
          >
            <span className="text-[10px] font-black tracking-widest text-primary uppercase group-hover:text-primary">SUPORTE 24H</span>
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">(48) 3660-0800</span>
          </a>

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
            <a
              href="https://wa.me/554836600800"
              target="_blank" rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-black tracking-widest text-primary uppercase">SUPORTE 24H</span>
                <span className="text-sm font-bold text-foreground">(48) 3660-0800</span>
              </div>
            </a>
            <div className="my-1 border-t border-border/50" />
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
              {citiesLoading
                ? [1,2,3,4,5,6].map(i => <div key={i} className="h-11 w-28 rounded-full bg-card border border-border animate-pulse" />)
                : cities.map(city => (
                    <button key={city} onClick={() => setSelectedCity(city)}
                      className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border ${selectedCity === city ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(22,163,74,0.3)]" : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"}`}
                      data-testid={`button-city-${city.toLowerCase().replace(/\s+/g, "-")}`}>
                      {city}
                    </button>
                  ))
              }
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
              <p className="text-sm font-semibold text-primary/80">
                Nos envie seu endereço para verificar sua disponibilidade
              </p>
            </div>

            <Card className="bg-card border-border/50 p-6 md:p-8">
              {!coverageSubmitted ? (
                <form onSubmit={handleCoverageSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="coverage-name">Nome completo</Label>
                      <Input
                        id="coverage-name"
                        placeholder="Ex: João da Silva"
                        required
                        className="h-12"
                        value={coverageName}
                        onChange={e => setCoverageName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverage-cpf">CPF</Label>
                      <Input
                        id="coverage-cpf"
                        placeholder="Ex: 000.000.000-00"
                        required
                        className="h-12"
                        value={coverageCpf}
                        onChange={e => setCoverageCpf(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverage-street">Rua e Bairro</Label>
                      <Input
                        id="coverage-street"
                        placeholder="Ex: Av. Principal, Centro"
                        required
                        className="h-12"
                        value={coverageStreet}
                        onChange={e => setCoverageStreet(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverage-city">Cidade</Label>
                      <Select required value={coverageCity} onValueChange={setCoverageCity}>
                        <SelectTrigger id="coverage-city" className="h-12"><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
                        <SelectContent>
                          {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
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
                    <a href={coverageWhatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="w-5 h-5 mr-2" />Fale no WhatsApp para agilizar</a>
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
        {stores.length > 0 && <StoreMapSection stores={stores} />}

        {/* Main footer body */}
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">

            {/* Col 1 — Logo + Social + CTA */}
            <div className="flex flex-col gap-5">
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
            <div className="flex flex-col gap-5 md:border-l md:border-border/30 md:pl-8">
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
