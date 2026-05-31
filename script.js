const IP_API_PROVIDER = 'ipapi';
const IP_API_URL = 'https://ipapi.co/json/';
const IP_API_BY_IP_URL = 'https://ipapi.co/{ip}/json/';
const IPIFY_IPV4_URL = 'https://api.ipify.org?format=json';
const MIN_REFRESH_INTERVAL_MS = 60000;
const MIN_ERROR_RETRY_INTERVAL_MS = 5000;
const FETCH_TIMEOUT_MS = 8000;
// Referencia futura (nao usada como padrao em GitHub Pages por ser HTTP):
// const LEGACY_IP_API_URL = 'http://ip-api.com/json/?fields=status,message,query,isp,org,as,country,regionName,city';
// Nota: por ser front-end estatico, qualquer configuracao aqui e publica no navegador.
const WHATSAPP_PHONE = '5577998329719';

const elements = {
  statusMessage: document.getElementById('statusMessage'),
  protocol: document.getElementById('protocol'),
  timestamp: document.getElementById('timestamp'),
  ipAddress: document.getElementById('ipAddress'),
  isp: document.getElementById('isp'),
  org: document.getElementById('org'),
  asn: document.getElementById('asn'),
  city: document.getElementById('city'),
  region: document.getElementById('region'),
  country: document.getElementById('country'),
  ipType: document.getElementById('ipType'),
  ipOrigin: document.getElementById('ipOrigin'),
  proxyWarning: document.getElementById('proxyWarning'),
  browserName: document.getElementById('browserName'),
  browserVersion: document.getElementById('browserVersion'),
  osName: document.getElementById('osName'),
  deviceType: document.getElementById('deviceType'),
  language: document.getElementById('language'),
  languages: document.getElementById('languages'),
  platform: document.getElementById('platform'),
  vendor: document.getElementById('vendor'),
  userAgent: document.getElementById('userAgent'),
  copyButton: document.getElementById('copyButton'),
  refreshButton: document.getElementById('refreshButton'),
  supportButton: document.getElementById('supportButton'),
  actionToast: document.getElementById('actionToast'),
  manualCopySection: document.getElementById('manualCopySection'),
  diagnosticText: document.getElementById('diagnosticText'),
};

let latestDiagnostic = null;
let lastRunAt = 0;
let lastRunSucceeded = false;
let copyFeedbackTimeoutId = null;
let refreshFeedbackTimeoutId = null;
let actionToastTimeoutId = null;

function fallbackValue(value, emptyLabel = 'Não informado') {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  return String(value);
}

function detectBrowser(userAgent) {
  const ua = userAgent || '';
  let name = 'Navegador desconhecido';
  let version = 'Não identificado';

  const patterns = [
    { name: 'Samsung Internet', regex: /SamsungBrowser\/(\d+[\d.]*)/i },
    { name: 'Edge', regex: /Edg\/(\d+[\d.]*)/i },
    { name: 'Opera', regex: /(OPR|Opera)\/(\d+[\d.]*)/i, group: 2 },
    { name: 'Firefox', regex: /Firefox\/(\d+[\d.]*)/i },
    { name: 'Chrome', regex: /Chrome\/(\d+[\d.]*)/i },
    { name: 'Safari', regex: /Version\/(\d+[\d.]*)[\s\S]*Safari/i },
  ];

  for (const pattern of patterns) {
    const match = ua.match(pattern.regex);
    if (match) {
      name = pattern.name;
      version = match[pattern.group || 1] || 'Não identificado';
      break;
    }
  }

  return { name, version };
}

function detectOS(userAgent, platform) {
  const ua = (userAgent || '').toLowerCase();
  const pf = (platform || '').toLowerCase();

  if (/windows/.test(ua) || /win/.test(pf)) return 'Windows';
  if (/iphone|ipad|ipod/.test(ua)) {
    if (/ipad/.test(ua)) return 'iPadOS';
    return 'iOS';
  }
  if (/mac os x|macintosh/.test(ua) || /mac/.test(pf)) return 'macOS';
  if (/android/.test(ua)) return 'Android';
  if (/cros/.test(ua)) return 'ChromeOS';
  if (/linux/.test(ua) || /linux/.test(pf)) return 'Linux';

  return 'Sistema desconhecido';
}

function detectDeviceType(userAgent, userAgentData) {
  const ua = (userAgent || '').toLowerCase();

  if (userAgentData && userAgentData.mobile === true) {
    return 'Celular';
  }

  if (/ipad|tablet/.test(ua)) return 'Tablet';
  if (/mobi|iphone|android/.test(ua)) return 'Celular';
  if (ua) return 'Desktop';

  return 'Desconhecido';
}

function getEnvironmentInfo() {
  const nav = navigator;
  const userAgent = nav.userAgent || '';
  const platform = nav.platform || '';
  const browser = detectBrowser(userAgent);

  return {
    browserName: browser.name,
    browserVersion: browser.version,
    osName: detectOS(userAgent, platform),
    deviceType: detectDeviceType(userAgent, nav.userAgentData),
    language: nav.language || '',
    languages: Array.isArray(nav.languages) ? nav.languages.join(', ') : '',
    platform,
    vendor: nav.vendor || '',
    userAgent,
  };
}

function normalizeIpapiResponse(data) {
  const hasIp = Boolean(data && data.ip);
  const status = hasIp ? 'success' : 'error';
  const message =
    data && data.error
      ? fallbackValue(data.reason || data.message, 'Erro ao consultar API de IP.')
      : '';

  return {
    status,
    message,
    ip: hasIp ? fallbackValue(data.ip, '') : '',
    isp: fallbackValue(data.org, ''),
    org: fallbackValue(data.org, ''),
    asn: fallbackValue(data.asn, ''),
    city: fallbackValue(data.city, ''),
    region: fallbackValue(data.region, ''),
    country: fallbackValue(data.country_name, ''),
    raw: data || {},
  };
}

async function fetchNormalizedIpInfo() {
  let ipv4 = '';
  let lastError = null;

  try {
    const ipv4Lookup = await fetchWithTimeout(IPIFY_IPV4_URL, FETCH_TIMEOUT_MS, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (ipv4Lookup.ok) {
      const ipv4Data = await ipv4Lookup.json();
      ipv4 = fallbackValue(ipv4Data.ip, '');
    }
  } catch (error) {
    lastError = error;
  }

  if (ipv4) {
    try {
      const byIpUrl = IP_API_BY_IP_URL.replace('{ip}', encodeURIComponent(ipv4));
      const response = await fetchWithTimeout(byIpUrl, FETCH_TIMEOUT_MS, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const normalized = normalizeIpapiResponse(data);
        if (normalized.status === 'success') {
          normalized.origin = 'Consulta IPv4';
          return normalized;
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const response = await fetchWithTimeout(IP_API_URL, FETCH_TIMEOUT_MS, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Resposta inválida da API de IP (${response.status}).`);
    }
    const data = await response.json();
    const normalized = normalizeIpapiResponse(data);
    if (normalized.status === 'success') {
      normalized.origin = detectIpType(normalized.ip) === 'IPv6' ? 'Consulta IPv6' : 'Consulta automática';
      return normalized;
    }
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error('Falha temporária ao consultar IP.');
}

async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function detectIpType(ipValue) {
  const ip = fallbackValue(ipValue, '').trim();
  if (!ip) return 'Não identificado';
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return 'IPv4';
  if (ip.includes(':')) return 'IPv6';
  return 'Não identificado';
}

function detectProxyRelayVpnRisk(model) {
  const raw = model.ip.raw || {};
  const text = [
    model.ip.isp,
    model.ip.org,
    model.ip.as,
    raw.org,
    raw.network,
    raw.asn,
    raw.as_name,
  ]
    .map((item) => fallbackValue(item, '').toLowerCase())
    .join(' ');

  const riskyTerms = [
    'akamai',
    'apple',
    'icloud',
    'private relay',
    'icloud private relay',
    'warp',
    'cloudflare',
    'fastly',
    'google',
    'google one vpn',
    'vpn',
    'proxy',
    'relay',
    'cdn',
    'zscaler',
    'netskope',
    'cisco umbrella',
    'cloudproxy',
    'tor',
    'datacenter',
    'hosting',
  ];
  const matchedTerm = riskyTerms.find((term) => text.includes(term));

  if (matchedTerm) {
    return {
      level: 'warning',
      text:
        'Possível proxy, relay de privacidade, CDN ou VPN detectado. O IP exibido pode não ser o IP real da rede do cliente.',
    };
  }
  return {
    level: 'none',
    text: 'Sem indicativo forte de proxy, relay, CDN ou VPN pelos dados públicos.',
  };
}

function getSafariPrivacyGuidance(model) {
  const browserName = fallbackValue(model.env.browserName, '').toLowerCase();
  const osName = fallbackValue(model.env.osName, '').toLowerCase();
  const isSafari = browserName.includes('safari');
  const isIphoneOrIpad = osName.includes('ios') || osName.includes('ipados');
  const providerText = [model.ip.isp, model.ip.org, model.ip.as]
    .map((item) => fallbackValue(item, '').toLowerCase())
    .join(' ');
  const hasCommonRelayProvider = /akamai|apple|cloudflare|fastly/.test(providerText);

  if (isSafari && isIphoneOrIpad && hasCommonRelayProvider) {
    return (
      'No iPhone/iPad com Safari, esse resultado pode estar relacionado ao iCloud Private Relay ou ao recurso de privacidade do Safari. ' +
      "Para tentar mostrar o IP real, use o menu da página no Safari e escolha 'Mostrar Endereço IP', quando disponível. Depois, toque em Atualizar diagnóstico."
    );
  }

  return '';
}

function setStatus(message, kind = 'neutral') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.remove('status-success', 'status-error');

  if (kind === 'success') {
    elements.statusMessage.classList.add('status-success');
  } else if (kind === 'error') {
    elements.statusMessage.classList.add('status-error');
  }
}

function updateInterface(model) {
  elements.protocol.textContent = fallbackValue(model.connection.protocol, 'Não identificado');
  elements.timestamp.textContent = fallbackValue(model.connection.timestamp, 'Não informado');

  elements.ipAddress.textContent = fallbackValue(model.ip.query, 'Não informado');
  elements.isp.textContent = fallbackValue(model.ip.isp, 'Não informado');
  elements.org.textContent = fallbackValue(model.ip.org, 'Não informado');
  elements.asn.textContent = fallbackValue(model.ip.as, 'Não informado');
  elements.city.textContent = fallbackValue(model.ip.city, 'Não informado');
  elements.region.textContent = fallbackValue(model.ip.regionName, 'Não informado');
  elements.country.textContent = fallbackValue(model.ip.country, 'Não informado');
  elements.ipType.textContent = fallbackValue(model.ip.type, 'Não identificado');
  elements.ipOrigin.textContent = fallbackValue(model.ip.origin, 'Não informado');
  elements.proxyWarning.textContent = fallbackValue(model.ip.proxyWarning, 'Não informado');

  elements.browserName.textContent = fallbackValue(model.env.browserName, 'Não identificado');
  elements.browserVersion.textContent = fallbackValue(model.env.browserVersion, 'Não identificado');
  elements.osName.textContent = fallbackValue(model.env.osName, 'Não identificado');
  elements.deviceType.textContent = fallbackValue(model.env.deviceType, 'Desconhecido');
  elements.language.textContent = fallbackValue(model.env.language, 'Não informado');
  elements.languages.textContent = fallbackValue(model.env.languages, 'Não informado');
  elements.platform.textContent = fallbackValue(model.env.platform, 'Não informado');
  elements.vendor.textContent = fallbackValue(model.env.vendor, 'Não informado');
  elements.userAgent.textContent = fallbackValue(model.env.userAgent, 'Não informado');
}

function buildDiagnosticText(model) {
  return [
    'Diagnóstico de Rede - Aptu',
    '',
    'Status da consulta:',
    `${fallbackValue(model.connection.statusText, 'Não informado')}`,
    '',
    'Conexão:',
    `Protocolo: ${fallbackValue(model.connection.protocol, 'Não identificado')}`,
    `Data/Hora: ${fallbackValue(model.connection.timestamp, 'Não informado')}`,
    '',
    'Endereço IP:',
    `IP externo: ${fallbackValue(model.ip.query, 'Não informado')}`,
    `Tipo de IP: ${fallbackValue(model.ip.type, 'Não identificado')}`,
    `Origem da consulta: ${fallbackValue(model.ip.origin, 'Não informado')}`,
    `IP interno/local: ${fallbackValue(model.ip.localIp, 'Não informado')}`,
    '',
    'Proxy/Privacidade:',
    `Possível proxy, relay, CDN ou VPN: ${fallbackValue(model.ip.proxyDetected, 'Não validado')}`,
    `Observação: ${fallbackValue(model.ip.proxyWarning, 'Não informado')}`,
    '',
    'Provedor do IP externo:',
    `ISP: ${fallbackValue(model.ip.isp, 'Não informado')}`,
    `Organização: ${fallbackValue(model.ip.org, 'Não informado')}`,
    `ASN: ${fallbackValue(model.ip.as, 'Não informado')}`,
    '',
    'Localização aproximada:',
    `${fallbackValue(model.ip.city, 'Não informado')} - ${fallbackValue(model.ip.regionName, 'Não informado')}`,
    `${fallbackValue(model.ip.country, 'Não informado')}`,
    '',
    'Navegador e sistema:',
    `Navegador: ${fallbackValue(model.env.browserName, 'Não identificado')}`,
    `Versão: ${fallbackValue(model.env.browserVersion, 'Não identificado')}`,
    `Sistema operacional: ${fallbackValue(model.env.osName, 'Não identificado')}`,
    `Tipo de dispositivo: ${fallbackValue(model.env.deviceType, 'Desconhecido')}`,
    `Plataforma: ${fallbackValue(model.env.platform, 'Não informado')}`,
    `Vendor: ${fallbackValue(model.env.vendor, 'Não informado')}`,
  ].join('\n');
}

function buildWhatsAppDiagnosticText(model) {
  return [
    '*Diagnóstico de Rede - Aptu*',
    '',
    `*Status da consulta:* ${fallbackValue(model.connection.statusText, 'Não informado')}`,
    '',
    '*Conexão:*',
    `*Protocolo:* ${fallbackValue(model.connection.protocol, 'Não identificado')}`,
    `*Data/Hora:* ${fallbackValue(model.connection.timestamp, 'Não informado')}`,
    '',
    '*Endereço IP:*',
    `*IP externo:* ${fallbackValue(model.ip.query, 'Não informado')}`,
    `*Tipo de IP:* ${fallbackValue(model.ip.type, 'Não identificado')}`,
    `*Origem da consulta:* ${fallbackValue(model.ip.origin, 'Não informado')}`,
    `*IP interno/local:* ${fallbackValue(model.ip.localIp, 'Não informado')}`,
    '',
    '*Proxy/Privacidade:*',
    `*Possível proxy, relay, CDN ou VPN:* ${fallbackValue(model.ip.proxyDetected, 'Não validado')}`,
    `*Observação:* ${fallbackValue(model.ip.proxyWarning, 'Não informado')}`,
    '',
    '*Provedor do IP externo:*',
    `*ISP:* ${fallbackValue(model.ip.isp, 'Não informado')}`,
    `*Organização:* ${fallbackValue(model.ip.org, 'Não informado')}`,
    `*ASN:* ${fallbackValue(model.ip.as, 'Não informado')}`,
    '',
    '*Localização aproximada:*',
    `${fallbackValue(model.ip.city, 'Não informado')} - ${fallbackValue(model.ip.regionName, 'Não informado')}`,
    `${fallbackValue(model.ip.country, 'Não informado')}`,
    '',
    '*Navegador e sistema:*',
    `*Navegador:* ${fallbackValue(model.env.browserName, 'Não identificado')}`,
    `*Versão:* ${fallbackValue(model.env.browserVersion, 'Não identificado')}`,
    `*Sistema operacional:* ${fallbackValue(model.env.osName, 'Não identificado')}`,
    `*Tipo de dispositivo:* ${fallbackValue(model.env.deviceType, 'Desconhecido')}`,
    `*Plataforma:* ${fallbackValue(model.env.platform, 'Não informado')}`,
    `*Vendor:* ${fallbackValue(model.env.vendor, 'Não informado')}`,
  ].join('\n');
}

function buildWhatsAppUrl(diagnosticText) {
  const fallbackText =
    'Segue meu diagnóstico de rede:\n\nNão consegui gerar automaticamente o diagnóstico completo de rede.';
  const baseMessage = diagnosticText
    ? `Segue meu diagnóstico de rede:\n\n${diagnosticText}`
    : fallbackText;
  const normalizedMessage = baseMessage.replace(/\n/g, '\r\n');

  return (
    `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}` +
    `&text=${encodeURIComponent(normalizedMessage)}&type=phone_number&app_absent=0`
  );
}

function openSupportWhatsApp(event) {
  event.preventDefault();

  const hasLoadedDiagnostic = Boolean(latestDiagnostic);
  const diagnosticText = hasLoadedDiagnostic ? buildWhatsAppDiagnosticText(latestDiagnostic) : '';
  const whatsappUrl = buildWhatsAppUrl(diagnosticText);
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

function showActionToast(message, kind = 'neutral') {
  if (!elements.actionToast) return;
  if (actionToastTimeoutId) {
    clearTimeout(actionToastTimeoutId);
  }

  const toast = elements.actionToast;
  toast.textContent = message;
  toast.classList.remove('hidden', 'toast-success', 'toast-error', 'toast-neutral');
  toast.classList.add(kind === 'success' ? 'toast-success' : kind === 'error' ? 'toast-error' : 'toast-neutral');

  actionToastTimeoutId = setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('toast-success', 'toast-error', 'toast-neutral');
    actionToastTimeoutId = null;
  }, 2500);
}

function showCopyButtonFeedback() {
  if (copyFeedbackTimeoutId) {
    clearTimeout(copyFeedbackTimeoutId);
  }

  elements.copyButton.textContent = 'Conteúdo copiado';
  elements.copyButton.classList.add('button-success');
  showActionToast('Diagnóstico copiado para a área de transferência.', 'success');
  copyFeedbackTimeoutId = setTimeout(() => {
    elements.copyButton.textContent = 'Copiar diagnóstico';
    elements.copyButton.classList.remove('button-success');
    copyFeedbackTimeoutId = null;
  }, 2500);
}

function showRefreshButtonFeedback() {
  if (refreshFeedbackTimeoutId) {
    clearTimeout(refreshFeedbackTimeoutId);
  }

  elements.refreshButton.textContent = 'Diagnóstico atualizado';
  elements.refreshButton.classList.add('button-success');
  showActionToast('Diagnóstico atualizado com sucesso.', 'success');
  refreshFeedbackTimeoutId = setTimeout(() => {
    elements.refreshButton.textContent = 'Atualizar diagnóstico';
    elements.refreshButton.classList.remove('button-success');
    refreshFeedbackTimeoutId = null;
  }, 2500);
}

async function copyDiagnosticText() {
  if (!latestDiagnostic) {
    setStatus('Nenhum diagnóstico disponível para copiar.', 'error');
    return;
  }

  const diagnosticText = buildDiagnosticText(latestDiagnostic);
  elements.diagnosticText.value = diagnosticText;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(diagnosticText);
      elements.manualCopySection.classList.add('hidden');
      setStatus('Diagnóstico copiado com sucesso.', 'success');
      showCopyButtonFeedback();
      return;
    } catch (_error) {
      // Continua para fallback manual.
    }
  }

  elements.manualCopySection.classList.remove('hidden');
  elements.diagnosticText.focus();
  elements.diagnosticText.select();
  showActionToast('Cópia automática indisponível. Use a cópia manual abaixo.', 'error');
  setStatus(
    'Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.',
    'error'
  );
}

function getFriendlyFetchError(error) {
  const message = error && error.message ? error.message : '';

  if (/AbortError|aborted|timeout/i.test(message)) {
    return 'Falha temporária ao consultar o IP. Tente novamente em alguns segundos.';
  }

  if (/Load failed|Failed to fetch|NetworkError|fetch/i.test(message)) {
    return (
      'Não foi possível obter as informações do IP neste momento. ' +
      'Tente novamente em alguns segundos ou envie o diagnóstico parcial ao suporte.'
    );
  }

  return (
    message ||
    'Não foi possível obter as informações do IP neste momento. Tente novamente ou envie o diagnóstico parcial ao suporte.'
  );
}

async function runDiagnostic(showRefreshFeedback = false) {
  const nowMs = Date.now();
  if (showRefreshFeedback && latestDiagnostic) {
    const elapsedMs = nowMs - lastRunAt;
    if (lastRunSucceeded && elapsedMs < MIN_REFRESH_INTERVAL_MS) {
      latestDiagnostic.connection.timestamp = new Date().toLocaleString('pt-BR');
      latestDiagnostic.connection.statusText =
        'Aguarde alguns segundos antes de atualizar novamente. Isso evita bloqueios temporários da consulta de IP.';
      updateInterface(latestDiagnostic);
      elements.diagnosticText.value = buildDiagnosticText(latestDiagnostic);
      setStatus(latestDiagnostic.connection.statusText, 'neutral');
      showRefreshButtonFeedback();
      return;
    }
    if (!lastRunSucceeded && elapsedMs < MIN_ERROR_RETRY_INTERVAL_MS) {
      latestDiagnostic.connection.timestamp = new Date().toLocaleString('pt-BR');
      latestDiagnostic.connection.statusText = 'Falha temporária ao consultar o IP. Tente novamente em alguns segundos.';
      updateInterface(latestDiagnostic);
      elements.diagnosticText.value = buildDiagnosticText(latestDiagnostic);
      setStatus(latestDiagnostic.connection.statusText, 'error');
      showRefreshButtonFeedback();
      return;
    }
  }

  const now = new Date();
  const connection = {
    protocol: window.location.protocol.replace(':', '').toUpperCase(),
    timestamp: now.toLocaleString('pt-BR'),
    statusText: 'Carregando diagnóstico...',
  };

  const env = getEnvironmentInfo();
  setStatus('Carregando diagnóstico...', 'neutral');

  try {
    const normalizedIp = await fetchNormalizedIpInfo();
    latestDiagnostic = {
      connection,
      ip: {
        query: normalizedIp.ip,
        isp: normalizedIp.isp || normalizedIp.org,
        org: normalizedIp.org,
        as: normalizedIp.asn,
        city: normalizedIp.city,
        regionName: normalizedIp.region,
        country: normalizedIp.country,
        type: detectIpType(normalizedIp.ip),
        origin: fallbackValue(normalizedIp.origin, 'Não informado'),
        localIp: 'Não informado / não disponível pelo navegador',
        proxyDetected: 'Não',
        proxyWarning: '',
        status: normalizedIp.status,
        message: normalizedIp.message,
        raw: normalizedIp.raw,
      },
      env,
    };
    const proxyResult = detectProxyRelayVpnRisk(latestDiagnostic);
    latestDiagnostic.ip.proxyDetected = proxyResult.level === 'warning' ? 'Sim' : 'Não';
    latestDiagnostic.ip.proxyWarning = proxyResult.text;
    const safariGuidance = getSafariPrivacyGuidance(latestDiagnostic);
    if (safariGuidance) {
      latestDiagnostic.ip.proxyWarning = `${latestDiagnostic.ip.proxyWarning} ${safariGuidance}`;
    }
    latestDiagnostic.connection.statusText = 'Consulta realizada com sucesso.';
    lastRunAt = Date.now();
    lastRunSucceeded = true;
    updateInterface(latestDiagnostic);
    elements.diagnosticText.value = buildDiagnosticText(latestDiagnostic);
    setStatus('Consulta realizada com sucesso.', 'success');
    if (showRefreshFeedback) {
      showRefreshButtonFeedback();
    }
  } catch (error) {
    const friendlyError = getFriendlyFetchError(error);
    const errorDetail = error && error.message ? String(error.message) : '';
    latestDiagnostic = {
      connection,
      ip: {
        query: 'Não informado',
        isp: 'Não informado',
        org: 'Não informado',
        as: 'Não informado',
        city: 'Não informado',
        regionName: 'Não informado',
        country: 'Não informado',
        type: 'Não identificado',
        origin: 'Consulta parcial',
        localIp: 'Não informado / não disponível pelo navegador',
        proxyDetected: 'Não validado',
        proxyWarning: 'Não foi possível validar possível uso de proxy, relay, CDN ou VPN no momento.',
        status: 'error',
        message: friendlyError,
        raw: {},
      },
      env,
    };
    const isSafariMobile =
      fallbackValue(env.browserName, '').toLowerCase().includes('safari') &&
      /ios|ipados/i.test(fallbackValue(env.osName, ''));
    if (isSafariMobile && /Load failed|Failed to fetch/i.test(errorDetail)) {
      latestDiagnostic.ip.proxyWarning = `${latestDiagnostic.ip.proxyWarning} Se você acabou de tocar em 'Mostrar Endereço IP' no Safari, aguarde alguns segundos e toque em Atualizar diagnóstico. O Safari pode alterar temporariamente a rota de privacidade antes de liberar o IP real para o site.`;
    }
    latestDiagnostic.connection.statusText = friendlyError;
    lastRunAt = Date.now();
    lastRunSucceeded = false;
    updateInterface(latestDiagnostic);
    elements.diagnosticText.value = buildDiagnosticText(latestDiagnostic);
    setStatus(
      `${friendlyError}${errorDetail ? ` Detalhe técnico: ${errorDetail}` : ''}`,
      'error'
    );
  }
}

function bindEvents() {
  elements.copyButton.addEventListener('click', copyDiagnosticText);
  elements.refreshButton.addEventListener('click', () => runDiagnostic(true));
  elements.supportButton.addEventListener('click', openSupportWhatsApp);
}

function init() {
  bindEvents();
  runDiagnostic();
}

init();
