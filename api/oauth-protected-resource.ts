// Protected Resource Metadata (RFC 9728) do conector MCP: diz ao Claude que quem emite os
// tokens do /api/mcp é o Supabase Auth do projeto. Servido em
// /.well-known/oauth-protected-resource[/api/mcp] pelo rewrite do vercel.json.

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''

export function GET(request: Request): Response {
  const origin = process.env.FOCONOW_PUBLIC_URL ?? new URL(request.url).origin
  const body = {
    resource: `${origin}/api/mcp`,
    authorization_servers: [`${SUPABASE_URL}/auth/v1`],
    bearer_methods_supported: ['header'],
    resource_name: 'FocoNow',
  }
  return Response.json(body, {
    headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' },
  })
}
