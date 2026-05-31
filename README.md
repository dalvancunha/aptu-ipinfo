# aptu-ipinfo

Página estática de diagnóstico de rede e ambiente do navegador para suporte técnico da Aptu.

Também pode ser instalada/adicionada como app (PWA) em navegadores compatíveis.

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

- A ferramenta prioriza a exibição de IPv4 quando disponível.
- Quando não for possível obter IPv4, a consulta automática de IP é usada como fallback.
- Atualizações manuais em menos de 60s reutilizam o último diagnóstico para evitar excesso de consultas.

## Observações importantes

- Em iPhone/Safari, iCloud Private Relay e recursos de privacidade podem mascarar o IP real.
- VPNs, proxies e CDNs também podem fazer o IP exibido ser diferente do IP real da rede do cliente.

## Teste local

```bash
python3 -m http.server 8080
```

Acesse localmente:
- `http://localhost:8080`
