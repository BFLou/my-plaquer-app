import { MapPin, ArrowUpRight } from 'lucide-react';
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
          <div className="flex justify-between items-center">
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="md:w-1/3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <MapPin className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold text-blue-600">Plaquer</span>
            </div>
            <p className="text-gray-600">
              Discover and track historical plaques throughout London and beyond. Share your visits and build your collection of historical sites.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Navigation</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
                <li><Link to="/discover" className="text-gray-600 hover:text-blue-600">Discover</Link></li>
                <li><Link to="/collections" className="text-gray-600 hover:text-blue-600">Collections</Link></li>
                <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
              </ul>
            </div>
            

          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Plaquer. All rights reserved.</p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100">
              <ArrowUpRight size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100">
              <ArrowUpRight size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100">
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;