import React from 'react';

export const DeveloperFooter = () => {
  return (
    <footer className="fixed bottom-4 right-4 z-10">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/10d01d52-98a0-49ca-8998-cb4e08a733c4.png" 
          alt="Rayzer Tecnologia" 
          className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          title="Desenvolvido por Rayzer Tecnologia"
        />
      </div>
    </footer>
  );
};