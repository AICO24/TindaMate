import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface IconProps {
  size?: number;
  color?: string;
}

const svgToUri = (svgString: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

/**
 * Back Chevron (<) Icon
 */
export function ChevronLeftIcon({ size = 22, color = '#111827' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Mail / Email Icon matching reference
 */
export function MailIcon({ size = 18, color = '#6B7280' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Lock / Password Icon
 * Supports solid green padlock (as shown in reference Login screen) or gray outline.
 */
export function LockIcon({
  size = 18,
  color = '#6B7280',
  variant = 'default',
}: IconProps & { variant?: 'default' | 'green' }) {
  let svg = '';

  if (variant === 'green') {
    // Solid green padlock matching reference image Screen 2
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0D7A4D" stroke-width="2.2" stroke-linecap="round"/><rect x="3.5" y="10.5" width="17" height="11" rx="2.5" fill="#0D7A4D"/><circle cx="12" cy="15" r="1.3" fill="#FFFFFF"/><path d="M12 16.3v1.8" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  } else {
    // Clean outline padlock
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2.5" ry="2.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5" fill="${color}" stroke="none"/></svg>`;
  }

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * User / Full Name Icon matching reference
 */
export function UserIcon({ size = 18, color = '#6B7280' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Eye (Show Password) Icon matching reference
 */
export function EyeIcon({ size = 20, color = '#6B7280' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="${color}"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * EyeOff (Hide Password) Icon matching reference
 */
export function EyeOffIcon({ size = 20, color = '#6B7280' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Checkmark Icon for Checkbox
 */
export function CheckIcon({ size = 12, color = '#FFFFFF' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 6"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Alert / Exclamation Circle Icon
 */
export function AlertCircleIcon({ size = 16, color = '#DC2626' }: IconProps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * Authentic Official Google 'G' 4-color Logo
 */
export function GoogleGIcon({ size = 20 }: { size?: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

  return (
    <Image
      source={{ uri: svgToUri(svg) }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
