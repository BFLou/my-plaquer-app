import React from 'react';
import { MapPin, Mail, Github, Twitter, Linkedin } from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <PageContainer activePage="about" simplifiedFooter>
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold mb-4">About Plaquer</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and explore London's rich history through its blue plaques and historical markers.
          </p>
        </div>
        
        <div className="space-y-12">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              Plaquer was created with a simple mission: to connect people with the rich history that surrounds them in their daily lives. London's blue plaques mark the homes and workplaces of significant historical figures, but many of these stories remain hidden in plain sight.
            </p>
            <p className="text-gray-700 mb-4">
              We believe that history becomes more meaningful when it's personal. By helping you discover, track, and share these historical markers, we hope to make London's past come alive in a way that's engaging and accessible for everyone.
            </p>
          </section>
          
          {/* How It Works Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How Plaquer Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">1</div>
                <h3 className="text-lg font-semibold mb-2">Discover</h3>
                <p className="text-gray-600">Find blue plaques near you or search for specific historical figures and locations.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">2</div>
                <h3 className="text-lg font-semibold mb-2">Collect</h3>
                <p className="text-gray-600">Create themed collections or track which plaques you've visited in person.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">3</div>
                <h3 className="text-lg font-semibold mb-2">Share</h3>
                <p className="text-gray-600">Share your discoveries and collections with friends and fellow history enthusiasts.</p>
              </div>
            </div>
          </section>
          
          {/* Data Sources Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Data</h2>
            <p className="text-gray-700 mb-4">
              Plaquer's database includes information from various official sources, including English Heritage, the London Borough councils, and other historical organizations. We work to ensure our information is accurate and up-to-date.
            </p>
            <p className="text-gray-700 mb-4">
              We also welcome contributions from our community. If you notice missing information or have photos of plaques to share, please let us know.
            </p>
          </section>
          
          {/* Our Team Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">The Team</h2>
            <p className="text-gray-700 mb-4">
              Plaquer was created by a small team of history enthusiasts and developers who share a passion for making history accessible and engaging. We're based in London and are constantly exploring the city to add new plaques to our database.
            </p>
          </section>
          
          {/* Contact Section */}
          <section className="bg-blue-50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-6">
              Have questions, suggestions, or want to contribute to Plaquer? We'd love to hear from you!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="flex items-center gap-2">
                <Mail size={16} /> Contact Us
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Github size={16} /> GitHub
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Twitter size={16} /> Twitter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Linkedin size={16} /> LinkedIn
              </Button>
            </div>
          </section>
        </div>
      </main>
    </PageContainer>
  );
};

export default About;