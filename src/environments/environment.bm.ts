export const environment = {
  production: true,
  name: (window as { [key: string]: any })['env']['name'] || '',
  sitePath: 'igot-bm-sunbird-mdo.idc.tarento.com',
  karmYogiPath: 'http://igot-bm-sunbird.idc.tarento.com',
  cbpPath: 'http://igot-bm-sunbird-cbp.idc.tarento.com',
  portalRoles: (((window as { [key: string]: any })['env']['portalRoles'] || '').split(',')) || [],
  contentHost: (window as { [key: string]: any })['env']['contentHost'] || '',
  contentBucket: (window as { [key: string]: any })['env']['azureBucket'] || '',
  userBucket: (window as { [key: string]: any })['env']['userBucket'] || '',
  domainName: (window as { [key: string]: any })['env']['domainName'] || '',
  mdoPath: (window as { [key: string]: any })['env']['mdoPath'] || '',
  resendOTPTIme: (window as { [key: string]: any })['env']['resendOTPTIme'] || 120,
}
