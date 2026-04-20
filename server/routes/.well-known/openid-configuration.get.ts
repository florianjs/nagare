export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const issuer = (config.public.appUrl as string).replace(/\/$/, '')
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  setHeader(event, 'Content-Type', 'application/json')
  return {
    issuer,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    id_token_signing_alg_values_supported: ['RS256'],
    response_types_supported: ['id_token'],
    subject_types_supported: ['public'],
  }
})
