import React from "react";
import { Button } from "@/components/ui/button";

interface BlockConfig {
  [key: string]: string | number | boolean | undefined;
  bg_color?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  cta_link?: string;
  alignment?: string;
  content?: string;
}

// Hero Block
export function HeroBlock({ config }: { config: BlockConfig }) {
  return (
    <div
      className="py-16 px-4 text-center"
      style={{ backgroundColor: config.bg_color || "#ffffff" }}
    >
      <h1 className="text-4xl md:text-6xl font-bold mb-4">
        {config.headline || "Welcome to our site"}
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        {config.subheadline || "Your subheading goes here"}
      </p>
      {config.cta_text && (
        <Button
          size="lg"
          onClick={() => {
            if (config.cta_link) {
              window.location.href = config.cta_link;
            }
          }}
        >
          {config.cta_text}
        </Button>
      )}
    </div>
  );
}

// Text Block
export function TextBlock({ config }: { config: BlockConfig }) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[config.alignment || "left"];

  return (
    <div className={`py-8 px-4 max-w-3xl mx-auto ${alignmentClass}`}>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{
          __html: config.content || "No content provided",
        }}
      />
    </div>
  );
}

// Pricing Block
export function PricingBlock({ config }: { config: BlockConfig }) {
  return (
    <div className="py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">{config.title || "Pricing"}</h2>
      </div>
      {config.show_description && (
        <p className="text-center text-gray-600 mb-8">
          Choose the perfect plan for your needs
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {[
          { name: "Economy", price: "$30/day", features: ["Basic insurance", "Support"] },
          { name: "Premium", price: "$60/day", features: ["Full insurance", "24/7 support", "GPS tracking"] },
          { name: "Business", price: "Custom", features: ["All features", "Dedicated account", "Fleet management"] },
        ].map((plan) => (
          <div
            key={plan.name}
            className="border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{plan.price}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm text-gray-600">
                  ✓ {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full">Choose Plan</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vehicles Block
export function VehiclesBlock({ config, vehicles = [] }: { config: BlockConfig; vehicles?: any[] }) {
  const columnsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[config.columns || 3];

  return (
    <div className="py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">{config.title || "Our Fleet"}</h2>
      </div>
      <div className={`grid ${columnsClass} gap-6 max-w-6xl mx-auto`}>
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="bg-gray-300 h-48 flex items-center justify-center">
              {vehicle.image ? (
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">No image</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-1">{vehicle.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{vehicle.description}</p>
              <p className="text-lg font-bold text-blue-600 mb-3">
                ${vehicle.daily_rate}/day
              </p>
              <Button className="w-full" size="sm">
                Book Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Booking Block
export function BookingBlock({ config }: { config: BlockConfig }) {
  return (
    <div className="py-12 px-4 bg-blue-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {config.title || "Book a Vehicle"}
        </h2>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pick-up Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Return Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {config.show_availability && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Vehicle Type
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>Economy</option>
                  <option>SUV</option>
                  <option>Van</option>
                </select>
              </div>
            )}
            <Button className="w-full" size="lg">
              Check Availability
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Contact Block
export function ContactBlock({ config }: { config: BlockConfig }) {
  return (
    <div className="py-12 px-4 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {config.title || "Contact Us"}
        </h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Your message..."
            ></textarea>
          </div>
          <Button className="w-full">
            {config.submit_text || "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Image Block
export function ImageBlock({ config }: { config: BlockConfig }) {
  return (
    <div className="py-8 px-4">
      {config.image_url && (
        <div className="max-w-4xl mx-auto">
          <img
            src={config.image_url}
            alt={config.alt_text || "Image"}
            style={{ maxHeight: `${config.height || 300}px` }}
            className="w-full object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

// CTA Block
export function CTABlock({ config }: { config: BlockConfig }) {
  return (
    <div
      className="py-12 px-4"
      style={{ backgroundColor: config.bg_color || "#f3f4f6" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        {config.heading && (
          <h2 className="text-4xl font-bold mb-4">{config.heading}</h2>
        )}
        {config.description && (
          <p className="text-xl text-gray-600 mb-8">{config.description}</p>
        )}
        {config.button_text && (
          <Button
            size="lg"
            onClick={() => {
              if (config.button_link) {
                window.location.href = config.button_link;
              }
            }}
          >
            {config.button_text}
          </Button>
        )}
      </div>
    </div>
  );
}

// Testimonial Block
export function TestimonialBlock({ config, testimonials = [] }: { config: BlockConfig; testimonials?: any[] }) {
  return (
    <div className="py-12 px-4 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold">What Our Customers Say</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[
          {
            quote:
              "Excellent service and friendly staff. Highly recommended!",
            author: "John Doe",
            rating: 5,
          },
          {
            quote: "Best car rental experience I've had.",
            author: "Jane Smith",
            rating: 5,
          },
          {
            quote: "Easy booking process and great prices.",
            author: "Bob Johnson",
            rating: 5,
          },
        ].map((testimonial, i) => (
          <div key={i} className="bg-white p-6 rounded-lg">
            <div className="flex mb-4">
              {[...Array(testimonial.rating)].map((_, j) => (
                <span key={j} className="text-yellow-400 text-lg">
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
            <p className="font-bold">{testimonial.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Footer Block
export function FooterBlock({ config, lessor = {} }: { config: BlockConfig; lessor?: any }) {
  return (
    <footer className="bg-brown-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-bold mb-4">{lessor.name || "Company"}</h3>
          <p className="text-gray-400">{lessor.description || "Your car rental company"}</p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">Home</a></li>
            <li><a href="#" className="hover:text-white">Vehicles</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">FAQ</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">Privacy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <p className="text-gray-400">{lessor.email || "info@company.com"}</p>
          <p className="text-gray-400">{lessor.phone || "+1 (555) 000-0000"}</p>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} {lessor.name || "Company"}. All rights reserved.</p>
      </div>
    </footer>
  );
}

// Gallery Block - NEW
export function GalleryBlock({ config }: { config: BlockConfig }) {
  const columns = config.columns || 3;
  const images = config.images || [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
    "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=400",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400",
  ];
  
  const columnsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns] || "grid-cols-3";

  return (
    <div className="py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">{config.title || "Galleri"}</h2>
        {config.subtitle && <p className="text-gray-600 mt-2">{config.subtitle}</p>}
      </div>
      <div className={`grid ${columnsClass} gap-4 max-w-6xl mx-auto`}>
        {images.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg group cursor-pointer">
            <img
              src={img}
              alt={`Gallery image ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats Block - NEW
export function StatsBlock({ config }: { config: BlockConfig }) {
  const stats = config.stats || [
    { value: "500+", label: "Glade kunder" },
    { value: "50+", label: "Køretøjer" },
    { value: "10+", label: "Års erfaring" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <div className="py-16 px-4" style={{ backgroundColor: config.bg_color || "#f9fafb" }}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">{config.title || "Hvorfor vælge os?"}</h2>
        {config.subtitle && <p className="text-gray-600 mt-2">{config.subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <p className="text-4xl md:text-5xl font-black text-blue-600 mb-2">{stat.value}</p>
            <p className="text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Video Block - NEW
export function VideoBlock({ config }: { config: BlockConfig }) {
  const videoUrl = config.video_url || "";
  
  // Extract YouTube/Vimeo embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{config.title}</h2>
        )}
        {videoUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Indsæt video URL i indstillinger</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Divider Block - NEW
export function DividerBlock({ config }: { config: BlockConfig }) {
  const height = config.height || 40;
  const style = config.style || "line";

  if (style === "space") {
    return <div style={{ height: `${height}px` }} />;
  }

  return (
    <div className="py-4 px-4" style={{ paddingTop: `${height / 2}px`, paddingBottom: `${height / 2}px` }}>
      <hr className="max-w-4xl mx-auto border-gray-200" />
    </div>
  );
}

// Social Block - NEW
export function SocialBlock({ config }: { config: BlockConfig }) {
  const socialLinks = [
    { name: "Facebook", url: config.facebook || "#", icon: "f" },
    { name: "Instagram", url: config.instagram || "#", icon: "📷" },
    { name: "Twitter", url: config.twitter || "#", icon: "𝕏" },
    { name: "LinkedIn", url: config.linkedin || "#", icon: "in" },
  ].filter(s => s.url && s.url !== "#");

  return (
    <div className="py-8 px-4 text-center" style={{ backgroundColor: config.bg_color || "#ffffff" }}>
      {config.title && <h3 className="text-xl font-bold mb-4">{config.title}</h3>}
      <div className="flex justify-center gap-4">
        {socialLinks.length > 0 ? (
          socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors font-bold"
            >
              {social.icon}
            </a>
          ))
        ) : (
          <p className="text-gray-400">Tilføj sociale links i indstillinger</p>
        )}
      </div>
    </div>
  );
}

// FAQ Block - NEW
export function FAQBlock({ config }: { config: BlockConfig }) {
  const faqs = config.faqs || [
    { question: "Hvordan booker jeg et køretøj?", answer: "Du kan nemt booke et køretøj direkte på vores hjemmeside. Vælg dine datoer, vælg bil og gennemfør betalingen." },
    { question: "Hvad er inkluderet i prisen?", answer: "Alle priser inkluderer forsikring, ubegrænsede kilometer og 24/7 roadside assistance." },
    { question: "Kan jeg aflyse min booking?", answer: "Ja, du kan aflyse gratis op til 48 timer før afhentning. Ved senere aflysning tilbageholdes 50% af beløbet." },
    { question: "Hvilke dokumenter skal jeg medbringe?", answer: "Du skal medbringe gyldigt kørekort, ID eller pas, samt det betalingskort der blev brugt til bookingen." },
  ];

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{config.title || "Ofte stillede spørgsmål"}</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="border border-gray-200 rounded-lg group">
              <summary className="p-4 cursor-pointer font-medium hover:bg-gray-50 flex justify-between items-center">
                {faq.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// Map Block - NEW
export function MapBlock({ config }: { config: BlockConfig }) {
  const address = config.address || "Copenhagen, Denmark";
  const height = config.height || 400;
  const encodedAddress = encodeURIComponent(address);

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-6">{config.title}</h2>
        )}
        <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: `${height}px` }}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}`}
          />
        </div>
        {config.show_address && (
          <p className="text-center text-gray-600 mt-4">{address}</p>
        )}
      </div>
    </div>
  );
}
