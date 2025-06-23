import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  label = 'Voltar',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleBack}
      className={`flex items-center text-gray-600 hover:text-gray-900 p-2 ${className}`}
    >
      <ArrowLeft size={16} className="mr-2" />
      {label}
    </Button>
  );
}; 