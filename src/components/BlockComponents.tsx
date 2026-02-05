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
    <footer className="bg-gray-900 text-white py-12 px-4">
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
