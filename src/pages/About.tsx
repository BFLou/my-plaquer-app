import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Mail, 
  Github, 
  Twitter, 
  Linkedin, 
  ChevronRight, 
  Users, 
  Database, 
  Map, 
  Camera, 
  Share2, 
  BookOpen,
  Route,
  ExternalLink
} from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AboutPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('mission');
  const [animationTriggered, setAnimationTriggered] = useState({});
  const sectionRefs = {
    mission: useRef(null),
    features: useRef(null),
    data: useRef(null),
    team: useRef(null),
    contact: useRef(null)
  };

  // Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setAnimationTriggered(prev => ({ ...prev, [sectionId]: true }));
          
          // Set active section for nav highlighting
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section refs
    Object.entries(sectionRefs).forEach(([key, ref]) => {
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

  // Team members data
  const teamMembers = [
    {
      name: 'Alex Thompson',
      role: 'Founder & Lead Developer',
      image: 'https://i.pravatar.cc/300?img=1',
      bio: 'History enthusiast and software developer with a passion for making history accessible to everyone.'
    },
    {
      name: 'Samantha Chen',
      role: 'UI/UX Designer',
      image: 'https://i.pravatar.cc/300?img=5',
      bio: 'Crafting beautiful, intuitive user experiences that make exploring historical sites a joy.'
    },
    {
      name: 'Marcus Williams',
      role: 'Historical Researcher',
      image: 'https://i.pravatar.cc/300?img=3',
      bio: 'PhD in London History, ensuring our data is accurate and our stories compelling.'
    }
  ];

  // Stats counter animation
  const CounterAnimation = ({ end, duration = 2000, label, icon: Icon }) => {
    const [count, setCount] = useState(0);
    const counterRef = useRef(null);
    const [hasAnimated, setHasAnimated] = useState(false);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            const startTime = performance.now();
            const updateCounter = (currentTime) => {
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

  // Feature cards data
  const features = [
    {
      icon: Map,
      title: "Interactive Map",
      description: "Explore London's blue plaques on our interactive map with filtering by historical period, profession, and location.",
      color: "blue"
    },
    {
      icon: Camera,
      title: "Visit Tracking",
      description: "Check in at plaques you visit and build your personal collection of historical discoveries.",
      color: "green"
    },
    {
      icon: Route,
      title: "Custom Routes",
      description: "Create walking routes connecting multiple plaques to discover history at your own pace.",
      color: "amber"
    },
    {
      icon: BookOpen,
      title: "Historical Context",
      description: "Learn about the historical significance of each plaque with detailed information and related stories.",
      color: "purple"
    },
    {
      icon: Share2,
      title: "Share & Collect",
      description: "Create themed collections and share your discoveries with friends and other history enthusiasts.",
      color: "pink"
    },
    {
      icon: Users,
      title: "Community",
      description: "Join a community of history explorers, share photos, and contribute to our growing database.",
      color: "indigo"
    }
  ];

  // Scroll to section
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    sectionRefs[sectionId].current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageContainer activePage="about" simplifiedFooter>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg transform rotate-12">
              <MapPin className="text-blue-600" size={36} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Plaquer</h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90 mb-8">
              Discover and explore London's rich history through its iconic blue plaques marking the homes and workplaces of remarkable people.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => navigate('/discover')}
              >
                Start Exploring <ChevronRight size={16} className="ml-1" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20"
                onClick={() => scrollToSection('contact')}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Pills - Sticky */}
      <div className="sticky top-[61px] z-30 bg-white border-b border-gray-200 shadow-sm py-2">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 max-w-5xl mx-auto">
            {Object.keys(sectionRefs).map((section) => (
              <Button
                key={section}
                variant={activeSection === section ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => scrollToSection(section)}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Button>
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
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="gap-2"
                  onClick={() => navigate('/discover')}
                >
                  <Map size={16} /> Explore Map
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
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
                    src="/api/placeholder/800/450"
                    alt="People exploring London blue plaques"
                    className="object-cover w-full h-full"
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
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                    <feature.icon className={`text-${feature.color}-600`} size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-12 transition-all duration-1000 ${
          animationTriggered.features 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CounterAnimation end={3000} label="Blue Plaques" icon={MapPin} />
            <CounterAnimation end={150} label="Years of History" icon={BookOpen} />
            <CounterAnimation end={10000} label="Active Explorers" icon={Users} />
          </div>
        </section>

        {/* Data Sources Section */}
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
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <Badge className="mb-4 bg-green-100 text-green-700 border-none">Our Data</Badge>
              <h2 className="text-3xl font-bold mb-6">Accurate & Comprehensive</h2>
              <p className="text-gray-700 mb-4">
                Plaquer's database includes information from various official sources, including English Heritage, the London Borough councils, and other historical organizations. We work to ensure our information is accurate and up-to-date.
              </p>
              <p className="text-gray-700 mb-6">
                We also welcome contributions from our community. If you notice missing information or have photos of plaques to share, please let us know.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium flex items-center text-amber-800">
                  <BookOpen className="mr-2" size={18} />
                  Data Partners
                </h4>
                <ul className="mt-2 space-y-1 text-amber-700">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                    English Heritage
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                    London Borough Archives
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                    Historical Society of London
                  </li>
                </ul>
              </div>
              
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

        {/* Team Section */}
        <section 
          id="team" 
          ref={sectionRefs.team}
          className={`py-16 transition-all duration-1000 ${
            animationTriggered.team 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-none">Our Team</Badge>
            <h2 className="text-3xl font-bold">Meet the Plaque Enthusiasts</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              A passionate team of historians, developers and explorers bringing London's history to life.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-500 transform hover:-translate-y-1 hover:shadow-md ${
                  animationTriggered.team 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-col h-auto py-6"
                  onClick={() => window.location.href = 'mailto:contact@plaquer.app'}
                >
                  <Mail className="mb-2" size={24} />
                  <span>Email Us</span>
                </Button>
                
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-col h-auto py-6"
                  onClick={() => window.open('https://github.com/plaquer', '_blank')}
                >
                  <Github className="mb-2" size={24} />
                  <span>GitHub</span>
                </Button>
                
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-col h-auto py-6"
                  onClick={() => window.open('https://twitter.com/plaquer', '_blank')}
                >
                  <Twitter className="mb-2" size={24} />
                  <span>Twitter</span>
                </Button>
                
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 flex-col h-auto py-6"
                  onClick={() => window.open('https://linkedin.com/company/plaquer', '_blank')}
                >
                  <Linkedin className="mb-2" size={24} />
                  <span>LinkedIn</span>
                </Button>
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
              size="lg"
              className="gap-2"
              onClick={() => navigate('/discover')}
            >
              <MapPin size={18} /> Start Exploring
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => navigate('/')}
            >
              <ExternalLink size={18} /> Learn More
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

export default AboutPage;