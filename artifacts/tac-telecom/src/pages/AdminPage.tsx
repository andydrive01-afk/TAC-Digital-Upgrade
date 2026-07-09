import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wifi, Zap, Headphones, Tv, Upload, Shield, Smartphone,
  Phone, Star, Briefcase, Gauge, Users, Home, LogOut,
  Plus, Trash2, Pencil, Save, X, Eye, EyeOff,
  ChevronUp, ChevronDown, Check, Image as ImageIcon, Settings,
  MapPin, LayoutList, Layers, Loader2, Monitor, LayoutGrid, Building2,
  Database, Download, UserPlus, AlertCircle,
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

const ICON_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi:        { label: "Wi-Fi",            icon: <Wifi className="w-5 h-5" /> },
  wifi6:       { label: "Wi-Fi 6 AX",       icon: <Wifi className="w-5 h-5" /> },
  speed:       { label: "Alta Velocidade",  icon: <Zap className="w-5 h-5" /> },
  support24:   { label: "Suporte 24h",      icon: <Headphones className="w-5 h-5" /> },
  streaming:   { label: "Streaming",        icon: <Tv className="w-5 h-5" /> },
  streaming4k: { label: "Streaming 4K",     icon: <Tv className="w-5 h-5" /> },
  tv:          { label: "TAC TV",           icon: <Tv className="w-5 h-5" /> },
  channels:    { label: "Canais ao Vivo",   icon: <Tv className="w-5 h-5" /> },
  premium:     { label: "Conteúdo Premium", icon: <Star className="w-5 h-5" /> },
  upload:      { label: "Upload Alto",      icon: <Upload className="w-5 h-5" /> },
  homeoffice:  { label: "Home Office",      icon: <Briefcase className="w-5 h-5" /> },
  gaming:      { label: "Gaming",           icon: <Gauge className="w-5 h-5" /> },
  multidevice: { label: "Multi Dispositivos", icon: <Smartphone className="w-5 h-5" /> },
  security:    { label: "Segurança",        icon: <Shield className="w-5 h-5" /> },
  install24:   { label: "Instalação 24h",   icon: <Zap className="w-5 h-5" /> },
  phone:       { label: "Telefonia",        icon: <Phone className="w-5 h-5" /> },
  home:        { label: "Home",             icon: <Home className="w-5 h-5" /> },
  users:       { label: "Multi-usuário",    icon: <Users className="w-5 h-5" /> },
};

type Hero = {
  id: number;
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
  order: number;
  active: boolean;
};

type Plan = {
  id: number;
  tab: string;
  name: string;
  speed: string;
  price: string;
  priceCents: string;
  badge: string;
  isFeatured: boolean;
  icons: string[];
  features: string[];
  bonusIds: number[];
  planKey: string;
  order: number;
  active: boolean;
};

type BonusProduct = {
  id: number;
  name: string;
  imageUrl: string;
  alt: string;
  order: number;
  active: boolean;
};

type City = {
  id: number;
  name: string;
  state: string;
  active: boolean;
  order: number;
};

type App = {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  url: string;
  order: number;
  active: boolean;
};

type Store = {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
  mapsUrl: string;
  order: number;
  active: boolean;
};

type Config = Record<string, string>;

function authHeader(token: string) {
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, accept = "image/*" }: { value: string; onChange: (url: string) => void; accept?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Selecione uma imagem válida"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Imagem muito grande (máximo 10MB)"); return; }
    setError("");
    setUploading(true);
    setProgress(10);
    try {
      const form = new FormData();
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      const { servingUrl } = await new Promise<{ servingUrl: string }>((resolve, reject) => {
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(10 + Math.round(e.loaded / e.total * 85)); };
        xhr.onload = () => {
          if (xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText) as { servingUrl: string }); }
            catch { reject(new Error("Resposta inválida do servidor")); }
          } else {
            reject(new Error(`Upload falhou: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Erro de rede no upload"));
        xhr.open("POST", `${API}/storage/uploads`);
        xhr.send(form);
      });

      setProgress(100);
      onChange(servingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... ou faça upload abaixo"
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
          {uploading ? `${progress}%` : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && void handleFile(e.target.files[0])} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && (
        <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-border bg-muted">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── LOGO UPLOAD (com seletor de modo) ────────────────────────────────────────
type LogoMode = "png" | "svg-file" | "svg-code";

function decodeSvgDataUrl(dataUrl: string): string {
  try {
    const b64 = dataUrl.split(",")[1] ?? "";
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return "";
  }
}

function detectMode(value: string): LogoMode {
  if (value.startsWith("data:image/svg")) return "svg-code";
  if (value.toLowerCase().endsWith(".svg")) return "svg-file";
  return "png";
}

function LogoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<LogoMode>(() => detectMode(value));
  const [svgCode, setSvgCode] = useState<string>(() =>
    value.startsWith("data:image/svg") ? decodeSvgDataUrl(value) : ""
  );
  const [svgError, setSvgError] = useState("");

  const handleModeChange = (next: LogoMode) => {
    setMode(next);
    if (next === "svg-code") { onChange(""); setSvgCode(""); }
    else { setSvgCode(""); setSvgError(""); }
  };

  const applySvg = (code: string) => {
    setSvgCode(code);
    setSvgError("");
    if (!code.trim()) { onChange(""); return; }
    try {
      const isFull = /^\s*<svg[\s>]/i.test(code);
      const wrapped = isFull
        ? code.trim()
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${code.trim()}</svg>`;
      const doc = new DOMParser().parseFromString(wrapped, "image/svg+xml");
      if (doc.querySelector("parseerror")) throw new Error();
      const encoded = btoa(unescape(encodeURIComponent(wrapped)));
      onChange(`data:image/svg+xml;base64,${encoded}`);
    } catch {
      setSvgError("SVG inválido — verifique a sintaxe");
    }
  };

  const MODES: { id: LogoMode; label: string }[] = [
    { id: "png",      label: "PNG / JPG" },
    { id: "svg-file", label: "SVG (arquivo)" },
    { id: "svg-code", label: "SVG (código)" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
        {MODES.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleModeChange(opt.id)}
            className={`flex-1 py-2 transition-colors ${mode === opt.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "svg-code" ? (
        <div className="space-y-2">
          <textarea
            value={svgCode}
            onChange={e => applySvg(e.target.value)}
            rows={6}
            placeholder={"Cole o SVG completo ou apenas os <path>:\n\n<path d=\"M12 2L2 7l10 5...\"/>\n\nOu SVG completo:\n<svg xmlns=\"...\" viewBox=\"0 0 200 60\">...</svg>"}
            className="w-full p-3 text-xs font-mono rounded-md border border-input bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {svgError && <p className="text-xs text-destructive">{svgError}</p>}
          {value?.startsWith("data:image/svg") && !svgError && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Preview em fundo claro e escuro:</p>
              <div className="flex gap-3 items-center">
                <div className="flex-1 rounded-lg border border-border p-3 bg-white flex items-center justify-center h-14">
                  <img src={value} alt="Logo preview (claro)" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 rounded-lg border border-border p-3 bg-zinc-900 flex items-center justify-center h-14">
                  <img src={value} alt="Logo preview (escuro)" className="max-h-full max-w-full object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ImageUpload
          value={value}
          onChange={onChange}
          accept={mode === "svg-file" ? "image/svg+xml" : "image/png,image/jpeg,image/webp"}
        />
      )}
    </div>
  );
}

// ── HERO PREVIEW ─────────────────────────────────────────────────────────────
function HeroPreview({ hero }: { hero: Partial<Hero> }) {
  const hasImage = Boolean(hero.imageUrl);
  return (
    <div className="relative overflow-hidden rounded-xl border border-border aspect-video bg-background select-none">
      {hasImage && (
        <img
          src={hero.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10 z-0 pointer-events-none"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "hsl(var(--background))", opacity: hasImage ? 0.7 : 1 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 gap-2">
        {hero.badge && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium"
            style={{ borderColor: "hsl(var(--primary)/0.35)", color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.07)" }}>
            <Zap className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[180px]">{hero.badge}</span>
          </div>
        )}
        <h2 className="text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight">
          {hero.title || <span className="opacity-20">Título</span>}
          {" "}
          {hero.titleHighlight && (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              {hero.titleHighlight}
            </span>
          )}
          {hero.subtitle && <span className="block text-sm sm:text-base md:text-lg font-black mt-0.5">{hero.subtitle}</span>}
        </h2>
        <div className="flex flex-wrap gap-2 mt-1 justify-center">
          {hero.ctaPrimary && (
            <div className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {hero.ctaPrimary}
            </div>
          )}
          {hero.ctaSecondary && (
            <div className="px-3 py-1.5 rounded-md text-xs font-semibold border" style={{ borderColor: "hsl(var(--border))" }}>
              {hero.ctaSecondary}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] opacity-40"
        style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
        <Monitor className="w-2.5 h-2.5" />
        preview
      </div>
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) { setError("Usuário ou senha incorretos."); return; }
      const { token } = await res.json() as { token: string };
      onLogin(token);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-black">
            TAC<span className="text-primary">Telecom</span> Admin
          </CardTitle>
          <p className="text-sm text-muted-foreground">Painel de gerenciamento do site</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-user">Usuário</Label>
              <Input
                id="login-user"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nome de usuário"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-pw">Senha</Label>
              <div className="relative">
                <Input
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── HEROES TAB ────────────────────────────────────────────────────────────────
function HeroesTab({ token }: { token: string }) {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [editing, setEditing] = useState<Partial<Hero> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/heroes`, { headers: authHeader(token) });
    if (res.ok) setHeroes(await res.json() as Hero[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/admin/heroes` : `${API}/admin/heroes/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    await fetch(url, { method, headers: authHeader(token), body: JSON.stringify(editing) });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Deletar este slide?")) return;
    await fetch(`${API}/admin/heroes/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  const toggle = async (hero: Hero) => {
    await fetch(`${API}/admin/heroes/${hero.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !hero.active }),
    });
    await load();
  };

  const move = async (hero: Hero, dir: -1 | 1) => {
    await fetch(`${API}/admin/heroes/${hero.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ order: hero.order + dir }),
    });
    await load();
  };

  const blank: Partial<Hero> = { badge: "", title: "", titleHighlight: "", subtitle: "", imageUrl: "", ctaPrimary: "Ver Planos", ctaPrimaryHref: "/#planos", ctaSecondary: "Consultar Cobertura", ctaSecondaryHref: "/#cobertura", order: heroes.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando slides...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Slides do Hero ({heroes.length})</h2>
        <Button size="sm" onClick={() => setEditing(blank)}>
          <Plus className="w-4 h-4 mr-2" />Novo Slide
        </Button>
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar Slide" : "Novo Slide"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HeroPreview hero={editing} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Badge (ex: "Até 1 Giga")</Label>
                <Input value={editing.badge ?? ""} onChange={e => setEditing({ ...editing, badge: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Imagem de Fundo</Label>
                <ImageUpload
                  value={editing.imageUrl ?? ""}
                  onChange={url => setEditing({ ...editing, imageUrl: url })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Título (parte normal)</Label>
                <Input value={editing.title ?? ""} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Ex: Internet fibra óptica de" />
              </div>
              <div className="space-y-1">
                <Label>Título — parte em destaque (verde)</Label>
                <Input value={editing.titleHighlight ?? ""} onChange={e => setEditing({ ...editing, titleHighlight: e.target.value })} placeholder="Ex: verdade" />
              </div>
              <div className="space-y-1">
                <Label>Subtítulo</Label>
                <Input value={editing.subtitle ?? ""} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Ex: em Jaguaruna e região" />
              </div>
              <div className="space-y-1">
                <Label>CTA Primário (texto)</Label>
                <Input value={editing.ctaPrimary ?? ""} onChange={e => setEditing({ ...editing, ctaPrimary: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>CTA Primário (link)</Label>
                <Input value={editing.ctaPrimaryHref ?? ""} onChange={e => setEditing({ ...editing, ctaPrimaryHref: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>CTA Secundário (texto)</Label>
                <Input value={editing.ctaSecondary ?? ""} onChange={e => setEditing({ ...editing, ctaSecondary: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>CTA Secundário (link)</Label>
                <Input value={editing.ctaSecondaryHref ?? ""} onChange={e => setEditing({ ...editing, ctaSecondaryHref: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {heroes.map((hero) => (
          <Card key={hero.id} className={!hero.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <div className="flex flex-col gap-1 pt-1">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(hero, -1)}><ChevronUp className="w-4 h-4" /></button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(hero, 1)}><ChevronDown className="w-4 h-4" /></button>
              </div>
              {hero.imageUrl ? (
                <img src={hero.imageUrl} className="w-16 h-10 object-cover rounded shrink-0" alt="" />
              ) : (
                <div className="w-16 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{hero.title} <span className="text-primary">{hero.titleHighlight}</span></p>
                <p className="text-xs text-muted-foreground truncate">{hero.subtitle}</p>
                {hero.badge && <Badge variant="outline" className="mt-1 text-xs">{hero.badge}</Badge>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggle(hero)} title={hero.active ? "Ocultar" : "Mostrar"}>
                  {hero.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditing(hero)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => void del(hero.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── BONUS PICKER (drag-to-reorder) ────────────────────────────────────────────
function BonusPicker({ all, selectedIds, onChange }: {
  all: BonusProduct[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const dragId = React.useRef<number | null>(null);
  const dragOver = React.useRef<number | null>(null);

  const selected = selectedIds.map(id => all.find(b => b.id === id)).filter(Boolean) as BonusProduct[];
  const available = all.filter(b => !selectedIds.includes(b.id));

  const add = (id: number) => onChange([...selectedIds, id]);
  const remove = (id: number) => onChange(selectedIds.filter(i => i !== id));

  const onDragStart = (id: number) => { dragId.current = id; };
  const onDragEnter = (id: number) => { dragOver.current = id; };
  const onDrop = () => {
    if (dragId.current === null || dragOver.current === null || dragId.current === dragOver.current) return;
    const next = [...selectedIds];
    const from = next.indexOf(dragId.current);
    const to = next.indexOf(dragOver.current);
    next.splice(from, 1);
    next.splice(to, 0, dragId.current);
    onChange(next);
    dragId.current = null;
    dragOver.current = null;
  };

  return (
    <div className="space-y-3">
      <Label className="block">Produtos brinde inclusos no plano</Label>

      {/* Selected — draggable to reorder */}
      {selected.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Selecionados — arraste para reordenar, clique no × para remover</p>
          <div className="flex flex-wrap gap-2">
            {selected.map(b => (
              <div
                key={b.id}
                draggable
                onDragStart={() => onDragStart(b.id)}
                onDragEnter={() => onDragEnter(b.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                title={b.alt || b.name}
                className="relative flex flex-col items-center gap-1 p-2 rounded-xl border border-primary bg-primary/10 text-xs cursor-grab active:cursor-grabbing select-none"
              >
                {b.imageUrl
                  ? <img src={b.imageUrl} alt={b.name} className="w-10 h-10 rounded-full object-cover border border-primary/30 pointer-events-none" />
                  : <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                }
                <span className="max-w-[72px] truncate text-center leading-tight">{b.name}</span>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum brinde selecionado para este plano.</p>
      )}

      {/* Available — click to add */}
      {available.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Disponíveis — clique para adicionar</p>
          <div className="flex flex-wrap gap-2">
            {available.map(b => (
              <button
                key={b.id}
                type="button"
                title={b.alt || b.name}
                onClick={() => add(b.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-card text-xs hover:border-primary/50 transition-colors"
              >
                {b.imageUrl
                  ? <img src={b.imageUrl} alt={b.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  : <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                }
                <span className="max-w-[72px] truncate text-center leading-tight">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PLANS TAB ─────────────────────────────────────────────────────────────────
function PlansTab({ token }: { token: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bonusProducts, setBonusProducts] = useState<BonusProduct[]>([]);
  const [tab, setTab] = useState<"fibra" | "tv" | "telefone">("fibra");
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [plansRes, bonusRes] = await Promise.all([
      fetch(`${API}/admin/plans`, { headers: authHeader(token) }),
      fetch(`${API}/admin/bonus-products`, { headers: authHeader(token) }),
    ]);
    if (plansRes.ok) setPlans(await plansRes.json() as Plan[]);
    if (bonusRes.ok) setBonusProducts(await bonusRes.json() as BonusProduct[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/admin/plans` : `${API}/admin/plans/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    await fetch(url, { method, headers: authHeader(token), body: JSON.stringify({ ...editing, tab }) });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Deletar este plano?")) return;
    await fetch(`${API}/admin/plans/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  const toggle = async (plan: Plan) => {
    await fetch(`${API}/admin/plans/${plan.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !plan.active }),
    });
    await load();
  };

  const toggleIcon = (key: string) => {
    if (!editing) return;
    const icons = editing.icons ?? [];
    setEditing({ ...editing, icons: icons.includes(key) ? icons.filter(i => i !== key) : [...icons, key] });
  };

  const addFeature = () => {
    if (!featureInput.trim() || !editing) return;
    setEditing({ ...editing, features: [...(editing.features ?? []), featureInput.trim()] });
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, features: (editing.features ?? []).filter((_, i) => i !== idx) });
  };

  const toggleBonus = (id: number) => {
    if (!editing) return;
    const ids = editing.bonusIds ?? [];
    setEditing({ ...editing, bonusIds: ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id] });
  };

  const visible = plans.filter(p => p.tab === tab);
  const blank: Partial<Plan> = { tab, name: "", speed: "", price: "", priceCents: "90", badge: "", isFeatured: false, icons: [], features: [], bonusIds: [], planKey: "", order: visible.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando planos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["fibra", "tv", "telefone"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {t === "fibra" ? "🌐 Fibra Óptica" : t === "tv" ? "📺 TAC TV (por ponto)" : "📞 Telefone Fixo (por linha)"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setEditing(blank)}>
          <Plus className="w-4 h-4 mr-2" />Novo Plano
        </Button>
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar Plano" : "Novo Plano"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Nome do Plano</Label>
                <Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Fibra 800 Mega" />
              </div>
              <div className="space-y-1">
                <Label>Velocidade (Mbps)</Label>
                <Input value={editing.speed ?? ""} onChange={e => setEditing({ ...editing, speed: e.target.value })} placeholder="Ex: 800" />
              </div>
              <div className="space-y-1">
                <Label>Chave única (planKey)</Label>
                <Input value={editing.planKey ?? ""} onChange={e => setEditing({ ...editing, planKey: e.target.value })} placeholder="Ex: fibra800" />
              </div>
              <div className="space-y-1">
                <Label>Preço (R$)</Label>
                <Input value={editing.price ?? ""} onChange={e => setEditing({ ...editing, price: e.target.value })} placeholder="109" />
              </div>
              <div className="space-y-1">
                <Label>Centavos</Label>
                <Input value={editing.priceCents ?? "90"} onChange={e => setEditing({ ...editing, priceCents: e.target.value })} placeholder="90" />
              </div>
              <div className="space-y-1">
                <Label>Badge (ex: MAIS CONTRATADO)</Label>
                <Input value={editing.badge ?? ""} onChange={e => setEditing({ ...editing, badge: e.target.value })} placeholder="Deixe vazio se não tiver" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={editing.isFeatured ?? false} onChange={e => setEditing({ ...editing, isFeatured: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="featured">Destaque (borda verde + elevado)</Label>
            </div>

            {/* Icon picker */}
            <div>
              <Label className="block mb-2">Ícones do Plano (clique para selecionar)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Object.entries(ICON_MAP).map(([key, { label, icon }]) => {
                  const active = (editing.icons ?? []).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleIcon(key)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}
                    >
                      {icon}
                      <span className="leading-tight text-center">{label}</span>
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features list */}
            <div>
              <Label className="block mb-2">Funcionalidades (lista do plano)</Label>
              <div className="space-y-1 mb-2">
                {(editing.features ?? []).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5 text-sm">
                    <span className="flex-1">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className="text-destructive hover:text-destructive/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  placeholder="Ex: Streaming 4K sem travar"
                  className="text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bonus Products Picker */}
            <BonusPicker
              all={bonusProducts.filter(b => b.active)}
              selectedIds={editing.bonusIds ?? []}
              onChange={ids => setEditing({ ...editing, bonusIds: ids })}
            />
            {bonusProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">Crie produtos brinde na aba <strong>Brindes</strong> para vinculá-los aqui.</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {visible.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum plano nesta aba.</p>}
        {visible.map(plan => (
          <Card key={plan.id} className={!plan.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{plan.name}</span>
                  {plan.badge && <Badge variant="secondary" className="text-xs">{plan.badge}</Badge>}
                  {plan.isFeatured && <Badge className="text-xs bg-primary">Destaque</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">R$ {plan.price},{plan.priceCents}/mês · {plan.speed}Mbps · Key: <code className="text-xs bg-muted px-1 rounded">{plan.planKey}</code></p>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.features.join(" · ")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggle(plan)}>
                  {plan.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditing(plan)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => void del(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── CITIES TAB ────────────────────────────────────────────────────────────────
function CitiesTab({ token }: { token: string }) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("SC");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/cities`, { headers: authHeader(token) });
    if (res.ok) setCities(await res.json() as City[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(`${API}/admin/cities`, {
      method: "POST", headers: authHeader(token),
      body: JSON.stringify({ name: newName.trim(), state: newState.trim() || "SC", active: true, order: cities.length }),
    });
    setNewName("");
    setAdding(false);
    await load();
  };

  const toggle = async (city: City) => {
    await fetch(`${API}/admin/cities/${city.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !city.active }),
    });
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Remover esta cidade?")) return;
    await fetch(`${API}/admin/cities/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando cidades...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Cidades Atendidas ({cities.filter(c => c.active).length} ativas)</h2>

      <Card>
        <CardContent className="py-4 px-4 flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label>Cidade</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && void add()} placeholder="Ex: Laguna" />
          </div>
          <div className="w-24 space-y-1">
            <Label>Estado</Label>
            <Input value={newState} onChange={e => setNewState(e.target.value)} placeholder="SC" maxLength={2} />
          </div>
          <Button onClick={() => void add()} disabled={adding || !newName.trim()}>
            <Plus className="w-4 h-4 mr-2" />Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {cities.map(city => (
          <Card key={city.id} className={!city.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-sm">{city.name}</span>
                <span className="text-xs text-muted-foreground ml-2">— {city.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => void toggle(city)} title={city.active ? "Ocultar" : "Mostrar"}>
                  {city.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => void del(city.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── CONFIG TAB ────────────────────────────────────────────────────────────────
// ── SETUP DB CARD ─────────────────────────────────────────────────────────────
function SetupDbCard({ token }: { token: string }) {
  const [status, setStatus] = useState<"checking" | "ready" | "not-ready" | "installing" | "error">("checking");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/db-status`, { headers: authHeader(token) })
      .then(r => r.json() as Promise<{ ok?: boolean; ready?: boolean }>)
      .then(data => setStatus(data.ready ? "ready" : "not-ready"))
      .catch(() => setStatus("not-ready"));
  }, [token]);

  const install = async () => {
    setStatus("installing");
    setErrMsg("");
    try {
      const res = await fetch(`${API}/admin/setup-db`, { method: "POST", headers: authHeader(token) });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("ready");
      } else {
        setStatus("error");
        setErrMsg(data.error ?? "Erro desconhecido");
      }
    } catch (e) {
      setStatus("error");
      setErrMsg(String(e));
    }
  };

  if (status === "checking") {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Verificando banco de dados...
        </CardContent>
      </Card>
    );
  }

  if (status === "ready") {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
          <Check className="w-4 h-4" /> Banco de dados configurado e funcionando
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          Instalar Banco de Dados (MariaDB / MySQL)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Cria todas as tabelas e popula os dados iniciais automaticamente. Seguro de rodar — usa <code className="bg-muted px-1 rounded text-xs">IF NOT EXISTS</code>.
        </p>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => void install()} disabled={status === "installing"}>
            {status === "installing"
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Instalando...</>
              : <><Monitor className="w-4 h-4 mr-2" />Instalar Banco de Dados</>}
          </Button>
          {status === "error" && <span className="text-xs text-destructive">{errMsg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigTab({ token }: { token: string }) {
  const [cfg, setCfg] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetch(`${API}/admin/config`, { headers: authHeader(token) })
      .then(r => r.ok ? r.json() : {})
      .then((data: Config) => { setCfg(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const save = async () => {
    setSaving(true);
    await fetch(`${API}/admin/config`, {
      method: "PUT", headers: authHeader(token), body: JSON.stringify(cfg),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando configurações...</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold">Configurações do Site</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Estatísticas (barra abaixo do hero)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Edite os 4 números e rótulos exibidos na barra de credenciais da página inicial.</p>
          {([
            ["stat_1_value", "stat_1_label", "20.000+", "Clientes"],
            ["stat_2_value", "stat_2_label", "99.8%",   "Uptime"],
            ["stat_3_value", "stat_3_label", "+20",     "Anos no Mercado"],
            ["stat_4_value", "stat_4_label", "6",       "Cidades Atendidas"],
          ] as const).map(([valKey, labelKey, vPh, lPh], i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor {i + 1}</Label>
                <Input value={cfg[valKey] ?? ""} onChange={e => setCfg({ ...cfg, [valKey]: e.target.value })} placeholder={vPh} />
              </div>
              <div className="space-y-1">
                <Label>Rótulo {i + 1}</Label>
                <Input value={cfg[labelKey] ?? ""} onChange={e => setCfg({ ...cfg, [labelKey]: e.target.value })} placeholder={lPh} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Identidade Visual</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Logo do Site</Label>
            <LogoUpload
              value={cfg["logo_url"] ?? ""}
              onChange={url => setCfg({ ...cfg, logo_url: url })}
            />
            <p className="text-xs text-muted-foreground">Exibida no cabeçalho. PNG/JPG, SVG por arquivo ou SVG colando o código diretamente.</p>
          </div>
          <div className="space-y-1">
            <Label>Favicon</Label>
            <ImageUpload
              value={cfg["favicon_url"] ?? ""}
              onChange={url => setCfg({ ...cfg, favicon_url: url })}
            />
            <p className="text-xs text-muted-foreground">
              SVG recomendado — escala para qualquer resolução automaticamente (aba, favoritos, atalhos). PNG também funciona.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Reviews API</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Google Places API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={cfg["google_places_api_key"] ?? ""}
                onChange={e => setCfg({ ...cfg, google_places_api_key: e.target.value })}
                placeholder="AIza..."
                className="pr-10"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowKey(v => !v)}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Necessário para exibir avaliações reais do Google no site.</p>
          </div>

          <div className="space-y-1">
            <Label>Nome do Estabelecimento (busca no Google)</Label>
            <Input
              value={cfg["google_place_search_query"] ?? ""}
              onChange={e => setCfg({ ...cfg, google_place_search_query: e.target.value })}
              placeholder="TAC Telecom Jaguaruna SC"
            />
          </div>

          <div className="space-y-1">
            <Label>Place ID (opcional, melhora precisão)</Label>
            <Input
              value={cfg["google_place_id"] ?? ""}
              onChange={e => setCfg({ ...cfg, google_place_id: e.target.value })}
              placeholder="ChIJ..."
            />
          </div>
        </CardContent>
      </Card>

      <SetupDbCard token={token} />

      <Button onClick={() => void save()} disabled={saving}>
        {saved ? <><Check className="w-4 h-4 mr-2" />Salvo!</> : <><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</>}
      </Button>
    </div>
  );
}

// ── BONUS PRODUCTS TAB ────────────────────────────────────────────────────────
function BonusProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<BonusProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BonusProduct> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/bonus-products`, { headers: authHeader(token) });
    if (res.ok) setProducts(await res.json() as BonusProduct[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/admin/bonus-products` : `${API}/admin/bonus-products/${editing.id}`;
    await fetch(url, { method: isNew ? "POST" : "PUT", headers: authHeader(token), body: JSON.stringify(editing) });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Deletar este produto brinde?")) return;
    await fetch(`${API}/admin/bonus-products/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  const toggle = async (p: BonusProduct) => {
    await fetch(`${API}/admin/bonus-products/${p.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !p.active }),
    });
    await load();
  };

  const blank: Partial<BonusProduct> = { name: "", imageUrl: "", alt: "", order: products.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Produtos Brinde</h2>
          <p className="text-sm text-muted-foreground">TAC Música, TAC TV, Looke, etc. — aparecem como ícones redondos nos planos.</p>
        </div>
        <Button size="sm" onClick={() => setEditing(blank)}>
          <Plus className="w-4 h-4 mr-2" />Novo Produto
        </Button>
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-base">{editing.id ? "Editar Produto" : "Novo Produto"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome do produto</Label>
                  <Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: TAC Música" />
                </div>
                <div className="space-y-1">
                  <Label>Texto ao passar o mouse (tooltip)</Label>
                  <Input value={editing.alt ?? ""} onChange={e => setEditing({ ...editing, alt: e.target.value })} placeholder="Ex: TAC Música incluso" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Ícone do produto</Label>
                <ImageUpload value={editing.imageUrl ?? ""} onChange={url => setEditing({ ...editing, imageUrl: url })} />
                <p className="text-xs text-muted-foreground">PNG ou SVG. Será exibido redondo no card do plano.</p>
              </div>
            </div>
            {editing.imageUrl && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <img src={editing.imageUrl} alt={editing.alt ?? editing.name} title={editing.alt ?? editing.name}
                  className="w-12 h-12 rounded-full object-cover border border-border bg-muted" />
                <span className="text-xs text-muted-foreground italic">{editing.alt || editing.name}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.length === 0 && (
          <p className="text-muted-foreground text-center py-8 col-span-full">
            Nenhum produto cadastrado. Crie produtos aqui e depois vincule-os aos planos.
          </p>
        )}
        {products.map(p => (
          <Card key={p.id} className={!p.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-3 flex items-center gap-3">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.alt || p.name} title={p.alt || p.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {p.alt && <p className="text-xs text-muted-foreground truncate">{p.alt}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => toggle(p)}>
                  {p.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setEditing(p)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => void del(p.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── STORES TAB ────────────────────────────────────────────────────────────────
function StoresTab({ token }: { token: string }) {
  const [storesList, setStoresList] = useState<Store[]>([]);
  const [editing, setEditing] = useState<Partial<Store> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/stores`, { headers: authHeader(token) });
    if (res.ok) setStoresList(await res.json() as Store[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/admin/stores` : `${API}/admin/stores/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    await fetch(url, { method, headers: authHeader(token), body: JSON.stringify(editing) });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Deletar esta loja?")) return;
    await fetch(`${API}/admin/stores/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  const toggle = async (store: Store) => {
    await fetch(`${API}/admin/stores/${store.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !store.active }),
    });
    await load();
  };

  const move = async (store: Store, dir: -1 | 1) => {
    await fetch(`${API}/admin/stores/${store.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ order: store.order + dir }),
    });
    await load();
  };

  const blank: Partial<Store> = { name: "", address: "", city: "", lat: "", lng: "", mapsUrl: "", order: storesList.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando lojas...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Lojas Físicas ({storesList.length})</h2>
        <Button size="sm" onClick={() => setEditing(blank)}>
          <Plus className="w-4 h-4 mr-2" />Nova Loja
        </Button>
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar Loja" : "Nova Loja"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label>Nome da loja</Label>
                <Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Matriz Jaguaruna" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={editing.address ?? ""} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="Ex: Rua Engenheiro Annes Gualberto, 1236 — Centro" />
              </div>
              <div className="space-y-1">
                <Label>Cidade / Estado</Label>
                <Input value={editing.city ?? ""} onChange={e => setEditing({ ...editing, city: e.target.value })} placeholder="Ex: Jaguaruna — SC" />
              </div>
              <div className="space-y-1">
                <Label>URL Google Maps (botão "Como chegar")</Label>
                <Input value={editing.mapsUrl ?? ""} onChange={e => setEditing({ ...editing, mapsUrl: e.target.value })} placeholder="https://maps.google.com/..." />
              </div>
              <div className="space-y-1">
                <Label>Latitude</Label>
                <Input value={editing.lat ?? ""} onChange={e => setEditing({ ...editing, lat: e.target.value })} placeholder="Ex: -28.6146" />
              </div>
              <div className="space-y-1">
                <Label>Longitude</Label>
                <Input value={editing.lng ?? ""} onChange={e => setEditing({ ...editing, lng: e.target.value })} placeholder="Ex: -49.0256" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {storesList.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma loja cadastrada ainda.</p>
        )}
        {storesList.map((store) => (
          <Card key={store.id} className={!store.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex flex-col gap-1 shrink-0">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(store, -1)}><ChevronUp className="w-4 h-4" /></button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(store, 1)}><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{store.name}</p>
                <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                <p className="text-xs text-muted-foreground/60 truncate">{store.city}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => void toggle(store)} title={store.active ? "Ocultar" : "Mostrar"}>
                  {store.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditing(store)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => void del(store.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── APPS TAB ──────────────────────────────────────────────────────────────────
function AppsTab({ token }: { token: string }) {
  const [appsList, setAppsList] = useState<App[]>([]);
  const [editing, setEditing] = useState<Partial<App> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/apps`, { headers: authHeader(token) });
    if (res.ok) setAppsList(await res.json() as App[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/admin/apps` : `${API}/admin/apps/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    await fetch(url, { method, headers: authHeader(token), body: JSON.stringify(editing) });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const del = async (id: number) => {
    if (!confirm("Deletar este aplicativo?")) return;
    await fetch(`${API}/admin/apps/${id}`, { method: "DELETE", headers: authHeader(token) });
    await load();
  };

  const toggle = async (app: App) => {
    await fetch(`${API}/admin/apps/${app.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ active: !app.active }),
    });
    await load();
  };

  const move = async (app: App, dir: -1 | 1) => {
    await fetch(`${API}/admin/apps/${app.id}`, {
      method: "PUT", headers: authHeader(token),
      body: JSON.stringify({ order: app.order + dir }),
    });
    await load();
  };

  const blank: Partial<App> = { name: "", description: "", iconUrl: "", url: "", order: appsList.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando aplicativos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aplicativos ({appsList.length})</h2>
        <Button size="sm" onClick={() => setEditing(blank)}>
          <Plus className="w-4 h-4 mr-2" />Novo App
        </Button>
      </div>

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar Aplicativo" : "Novo Aplicativo"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome do app</Label>
                <Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Disney+" />
              </div>
              <div className="space-y-1">
                <Label>URL do site (opcional)</Label>
                <p className="text-xs text-muted-foreground -mt-0.5">Ao clicar no card, abre esta URL em nova aba</p>
                <Input value={editing.url ?? ""} onChange={e => setEditing({ ...editing, url: e.target.value })} placeholder="https://www.disneyplus.com" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Descrição curta</Label>
                <Input value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Ex: Filmes e séries Disney, Marvel e Star Wars" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Ícone / Logo do app</Label>
                <ImageUpload value={editing.iconUrl ?? ""} onChange={url => setEditing({ ...editing, iconUrl: url })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {appsList.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum aplicativo cadastrado ainda.</p>
        )}
        {appsList.map((app) => (
          <Card key={app.id} className={!app.active ? "opacity-50" : ""}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex flex-col gap-1 shrink-0">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(app, -1)}><ChevronUp className="w-4 h-4" /></button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => void move(app, 1)}><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                {app.iconUrl
                  ? <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain p-0.5" />
                  : <span className="text-lg font-black text-primary select-none">{app.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{app.name}</p>
                {app.description && <p className="text-xs text-muted-foreground truncate">{app.description}</p>}
                {app.url && <p className="text-xs text-primary/70 truncate">{app.url}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => void toggle(app)} title={app.active ? "Ocultar" : "Mostrar"}>
                  {app.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditing(app)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => void del(app.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── USERS TAB ─────────────────────────────────────────────────────────────────
type AdminUser = { id: number; username: string; createdAt: string | null };

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState("");
  const [newPw, setNewPw] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [showPw, setShowPw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/users`, { headers: authHeader(token) });
    if (res.ok) setUsers(await res.json() as AdminUser[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    setAddErr("");
    if (!newUser.trim()) { setAddErr("Informe o nome de usuário."); return; }
    if (newPw.length < 6) { setAddErr("Senha deve ter pelo menos 6 caracteres."); return; }
    setAdding(true);
    const res = await fetch(`${API}/admin/users`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ username: newUser.trim(), password: newPw }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setAddErr(data.error ?? "Erro ao criar usuário."); setAdding(false); return; }
    setNewUser(""); setNewPw(""); setAdding(false);
    await load();
  };

  const del = async (user: AdminUser) => {
    if (!confirm(`Remover o usuário "${user.username}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`${API}/admin/users/${user.id}`, { method: "DELETE", headers: authHeader(token) });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      alert(data.error ?? "Erro ao remover usuário.");
      return;
    }
    await load();
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold">Usuários Admin</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie quem tem acesso ao painel.</p>
      </div>

      {/* Current users list */}
      <div className="space-y-2">
        {users.map(u => (
          <Card key={u.id}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{u.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.username}</p>
                {u.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => void del(u)}
                title="Remover usuário"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <p className="text-muted-foreground text-center py-6">Nenhum usuário encontrado.</p>
        )}
      </div>

      {/* Add new user */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Adicionar usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Usuário</Label>
            <Input
              value={newUser}
              onChange={e => setNewUser(e.target.value)}
              placeholder="Ex: atendimento"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>Senha</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {addErr && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />{addErr}
            </p>
          )}
          <Button size="sm" onClick={() => void add()} disabled={adding}>
            {adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <><Plus className="w-4 h-4 mr-2" />Criar usuário</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── DATABASE TAB ──────────────────────────────────────────────────────────────
function DatabaseTab({ token }: { token: string }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/admin/db-export`, { headers: authHeader(token) });
      if (!res.ok) { alert("Erro ao exportar."); return; }
      const blob = await res.blob();
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tac-telecom-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    if (!confirm("Importar este backup irá SUBSTITUIR todos os dados de conteúdo (planos, heroes, cidades, etc.). Os usuários admin não serão afetados. Continuar?")) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const json = JSON.parse(text) as unknown;
      const res = await fetch(`${API}/admin/db-import`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(json),
      });
      const data = await res.json() as { ok?: boolean; counts?: Record<string, number>; error?: string };
      if (res.ok && data.ok) {
        const summary = data.counts
          ? Object.entries(data.counts).map(([k, v]) => `${v} ${k}`).join(", ")
          : "";
        setImportResult({ ok: true, message: `Importado com sucesso! ${summary}` });
        setImportFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setImportResult({ ok: false, message: data.error ?? "Erro ao importar." });
      }
    } catch (err) {
      setImportResult({ ok: false, message: `Arquivo inválido: ${String(err)}` });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold">Banco de Dados</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Exporte ou importe todos os dados de conteúdo do site.</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Exportar backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Baixa um arquivo <code className="bg-muted px-1 rounded text-xs">.json</code> com todos
            os dados do site (planos, heroes, cidades, lojas, apps, configurações). Usuários admin não
            são incluídos no backup.
          </p>
          <Button size="sm" variant="outline" onClick={() => void handleExport()} disabled={exporting}>
            {exporting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exportando...</>
              : <><Download className="w-4 h-4 mr-2" />Exportar backup</>}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Importar backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Atenção:</strong> a importação <strong>substitui todos os dados de conteúdo</strong> pelo
              arquivo selecionado. Esta ação não pode ser desfeita. Faça um export antes de importar.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Arquivo de backup (.json)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null); }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-background hover:file:bg-muted cursor-pointer"
            />
          </div>
          {importResult && (
            <p className={`text-sm flex items-center gap-1.5 ${importResult.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {importResult.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {importResult.message}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleImport()}
            disabled={!importFile || importing}
          >
            {importing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
              : <><Upload className="w-4 h-4 mr-2" />Importar</>}
          </Button>
        </CardContent>
      </Card>

      {/* Setup DB (existing functionality) */}
      <SetupDbCard token={token} />
    </div>
  );
}

// ── MAIN ADMIN PAGE ───────────────────────────────────────────────────────────
const TABS = [
  { id: "heroes",   label: "Hero / Slideshow", icon: <Layers className="w-4 h-4" /> },
  { id: "plans",    label: "Planos",            icon: <LayoutList className="w-4 h-4" /> },
  { id: "apps",     label: "Aplicativos",       icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "stores",   label: "Lojas",             icon: <Building2 className="w-4 h-4" /> },
  { id: "brindes",  label: "Brindes",           icon: <ImageIcon className="w-4 h-4" /> },
  { id: "cities",   label: "Cobertura",         icon: <MapPin className="w-4 h-4" /> },
  { id: "config",   label: "Configurações",     icon: <Settings className="w-4 h-4" /> },
  { id: "usuarios", label: "Usuários",          icon: <Users className="w-4 h-4" /> },
  { id: "database", label: "Banco de Dados",    icon: <Database className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("tac_admin_token"));
  const [activeTab, setActiveTab] = useState<TabId>("heroes");

  const logout = () => {
    localStorage.removeItem("tac_admin_token");
    setToken(null);
  };

  const handleLogin = (t: string) => {
    localStorage.setItem("tac_admin_token", t);
    setToken(t);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-black text-lg">TAC<span className="text-primary">Telecom</span> Admin</span>
            <div className="hidden md:flex items-center gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={BASE_URL + "/"} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2">Ver site</a>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />Sair
            </Button>
          </div>
        </div>
        {/* Mobile tab bar */}
        <div className="md:hidden flex border-t border-border overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap flex-1 justify-center transition-colors ${activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {activeTab === "heroes"   && <HeroesTab token={token} />}
        {activeTab === "plans"    && <PlansTab token={token} />}
        {activeTab === "apps"     && <AppsTab token={token} />}
        {activeTab === "stores"   && <StoresTab token={token} />}
        {activeTab === "brindes"  && <BonusProductsTab token={token} />}
        {activeTab === "cities"   && <CitiesTab token={token} />}
        {activeTab === "config"   && <ConfigTab token={token} />}
        {activeTab === "usuarios" && <UsersTab token={token} />}
        {activeTab === "database" && <DatabaseTab token={token} />}
      </main>
    </div>
  );
}
