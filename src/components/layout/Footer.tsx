// src/components/layout/Footer.tsx
import { MapPin, ArrowUpRight, Github, Mail, Twitter, Info, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

type FooterProps = {
  simplified?: boolean;
};

export const Footer = ({ simplified = false }: FooterProps) => {
  if (simplified) {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center gap-y-4">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Plaquer. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Link to="/about" className="text-gray-600 hover:text-blue-600 text-sm">About</Link>
              <span className="text-gray-300">•</span>
              <Link to="/privacy" className="text-gray-600 hover:text-blue-600 text-sm">Privacy</Link>
              <span className="text-gray-300">•</span>
              <Link to="/terms" className="text-gray-600 hover:text-blue-600 text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First column - About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <MapPin className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold text-blue-600">Plaquer</span>
            </div>
            <p className="text-gray-600 mb-4">
              Discover and track historical plaques throughout London and beyond. Share your visits and build your collection of historical sites.
            </p>
            <p className="text-sm text-gray-500">
              Helping history enthusiasts discover the stories behind London's iconic plaques since 2023.
            </p>
          </div>
          
          {/* Second column - Navigation links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3">Navigation</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
                <li><Link to="/discover" className="text-gray-600 hover:text-blue-600">Discover</Link></li>
                <li><Link to="/collections" className="text-gray-600 hover:text-blue-600">Collections</Link></li>
                <li><Link to="/profile" className="text-gray-600 hover:text-blue-600">My Profile</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                <li><Link to="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
                <li><Link to="/help" className="text-gray-600 hover:text-blue-600">Help Center</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Third column - Newsletter and contact */}
          <div>
            <h3 className="font-semibold mb-3">Stay Connected</h3>
            <p className="text-gray-600 mb-4">
              Join our community of history enthusiasts and get updates on new features and historical plaques.
            </p>
            <div className="flex gap-2 mb-6">
              <input 
                type="email" 
                placeholder="Your email" 
                className="border border-gray-300 rounded-md px-3 py-2 flex-grow text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section with copyright and social links */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Plaquer. All rights reserved.</p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600"
              onClick={() => window.open('https://github.com/plaquer', '_blank')}
              title="GitHub"
            >
              <Github size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600"
              onClick={() => window.open('https://twitter.com/plaquer', '_blank')}
              title="Twitter"
            >
              <Twitter size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600"
              onClick={() => window.location.href = 'mailto:contact@plaquer.app'}
              title="Email"
            >
              <Mail size={18} />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;