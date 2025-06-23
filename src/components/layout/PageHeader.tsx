import React from 'react';
import { usePageInfo } from './Breadcrumbs';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title: customTitle, 
  subtitle: customSubtitle, 
  children 
}) => {
  const pageInfo = usePageInfo();
  
  const title = customTitle || pageInfo.title;
  const subtitle = customSubtitle || pageInfo.subtitle;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}; 