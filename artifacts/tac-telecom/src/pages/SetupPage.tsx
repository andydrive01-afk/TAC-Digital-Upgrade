import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Wifi, Database, ShieldCheck } from "lucide-react";

const API = "/api";

type Step = "connecting" | "connected" | "db-error" | "db-config" | "db-configuring" | "form" | "submitting" | "done";

interface SetupPageProps {
  onComplete: (token: string) => void;
}

export default function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState<Step>("connecting");
  const [dbError, setDbError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");
  const [mysqlUrl, setMysqlUrl] = useState("");
  const [dbConfigError, setDbConfigError] = useState("");
  const checkDone = useRef(false);

  useEffect(() => {
    if (checkDone.current) return;
    checkDone.current = true;
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = (url?: string) => {
    setStep("connecting");
    setDbError("");
    fetch(`${API}/setup/status`)
      .then((r) => r.json() as Promise<{ dbConnected: boolean; needsSetup: boolean; error?: string }>)
      .then((data) => {
        if (!data.dbConnected) {
          setDbError(data.error ?? "Não foi possível conectar ao banco de dados.");
          setMysqlUrl(url ?? "");
          setStep("db-error");
        } else if (!data.needsSetup) {
          onComplete("");
        } else {
          setStep("connected");
          setTimeout(() => setStep("form"), 800);
        }
      })
      .catch((err) => { setDbError(String(err)); setStep("db-error"); });
  };

  const handleDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbConfigError("");
    if (!mysqlUrl.trim()) { setDbConfigError("Informe a URL do MySQL."); return; }
    setStep("db-configuring");
    try {
      const res = await fetch(`${API}/setup/configure-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mysqlUrl: mysqlUrl.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setDbConfigError(data.error ?? "Erro ao configurar o banco.");
        setStep("db-config");
        return;
      }
      // Connection configured — now proceed normally
      checkConnection(mysqlUrl.trim());
    } catch (err) {
      setDbConfigError(String(err));
      setStep("db-config");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!username.trim()) { setFormError("Informe o nome de usuário."); return; }
    if (password.length < 6) { setFormError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirmPassword) { setFormError("As senhas não coincidem."); return; }

    setStep("submitting");
    try {
      const res = await fetch(`${API}/setup/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json() as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !data.token) {
        setFormError(data.error ?? "Erro ao configurar o sistema.");
        setStep("form");
        return;
      }
      setStep("done");
      setTimeout(() => onComplete(data.token!), 1200);
    } catch (err) {
      setFormError(String(err));
      setStep("form");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black">
            TAC<span className="text-primary">Telecom</span>
          </h1>
          <p className="text-muted-foreground text-sm">Configuração inicial do sistema</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[
            { label: "Conectar", icon: <Wifi className="w-3.5 h-3.5" /> },
            { label: "Configurar", icon: <Database className="w-3.5 h-3.5" /> },
          ].map((s, i) => {
            const active = (i === 0 && ["connecting", "connected", "db-error", "db-config", "db-configuring"].includes(step))
              || (i === 1 && ["form", "submitting", "done"].includes(step));
            const done = (i === 0 && ["form", "submitting", "done"].includes(step));
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-1 justify-center border transition-colors ${
                  done ? "border-primary/40 bg-primary/10 text-primary" :
                  active ? "border-primary bg-primary text-primary-foreground" :
                  "border-border text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
                  {s.label}
                </div>
                {i < 1 && <div className={`h-px flex-1 transition-colors ${done ? "bg-primary/40" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Connecting */}
        {(step === "connecting" || step === "connected" || step === "db-error") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                Verificar conexão com o banco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {step === "connecting" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando ao banco de dados...
                </div>
              )}
              {step === "connected" && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Conexão estabelecida com sucesso!
                </div>
              )}
              {step === "db-error" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Não foi possível conectar ao banco de dados.</p>
                      {dbError && <p className="text-xs mt-1 opacity-80 font-mono break-all">{dbError}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => checkConnection()}>
                      Tentar novamente
                    </Button>
                    <Button size="sm" onClick={() => { setDbConfigError(""); setStep("db-config"); }}>
                      Configurar conexão
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 1b: Configure MySQL URL */}
        {(step === "db-config" || step === "db-configuring") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Configurar conexão MySQL
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Informe a URL de conexão com o banco de dados MySQL.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleDbConfig(e)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="mysql-url">URL do MySQL</Label>
                  <Input
                    id="mysql-url"
                    value={mysqlUrl}
                    onChange={(e) => setMysqlUrl(e.target.value)}
                    placeholder="mysql://usuario:senha@localhost:3306/nome_do_banco"
                    disabled={step === "db-configuring"}
                    autoFocus
                    autoComplete="off"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemplo: <code className="bg-muted px-1 rounded">mysql://tacapp:senha@localhost:3306/tac_telecom</code>
                  </p>
                </div>
                {dbConfigError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {dbConfigError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setStep("db-error")}
                    disabled={step === "db-configuring"}>
                    Voltar
                  </Button>
                  <Button type="submit" disabled={step === "db-configuring"}>
                    {step === "db-configuring"
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testando conexão...</>
                      : "Salvar e conectar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create admin */}
        {(step === "form" || step === "submitting") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Criar administrador
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Este será o primeiro usuário com acesso ao painel. O banco de dados e os dados de exemplo
                serão criados automaticamente.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="setup-user">Usuário</Label>
                  <Input
                    id="setup-user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: admin"
                    disabled={step === "submitting"}
                    autoFocus
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-pw">Senha</Label>
                  <div className="relative">
                    <Input
                      id="setup-pw"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      disabled={step === "submitting"}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPw((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-pw2">Confirmar senha</Label>
                  <Input
                    id="setup-pw2"
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    disabled={step === "submitting"}
                    autoComplete="new-password"
                  />
                </div>
                {formError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={step === "submitting"}>
                  {step === "submitting"
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Configurando...</>
                    : "Finalizar configuração"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {step === "done" && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-bold text-lg">Sistema configurado!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o painel...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
