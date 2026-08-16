import type { TemplateConfig } from '../../types/template.types';

export const eleganceFloraV1Config: TemplateConfig = {
  slug:        'elegance-flora-v1',
  name:        'Elegance & Beauty Flora',
  description: 'Warm, luxury beauty salon & clinic template with consultation buttons, service cards, and floral art.',
  category:    'beauty',
  thumbnail:   '/template-thumbnails/elegance-flora-v1.jpg',

  supports: {
    bgImage:             true,
    logo:                true,
    customFonts:         true,
    iconStyles:          ['outline', 'filled'],
    maxBlocks:           30,
    supportedBlockTypes: ['LINK', 'YOUTUBE_CHANNEL', 'INSTAGRAM_PROFILE'],
  },

  editableSections: [
    { id: 'header',   label: 'Brand Header',       icon: 'User',   description: 'Avatar, business name, bio and floral watermark' },
    { id: 'actions',  label: 'Consultation Actions', icon: 'Phone',  description: 'Quick Call and WhatsApp consultation buttons' },
    { id: 'services', label: 'Service & Booking Cards', icon: 'Scissors', description: 'Book appointment service items with thumbnail images' },
  ],

  themeSchema: {
    primaryColor:        { type: 'color',  label: 'Button & Card Color', default: '#736154' },
    textColor:           { type: 'color',  label: 'Button Text Color',   default: '#ffffff' },
    backgroundColor:     { type: 'color',  label: 'Page Background',     default: '#FAF7F2' },
    headingColor:        { type: 'color',  label: 'Heading Color',       default: '#1E1A17' },
    fontFamily:          { type: 'font',   label: 'Font Style',          default: 'Poppins', options: ['Poppins', 'Inter', 'Playfair Display', 'Raleway'] },
    borderRadius:        { type: 'range',  label: 'Card Rounding',       default: 14, min: 4, max: 32, unit: 'px' },
    spacing:             { type: 'range',  label: 'Item Spacing',        default: 10, min: 6, max: 24, unit: 'px' },
    showFloralWatermark: { type: 'toggle', label: 'Floral Background Art', default: true },
    consultationTitle:   { type: 'select', label: 'Action Section Title', default: 'For consultations', options: ['For consultations', 'Quick Contact', 'Get in Touch'] },
    bookingTitle:        { type: 'select', label: 'Services Section Title', default: 'Book an appointment', options: ['Book an appointment', 'Our Services', 'Featured Menu'] },
    showLogo:            { type: 'toggle', label: 'Show Watermark',      default: true },
  },
};
