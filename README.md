# aptu-ipinfo

Página estática de diagnóstico de rede e ambiente do navegador para suporte técnico da Aptu.

URL pública:
- `https://ip.aptu.solutions/`

## Tecnologias

- HTML
- CSS
- JavaScript puro

## Dados exibidos

- IP externo
- Provedor, organização e ASN
- Localização aproximada
- Navegador
- Sistema operacional
- Idioma
- User Agent
- Campo opcional de IP interno/local

## Privacidade

- Não usa banco de dados.
- Não usa cookies.
- Não armazena dados nesta versão estática.

## Limitações conhecidas

- A localização por IP é aproximada.
- VPN, proxy, CGNAT, iCloud Private Relay e Cloudflare WARP podem alterar o IP detectado.
- Navegador e sistema operacional são detecções aproximadas.
- IP interno/local não é capturado automaticamente por segurança.

## Teste local

```bash
python3 -m http.server 8080
```

Acesse localmente:
- `http://localhost:8080`
