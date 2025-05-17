// src/components/plaques/SavedRoutes.tsx
import React, { useState, useEffect } from 'react';
import { useRoutes, RouteData } from '../../hooks/useRoutes';
import { useAuth } from '../../hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Button } from "../ui/button";
import { 
  ChevronRight, 
  Trash, 
  Share2, 
  Map, 
  Route as RouteIcon,
  Calendar
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Plaque } from '../../types/plaque';

// Rest of the file remains the same