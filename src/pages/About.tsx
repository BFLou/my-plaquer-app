import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Mail, 
  Users, 
  Database, 
  Map, 
  Camera, 
  Share2, 
  BookOpen,
  Route,
  Send,
  LucideIcon
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

// Type definitions
type SectionKey = 'mission' | 'features' | 'data' | 'contact';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  isComingSoon: boolean;
}

interface CounterAnimationProps {
  end: number;
  duration?: number;
  label: string;
  icon: LucideIcon;
}

const AboutPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionKey>('mission');
  const [animationTriggered, setAnimationTriggered] = useState<Record<SectionKey, boolean>>({
    mission: false,
    features: false,
    data: false,
    contact: false
  });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Updated to only include the sections we're keeping
  const sectionRefs = {
    mission: useRef<HTMLElement>(null),
    features: useRef<HTMLElement>(null),
    data: useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null)
  };

  // Observer for scroll animations
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-100px 0px 0px 0px', // Offset to account for sticky header
      threshold: 0.25
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id as SectionKey;
          setAnimationTriggered(prev => ({ ...prev, [sectionId]: true }));
          
          // Set active section for nav highlighting
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section refs
    Object.entries(sectionRefs).forEach(([, ref]) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  // Fixed scroll to section - adding offset for sticky header
  const scrollToSection = (sectionId: SectionKey) => {
    setActiveSection(sectionId);
    const yOffset = -80; // Adjust this value based on your header height
    const element = sectionRefs[sectionId].current;
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with Formspree
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://formspree.io/f/mkgbnrgn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });
      
      if (response.ok) {
        toast.success('Thank you! Your message has been sent successfully.');
        setFormData({
          name: '',
          email: '',
          message: ''
        });
      } else {
        throw new Error('Form submission failed');
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feature cards data - updated with coming soon badges
  const features: Feature[] = [
    {
      icon: Map,
      title: "Interactive Map",
      description: "Explore London's blue plaques on our interactive map with filtering by historical period, profession, and location.",
      color: "blue",
      isComingSoon: false
    },
    {
      icon: Camera,
      title: "Visit Tracking",
      description: "Check in at plaques you visit and build your personal collection of historical discoveries.",
      color: "green",
      isComingSoon: false
    },
    {
      icon: Route,
      title: "Custom Routes",
      description: "Create walking routes connecting multiple plaques to discover history at your own pace.",
      color: "amber",
      isComingSoon: false
    },
    {
      icon: BookOpen,
      title: "Historical Context",
      description: "Learn about the historical significance of each plaque with detailed information and related stories.",
      color: "purple",
      isComingSoon: false
    },
    {
      icon: Share2,
      title: "Share & Collect",
      description: "Create themed collections and share your discoveries with friends and other history enthusiasts.",
      color: "pink",
      isComingSoon: true
    },
    {
      icon: Users,
      title: "Community",
      description: "Join a community of history explorers, share photos, and contribute to our growing database.",
      color: "indigo",
      isComingSoon: true
    }
  ];

  // Stats counter animation - removed Active Explorers
  const CounterAnimation = ({ end, duration = 2000, label, icon: Icon }: CounterAnimationProps) => {
    const [count, setCount] = useState(0);
    const counterRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            const startTime = performance.now();
            const updateCounter = (currentTime: number) => {
              const elapsedTime = currentTime - startTime;
              const progress = Math.min(elapsedTime / duration, 1);
              
              setCount(Math.floor(progress * end));
              
              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              }
            };
            
            requestAnimationFrame(updateCounter);
          }
        },
        { threshold: 0.1 }
      );
      
      if (counterRef.current) {
        observer.observe(counterRef.current);
      }
      
      return () => {
        if (counterRef.current) {
          observer.unobserve(counterRef.current);
        }
      };
    }, [end, duration, hasAnimated]);
    
    return (
      <div ref={counterRef} className="bg-white rounded-lg shadow-sm p-6 flex items-center">
        <div className="p-4 bg-blue-100 rounded-2xl mr-4">
          <Icon className="text-blue-600" size={28} />
        </div>
        <div>
          <div className="text-3xl font-bold">{count.toLocaleString()}</div>
          <div className="text-gray-500">{label}</div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer 
      activePage="about"
      simplifiedFooter={false} // Use the full footer
    >
{/* Hero Section with decorative background circles */}
<section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 px-4 overflow-hidden">
  {/* Decorative background circles */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
    <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
    <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
  </div>
  
  <div className="container mx-auto max-w-5xl relative z-10">
    <h1 className="text-2xl font-bold">About Plaquer</h1>
    <p className="opacity-90 mt-1">
      Discover and explore London's rich history through its iconic blue plaques marking historical locations.
    </p>
  </div>
</section>

{/* Navigation Pills - Sticky */}
<div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm py-2">
  <div className="container mx-auto px-4 overflow-x-auto">
    <div className="flex gap-2 max-w-5xl mx-auto">
      {(Object.keys(sectionRefs) as SectionKey[]).map((section) => (
        <button 
          key={section}
          className={`px-4 py-3 font-medium text-sm ${
            activeSection === section 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => scrollToSection(section)}
        >
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      ))}
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Mission Section */}
        <section 
          id="mission" 
          ref={sectionRefs.mission}
          className={`py-16 transition-all duration-1000 ${
            animationTriggered.mission 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 order-2 md:order-1">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-none">Our Mission</Badge>
              <h2 className="text-3xl font-bold mb-6">Connecting People with History</h2>
              <p className="text-gray-700 mb-4">
                Plaquer was created with a simple mission: to connect people with the rich history that surrounds them in their daily lives. London's blue plaques mark the homes and workplaces of significant historical figures, but many of these stories remain hidden in plain sight.
              </p>
              <p className="text-gray-700 mb-6">
                We believe that history becomes more meaningful when it's personal. By helping you discover, track, and share these historical markers, we hope to make London's past come alive in a way that's engaging and accessible for everyone.
              </p>
{/* Example button updates in the Mission section */}
<div className="flex flex-wrap gap-4">
  <Button 
    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium shadow-sm flex items-center gap-2"
    onClick={() => navigate('/discover')}
  >
    <Map size={16} /> Explore Map
  </Button>
  <Button 
    variant="outline" 
    className="border border-gray-200 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg font-medium flex items-center gap-2"
    onClick={() => navigate('/collections')}
  >
    <BookOpen size={16} /> View Collections
  </Button>
</div>
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-200 rounded-xl transform rotate-3"></div>
                <div className="relative aspect-video overflow-hidden rounded-lg">
<img
  src="/images/plaquer-explorer.png"
  alt="People exploring London blue plaques"
  className="object-contain w-full h-full"  // Changed from object-cover
/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features" 
          ref={sectionRefs.features}
          className={`py-16 transition-all duration-1000 ${
            animationTriggered.features 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-none">Features</Badge>
            <h2 className="text-3xl font-bold">How Plaquer Works</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover, track, and share London's historical markers with our intuitive features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-500 transform hover:-translate-y-1 hover:shadow-md ${
                  animationTriggered.features 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`h-3 bg-${feature.color}-500`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                      <feature.icon className={`text-${feature.color}-600`} size={24} />
                    </div>
                    {feature.isComingSoon && (
                      <Badge className="bg-amber-100 text-amber-700 border-none">Coming Soon</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section - Removed Active Explorers */}
        <section className={`py-12 transition-all duration-1000 ${
          animationTriggered.features 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CounterAnimation end={3000} label="Blue Plaques" icon={MapPin} />
            <CounterAnimation end={150} label="Years of History" icon={BookOpen} />
          </div>
        </section>

        {/* Data Sources Section - Updated to Open Plaques */}
        <section 
          id="data" 
          ref={sectionRefs.data}
          className={`py-16 transition-all duration-1000 ${
            animationTriggered.data 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-100 rounded-xl transform -rotate-2 transition-transform group-hover:rotate-0"></div>
                <div className="relative bg-white rounded-lg shadow-md p-6 border">
                  <div className="flex justify-between border-b pb-4 mb-4">
                    <div className="flex items-center">
                      <Database className="text-blue-600 mr-2" size={20} />
                      <span className="font-bold">Plaquer Database</span>
                    </div>
                    <Badge>3,000+ Entries</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-medium">Blue Plaques</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6 mt-1">English Heritage official plaques</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                        <span className="font-medium">Green Plaques</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6 mt-1">Westminster City Council plaques</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-amber-700 rounded-full mr-2"></div>
                        <span className="font-medium">Brown Plaques</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6 mt-1">Historic buildings and sites</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-600 rounded-full mr-2"></div>
                        <span className="font-medium">Other Plaques</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6 mt-1">Various commemorative plaques and markers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <Badge className="mb-4 bg-green-100 text-green-700 border-none">Our Data</Badge>
              <h2 className="text-3xl font-bold mb-6">Accurate & Comprehensive</h2>
              <p className="text-gray-700 mb-4">
                Plaquer's database is powered by Open Plaques, a community-led project that catalogues commemorative plaques across the UK and beyond. We've enhanced this data with additional information and location accuracy.
              </p>
              <p className="text-gray-700 mb-6">
                We also welcome contributions from our community. If you notice missing information or have photos of plaques to share, please let us know.
              </p>
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => scrollToSection('contact')}
              >
                <Mail size={16} /> Suggest Updates
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section - Updated with Formspree */}
        <section 
          id="contact" 
          ref={sectionRefs.contact}
          className={`py-16 transition-all duration-1000 ${
            animationTriggered.contact 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white"></div>
              <div className="absolute bottom-10 left-20 w-60 h-60 rounded-full bg-white"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-white/20 text-white border-none">Get In Touch</Badge>
                <h2 className="text-3xl font-bold">Contact Us</h2>
                <p className="mt-4 max-w-2xl mx-auto opacity-90">
                  Have questions, suggestions, or want to contribute to Plaquer? We'd love to hear from you!
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Contact Form with Formspree */}
                <div className="bg-white rounded-lg p-6 text-gray-800">
                  <h3 className="text-xl font-bold mb-4">Send us a message</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        placeholder="Your message here..."
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gap-2"
                      disabled={isSubmitting}
                    >
                      <Send size={16} /> 
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </div>
                
                {/* Direct Contact */}
                <div className="flex flex-col justify-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4">
                    <h3 className="text-xl font-bold mb-4">Email Us Directly</h3>
                    <p className="mb-4">
                      Prefer to use your own email client? Feel free to reach out to us directly.
                    </p>
                    <Button 
                      className="bg-white text-blue-600 hover:bg-blue-50 w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                      onClick={() => window.location.href = 'mailto:contact@plaquer.app'}
                    >
                      <Mail className="mr-2" size={18} />
                      contact@plaquer.app
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Exploring?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of history enthusiasts discovering London's rich heritage one plaque at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium shadow-sm flex items-center gap-2"
              onClick={() => navigate('/discover')}
            >
              <MapPin size={18} /> Start Exploring
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

export default AboutPage;