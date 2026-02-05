import React from 'react';
import {
  HeroBlock,
  TextBlock,
  PricingBlock,
  VehiclesBlock,
  BookingBlock,
  ContactBlock,
  ImageBlock,
  CTABlock,
  TestimonialBlock,
  FooterBlock,
  GalleryBlock,
  StatsBlock,
  VideoBlock,
  DividerBlock,
  SocialBlock,
  FAQBlock,
  MapBlock,
} from '@/components/BlockComponents';

interface BlockData {
  id: string;
  block_type: string;
  config: Record<string, any>;
}

interface LessorData {
  name?: string;
  email?: string;
  phone?: string;
}

interface VehicleData {
  [key: string]: string | number | boolean;
}

export function renderBlock(
  block: BlockData,
  lessor?: LessorData,
  vehicles?: VehicleData[]
) {
  const { block_type, config, id } = block;

  switch (block_type) {
    case 'hero':
      return React.createElement(HeroBlock, { key: id, config });
    case 'text':
      return React.createElement(TextBlock, { key: id, config });
    case 'pricing':
      return React.createElement(PricingBlock, { key: id, config });
    case 'vehicles':
      return React.createElement(VehiclesBlock, { key: id, config, vehicles });
    case 'booking':
      return React.createElement(BookingBlock, { key: id, config });
    case 'contact':
      return React.createElement(ContactBlock, { key: id, config });
    case 'image':
      return React.createElement(ImageBlock, { key: id, config });
    case 'cta':
      return React.createElement(CTABlock, { key: id, config });
    case 'testimonial':
      return React.createElement(TestimonialBlock, { key: id, config });
    case 'footer':
      return React.createElement(FooterBlock, { key: id, config, lessor });
    // New block types
    case 'gallery':
      return React.createElement(GalleryBlock, { key: id, config });
    case 'stats':
      return React.createElement(StatsBlock, { key: id, config });
    case 'video':
      return React.createElement(VideoBlock, { key: id, config });
    case 'divider':
      return React.createElement(DividerBlock, { key: id, config });
    case 'social':
      return React.createElement(SocialBlock, { key: id, config });
    case 'faq':
      return React.createElement(FAQBlock, { key: id, config });
    case 'map':
      return React.createElement(MapBlock, { key: id, config });
    default:
      return React.createElement('div', {
        key: id,
        className: 'p-4 bg-gray-100 text-center',
        children: `Unknown block type: ${block_type}`,
      });
  }
}
