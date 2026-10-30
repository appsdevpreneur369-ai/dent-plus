import {
  Activity, ArrowRight, ArrowUpRight, Baby, Bell, Calendar, CalendarCheck, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  ClipboardCheck, Clock, Droplet, Eye, FileText, Glasses, HeartHandshake, HeartPulse, Images, Layers, LoaderCircle, Maximize2, LogIn, Mail, MapPin, Menu, MessageCircle,
  MessageSquare, Monitor, Navigation, Phone, ShieldCheck, Smile, Sparkles, Sprout, Stethoscope, Thermometer, Ticket, TriangleAlert,
  UserPlus, Users, X, Zap, type LucideIcon,
} from 'lucide-react';

// Content refers to icons by kebab-case name. 'tooth' is our own glyph (lucide has none). Unknown names fall back to a sparkle.
const ICONS: Record<string, LucideIcon> = {
  activity: Activity, 'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight, baby: Baby, bell: Bell, calendar: Calendar, 'calendar-check': CalendarCheck,
  check: Check, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-alert': CircleAlert,
  'clipboard-check': ClipboardCheck, clock: Clock, droplet: Droplet, eye: Eye, 'file-text': FileText, glasses: Glasses, 'heart-handshake': HeartHandshake, 'heart-pulse': HeartPulse, images: Images,
  layers: Layers, loader: LoaderCircle, 'log-in': LogIn, mail: Mail, 'map-pin': MapPin, maximize: Maximize2, menu: Menu, 'message-circle': MessageCircle,
  'message-square': MessageSquare, monitor: Monitor, navigation: Navigation, phone: Phone, 'shield-check': ShieldCheck, smile: Smile,
  sparkles: Sparkles, sprout: Sprout, stethoscope: Stethoscope, thermometer: Thermometer, ticket: Ticket, 'triangle-alert': TriangleAlert,
  'user-plus': UserPlus, users: Users, x: X, zap: Zap,
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  if (name === 'tooth') return <ToothIcon className={className} strokeWidth={strokeWidth} />;
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" />;
}

/** Line tooth in lucide's style (24 grid, round caps), for the dental department. */
function ToothIcon({ className, strokeWidth }: { className?: string; strokeWidth: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M7.5 3.2c-2.4 0-4 1.9-4 4.6 0 2.2.9 3.6 1.5 5.4.7 2.2.9 4.6 1.6 6.5.4 1 1.6 1 1.9 0l1.1-4c.3-1.1 1.6-1.1 1.9 0l.5 1.8M16.5 3.2c2.4 0 4 1.9 4 4.6 0 2.2-.9 3.6-1.5 5.4" />
      <path d="M7.5 3.2c1.6 0 2.6.9 4.5.9s2.9-.9 4.5-.9" />
      <path d="M14.5 15.2h4.4M15 17.6h3.4M15.5 20h2.4" />
    </svg>
  );
}

/** WhatsApp glyph (lucide ships no brand marks). */
export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
