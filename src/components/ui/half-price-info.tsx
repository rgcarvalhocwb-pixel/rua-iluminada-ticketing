import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, User, Heart, AlertCircle } from "lucide-react";

export const HalfPriceInfo = () => {
  const halfPriceCategories = [
    {
      icon: GraduationCap,
      title: "Estudantes",
      description: "Estudantes regularmente matriculados",
      requirements: [
        "Carteira de estudante válida",
        "Documento oficial da instituição",
        "Comprovante de matrícula"
      ]
    },
    {
      icon: User,
      title: "Idosos",
      description: "Pessoas com 60 anos ou mais",
      requirements: [
        "Documento oficial com foto",
        "RG, CNH ou Passaporte"
      ]
    },
    {
      icon: Heart,
      title: "Pessoas com Deficiência",
      description: "PCDs e acompanhante (quando necessário)",
      requirements: [
        "Laudo médico ou cartão de benefício",
        "Documento oficial com foto",
        "Acompanhante tem direito a meia-entrada"
      ]
    },
    {
      icon: Users,
      title: "Doadores de Sangue",
      description: "Doadores regulares de sangue",
      requirements: [
        "Carteira de doador de sangue",
        "Comprovante de doação (últimos 12 meses)"
      ]
    }
  ];

  return (
    <section className="py-16 px-4 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            Meia-Entrada
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Confira quem tem direito ao benefício da meia-entrada
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <AlertCircle className="w-5 h-5 text-accent" />
            <p className="text-sm text-muted-foreground">
              Documentação obrigatória na entrada do evento
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {halfPriceCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border shadow-soft hover:shadow-green-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Documentos aceitos:
                    </p>
                    {category.requirements.map((req, reqIndex) => (
                      <div key={reqIndex} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                        <span className="text-sm">{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-accent">
                Importante
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• A documentação deve ser apresentada na entrada do evento</li>
                <li>• Documentos digitais são aceitos apenas se oficiais (ex: CNH Digital)</li>
                <li>• O benefício é pessoal e intransferível</li>
                <li>• Crianças até 5 anos não pagam (limitado a 1 criança por adulto pagante)</li>
                <li>• A meia-entrada é um direito garantido por lei</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};