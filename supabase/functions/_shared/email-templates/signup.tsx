/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu email en Blooglee</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/email-assets/blooglee-logo.png"
          width="140"
          height="auto"
          alt="Blooglee"
          style={{ margin: '0 0 24px' }}
        />
        <Heading style={h1}>¡Bienvenido a Blooglee!</Heading>
        <Text style={text}>
          Gracias por registrarte en{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Estás a un clic de empezar a generar artículos de blog con IA.
        </Text>
        <Text style={text}>
          Confirma tu dirección de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) para activar tu cuenta:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={footer}>
          Si no has creado una cuenta en Blooglee, puedes ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#8B5CF6', textDecoration: 'underline' }
const button = {
  backgroundColor: '#8B5CF6',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }
