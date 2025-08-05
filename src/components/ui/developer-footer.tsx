import React from 'react';

export const DeveloperFooter = () => {
  return (
    <footer className="fixed bottom-0 left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div className="flex items-center gap-3 p-3 text-xs text-muted-foreground">
        <img 
          src="/lovable-uploads/f7cfeceb-dbd8-4283-a15e-b8dbb0a257ad.png" 
          alt="Rayzer Tecnologia" 
          className="h-8 w-auto"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground">RAYZER SERVIÇOS E TECNOLOGIA LTDA</span>
          <span>CNPJ: 14.073.521/0001-83</span>
          <span>Rua Cel. Hoche Pedra Pires n.º 337 Seminário – Curitiba – Paraná</span>
          <span>Fone: (41) 99937-2241</span>
        </div>
      </div>
    </footer>
  );
};