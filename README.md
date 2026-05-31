# aptu-ipinfo

Pagina estatica para diagnostico de rede e ambiente do navegador, focada em suporte tecnico da Aptu.

Dominio de publicacao planejado:
- `https://ipinfo.aptu.com.br`

## Estrutura do projeto

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.nojekyll`
- `CNAME`

## API de IP (HTTPS)

Configuracao atual no `script.js`:

```js
const IP_API_PROVIDER = 'ipapi';
const IP_API_URL = 'https://ipapi.co/json/';
```

A resposta e normalizada para o formato:

```js
{
  status: 'success' || 'error',
  message: '',
  ip: '',
  isp: '',
  org: '',
  asn: '',
  city: '',
  region: '',
  country: '',
  raw: {}
}
```

Mapeamento de `ipapi.co`:
- IP externo: `ip`
- Cidade: `city`
- Estado/regiao: `region`
- Pais: `country_name`
- ASN: `asn`
- Organizacao: `org`
- ISP: `org` (fallback)

Observacao:
- O endpoint legado `http://ip-api.com` foi mantido apenas como referencia em comentario no codigo e nao e usado como padrao.

## WhatsApp de suporte

Constante:

```js
const WHATSAPP_PHONE = '5577998329719';
```

Ao clicar em `Enviar diagnostico pelo WhatsApp`:
- A pagina monta a mensagem com o diagnostico atual.
- A URL e codificada com `encodeURIComponent`.
- A abertura ocorre com `window.open(url, '_blank', 'noopener,noreferrer')`.

Fallback quando o diagnostico completo nao estiver disponivel:
- `Preciso de suporte Aptu.`
- `Nao consegui gerar automaticamente o diagnostico completo de rede.`

## IP interno/local manual

A pagina nao captura IP interno/local automaticamente (restricao de seguranca do navegador).

Existe um campo opcional:
- Label: `IP interno/local, se solicitado pelo suporte`
- Placeholder: `Ex.: 192.168.1.25 ou 10.0.0.15`

Regras:
- Se preenchido, entra no diagnostico copiado e enviado no WhatsApp.
- Se vazio, sai como `nao informado / nao disponivel pelo navegador`.

## Copia manual (fallback)

A secao `Copia manual`:
- Fica oculta por padrao.
- So aparece se `navigator.clipboard` falhar ou nao estiver disponivel.
- Quando aparece, o textarea e preenchido com o diagnostico atual e selecionado.

## Publicacao no GitHub Pages

### 1) Criar repositório

Sugestao de nome:
- `aptu-ipinfo`

### 2) Enviar arquivos

Enviar no branch `main`:
- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.nojekyll`
- `CNAME`
- `README.md`

### 3) Ativar Pages no GitHub

No repositorio:
1. `Settings`
2. `Pages`
3. `Source`: `Deploy from a branch`
4. `Branch`: `main`
5. `Folder`: `/ (root)`

### 4) Dominio personalizado

Em `Settings > Pages`, configurar:
- `ipinfo.aptu.com.br`

### 5) DNS no Cloudflare

Criar registro:
- Tipo: `CNAME`
- Nome: `ipinfo`
- Destino: `[usuario-ou-organizacao].github.io`
- Proxy: `DNS only` inicialmente

### 6) SSL e HTTPS

Apos validacao:
1. Aguardar emissao de certificado pelo GitHub Pages
2. Ativar `Enforce HTTPS` (quando disponivel)
3. Testar:
   - `https://ipinfo.aptu.com.br`
   - `https://ipinfo.aptu.com.br/CNAME`

### 7) Seguranca de dominio

Verificar o dominio no GitHub para reduzir risco de takeover de subdominio.

## Como testar localmente

Exemplo com Python:

```bash
cd /caminho/para/aptu-ipinfo
python3 -m http.server 8080
```

Acessar:
- `http://localhost:8080`

## Limitacoes conhecidas

- Localizacao por IP e aproximada.
- VPN, proxy, CGNAT, iCloud Private Relay, Cloudflare WARP ou rede corporativa podem alterar IP/provedor detectado.
- Deteccao de navegador e sistema operacional e aproximada.
- IP interno/local nao e capturado automaticamente pelo navegador.
- API externa pode ter limite de uso ou indisponibilidade.
- Projeto nao armazena dados e nao usa cookies.
