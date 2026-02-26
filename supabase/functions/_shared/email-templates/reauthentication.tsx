/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de Blooglee</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/email-assets/blooglee-logo.png"
          width="140"
          height="auto"
          alt="Blooglee"
          style={{ margin: '0 0 24px' }}
        />
        <Heading style={h1}>Código de verificación</Heading>
        <Text style={text}>Usa este código para confirmar tu identidad:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código caducará en breve. Si no lo has solicitado, puedes ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Sora', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  fontFamily: "'Sora', Arial, sans-serif",
  color: '#1A1A2E',
  margin: '0 0 20px',
  letterSpacing: '-0.02em',
}
const text = {
  fontSize: '15px',
  color: '#64748B',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const codeStyle = {
  fontFamily: "'Sora', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#8B5CF6',
  margin: '0 0 32px',
  letterSpacing: '0.15em',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }
