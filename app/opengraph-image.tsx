import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "SurebetFlow — Calculadora e Gerenciador de Surebet"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(22,163,74,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow top-left */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            padding: "0 80px",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#1e3a8a",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "white" }}>
              SurebetFlow
            </span>
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(22,163,74,0.1)",
              border: "1px solid rgba(22,163,74,0.3)",
              borderRadius: "100px",
              padding: "8px 20px",
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "18px", color: "#1e3a8a", fontWeight: 600 }}>
              ⚡ Lucro garantido — é matemática pura
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.1,
              margin: "0 0 20px 0",
            }}
          >
            Calcular vitórias nunca{" "}
            <span style={{ color: "#1e3a8a" }}>foi tão simples</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "24px",
              color: "#9ca3af",
              margin: 0,
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            Calculadora de arbitragem 2-way e 3-way · Múltiplos perfis · Controle financeiro completo
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #1e3a8a, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
