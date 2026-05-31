# aptu-ipinfo

Página estática para diagnóstico de rede e ambiente do navegador, focada em suporte técnico.

URL pública padrão no GitHub Pages:
- `https://dalvancunha.github.io/aptu-ipinfo/`

## Estrutura do projeto

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.nojekyll`

## API de IP (HTTPS)

Configuração atual no `script.js`:

```js
const IP_API_PROVIDER = 'ipapi';
const IP_API_URL = 'https://ipapi.co/json/';
```

A resposta é normalizada para o formato:

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

Mapeamento da API:
- IP externo: `ip`
- Cidade: `city`
- Estado/região: `region`
- País: `country_name`
- ASN: `asn`
- Organização: `org`
- ISP: `org` (fallback)

## Suporte

O botão de suporte abre o canal oficial de atendimento da Aptu e pode preencher a mensagem com diagnóstico resumido.

## Publicação no GitHub Pages

Este projeto pode ser publicado pelo GitHub Pages a partir da branch `main`, pasta `/ (root)`.

Passos básicos:
1. Enviar os arquivos do projeto para o repositório.
2. Abrir `Settings` > `Pages`.
3. Em `Source`, escolher `Deploy from a branch`.
4. Selecionar branch `main` e pasta `/ (root)`.
5. Salvar e aguardar publicação.

Observação:
- Configurações de domínio personalizado e DNS devem ser mantidas em documentação interna da Aptu.

## Como testar localmente

Exemplo com Python:

```bash
cd /caminho/para/aptu-ipinfo
python3 -m http.server 8080
```

Acesse:
- `http://localhost:8080`

## Limitações conhecidas

- A localização por IP é aproximada.
- VPN, proxy, CGNAT, iCloud Private Relay, Cloudflare WARP ou rede corporativa podem alterar o IP/provedor detectado.
- A detecção de navegador e sistema operacional é aproximada.
- A API externa pode ter limite de uso ou indisponibilidade.
- O projeto não armazena dados e não usa cookies.
