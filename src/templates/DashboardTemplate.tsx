import React from 'react';

interface DashboardTemplateProps {
  sidebar: React.ReactNode;
  viewport: React.ReactNode;
  modal?: React.ReactNode;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ sidebar, viewport, modal }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 relative">
      {sidebar}
      {viewport}
      {modal}
    </div>
  );
};
