import { GraduationCap, Heart, Users, Droplets, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const halfPriceCategories = [
  {
    icon: GraduationCap,
    title: "Estudantes",
    description: "Alunos de ensino médio, técnico, superior e pós-graduação",
    requirements: [
      "Carteira de estudante válida",
      "Documento de matrícula atual",
      "RG ou CNH para comprovação"
    ]
  },
  {
    icon: Heart,
    title: "Idosos",
    description: "Pessoas com 60 anos ou mais",
    requirements: [
      "RG ou CNH",
      "Comprovante de idade",
      "Meia-entrada garantida por lei"
    ]
  },
  {
    icon: Users,
    title: "Pessoas com Deficiência",
    description: "PCDs e um acompanhante",
    requirements: [
      "Laudo médico",
      "Cartão de benefício",
      "RG ou documento oficial"
    ]
  },
  {
    icon: Droplets,
    title: "Doadores de Sangue",
    description: "Doadores regulares de sangue",
    requirements: [
      "Carteira de doador",
      "Comprovante de doação (últimos 12 meses)",
      "RG ou documento oficial"
    ]
  }
];

export const HalfPriceInfo = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-t from-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-red-600/20 to-yellow-600/20 rounded-full mb-6">
            <Heart className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Meia-Entrada
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Conheça quem tem direito ao benefício da meia-entrada e a documentação necessária
          </p>
        </div>

        <Alert className="mb-8 bg-red-900/20 border-red-500/30">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-100">
            <strong>Importante:</strong> A apresentação da documentação é obrigatória na entrada do evento. 
            Não será aceita apenas a foto dos documentos.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {halfPriceCategories.map((category, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <div className="p-2 bg-gradient-to-r from-red-600/20 to-yellow-600/20 rounded-lg mr-3">
                    <category.icon className="h-6 w-6 text-yellow-400" />
                  </div>
                  {category.title}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-300 mb-3">Documentos aceitos:</h4>
                  <ul className="space-y-2">
                    {category.requirements.map((req, reqIndex) => (
                      <li key={reqIndex} className="flex items-center text-gray-200 text-sm">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-red-900/20 to-yellow-900/20 border-yellow-400/30">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Shield className="mr-3 h-6 w-6 text-yellow-400" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
              <div>
                <h4 className="font-semibold text-yellow-300 mb-3">Sobre os Documentos:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Documentos devem estar em perfeito estado de conservação
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Não serão aceitas cópias ou fotos dos documentos
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Carteiras estudantis devem estar dentro da validade
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-300 mb-3">Direitos e Deveres:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    O benefício é pessoal e intransferível
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Benefício garantido pela Lei Federal 12.933/2013
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    Em caso de dúvidas, procure nossa equipe no local
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};