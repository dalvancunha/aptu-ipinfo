# aptu-ipinfo

Página estática de diagnóstico de rede e ambiente do navegador para suporte técnico da Aptu.

## Tecnologias

- HTML
- CSS
- JavaScript puro

## Dados exibidos

- IP externo
- Tipo de IP (IPv4/IPv6 quando identificável)
- Origem da consulta de IP (fluxo prioritário IPv4 ou fallback)
- Provedor, organização e ASN
- Localização aproximada
- Navegador
- Sistema operacional
- Idioma
- User Agent

## Privacidade

- Não usa banco de dados.
- Não usa cookies.
- Não armazena dados nesta versão estática.

## Limitações conhecidas

- A localização por IP é aproximada.
- VPN, proxy, CGNAT, iCloud Private Relay e Cloudflare WARP podem alterar o IP detectado.
- Como é front-end estático, configurações presentes no JavaScript são públicas.
- Navegador e sistema operacional são detecções aproximadas.

## Estratégia de consulta de IP

- Fluxo prioritário: `api.ipify.org` para obter IPv4 e, em seguida, `ipapi.co/{ip}/json`.
- Fallback automático: `ipapi.co/json/` quando o fluxo prioritário falhar.
- Atualizações manuais em menos de 60s reutilizam o último diagnóstico para evitar excesso de consultas.

## Teste local

```bash
python3 -m http.server 8080
```

Acesse localmente:
- `http://localhost:8080`
