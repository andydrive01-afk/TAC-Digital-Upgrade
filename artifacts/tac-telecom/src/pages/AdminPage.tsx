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
  MapPin, LayoutList, Layers, Loader2,
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
  planKey: string;
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

type Config = Record<string, string>;

function authHeader(token: string) {
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Selecione uma imagem (JPG, PNG, WebP)"); return; }
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
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && void handleFile(e.target.files[0])} />
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

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
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
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setError("Senha incorreta."); return; }
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
              <Label htmlFor="pw">Senha</Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Senha do administrador"
                  required
                  className="pr-10"
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
          <CardContent className="space-y-3">
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

// ── PLANS TAB ─────────────────────────────────────────────────────────────────
function PlansTab({ token }: { token: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tab, setTab] = useState<"fibra" | "tv">("fibra");
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/plans`, { headers: authHeader(token) });
    if (res.ok) setPlans(await res.json() as Plan[]);
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

  const visible = plans.filter(p => p.tab === tab);
  const blank: Partial<Plan> = { tab, name: "", speed: "", price: "", priceCents: "90", badge: "", isFeatured: false, icons: [], features: [], planKey: "", order: visible.length, active: true };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Carregando planos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["fibra", "tv"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {t === "fibra" ? "🌐 Fibra Óptica" : "📺 TAC TV"}
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

      <Button onClick={() => void save()} disabled={saving}>
        {saved ? <><Check className="w-4 h-4 mr-2" />Salvo!</> : <><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</>}
      </Button>
    </div>
  );
}

// ── MAIN ADMIN PAGE ───────────────────────────────────────────────────────────
const TABS = [
  { id: "heroes",   label: "Hero / Slideshow", icon: <Layers className="w-4 h-4" /> },
  { id: "plans",    label: "Planos",            icon: <LayoutList className="w-4 h-4" /> },
  { id: "cities",   label: "Cobertura",         icon: <MapPin className="w-4 h-4" /> },
  { id: "config",   label: "Configurações",     icon: <Settings className="w-4 h-4" /> },
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
        {activeTab === "heroes" && <HeroesTab token={token} />}
        {activeTab === "plans" && <PlansTab token={token} />}
        {activeTab === "cities" && <CitiesTab token={token} />}
        {activeTab === "config" && <ConfigTab token={token} />}
      </main>
    </div>
  );
}
