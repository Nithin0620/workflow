// Server component wrapper — enables ISR for the contact page.
// The actual interactive form lives in contact-client.tsx (client component).
export const revalidate = 3600;

export { default } from "./contact-client";
