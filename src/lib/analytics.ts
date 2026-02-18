/**
 * Lightweight analytics module.
 * Currently logs events to console. Replace the `send` implementation
 * to forward events to PostHog, Mixpanel, Amplitude, GA4, or any provider.
 */

type EventProperties = Record<string, unknown>;

const IS_DEV = import.meta.env.DEV;

function send(eventName: string, properties?: EventProperties) {
  // TODO: Replace with your analytics provider
  // e.g. posthog.capture(eventName, properties);
  // e.g. mixpanel.track(eventName, properties);
  // e.g. gtag('event', eventName, properties);
  if (IS_DEV) {
    console.log(`[Analytics] ${eventName}`, properties ?? {});
  }
}

export function track(eventName: string, properties?: EventProperties) {
  try {
    send(eventName, properties);
  } catch (err) {
    // Analytics should never break the app
    console.warn('[Analytics] Failed to track event:', eventName, err);
  }
}
