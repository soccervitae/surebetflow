import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicRoutes = ['/', '/login', '/cadastro', '/verificar-email', '/privacidade', '/termos']
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  // Admin routes: require auth + admin email
  if (pathname.startsWith('/admin')) {
    if (!user) return redirect(request, '/login')
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
    if (!adminEmails.includes(user.email ?? "")) return redirect(request, '/dashboard')
    return supabaseResponse
  }

  // Unauthenticated on protected route
  if (!user && !isPublicRoute) return redirect(request, '/login')

  // Authenticated user trying to access login/cadastro
  if (user && (pathname === '/login' || pathname === '/cadastro')) return redirect(request, '/dashboard')

  // Check email verification for protected routes
  if (user && !isPublicRoute && !pathname.startsWith('/admin')) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
    if (!adminEmails.includes(user.email ?? "") && !user.email_confirmed_at) {
      return redirect(request, `/verificar-email?email=${encodeURIComponent(user.email ?? "")}`)
    }
  }

  // Check subscription for dashboard routes (skip /assinatura, /api/stripe, /onboarding)
  if (user && !isPublicRoute) {
    const isDashboardRoute = pathname.startsWith('/dashboard') ||
      pathname.startsWith('/perfis') ||
      pathname.startsWith('/financeiro') ||
      pathname.startsWith('/suporte') ||
      pathname.startsWith('/calculadora')

    if (isDashboardRoute) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
      const isAdmin = adminEmails.includes(user.email ?? "")

      if (!isAdmin) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .single()

        const hasAccess = sub?.status === "active" || sub?.status === "trialing"
        if (!hasAccess) return redirect(request, '/assinatura')
      }
    }
  }

  return supabaseResponse
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/mp|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
