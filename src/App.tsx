import { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, StopCircle, Eraser, FileText } from "lucide-react";
import { jsPDF } from 'jspdf';

function App() {
  const [text, setText] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const ptBrVoices = availableVoices.filter(voice => voice.lang === 'pt-BR');
      setVoices(ptBrVoices);

      if (ptBrVoices.length > 0) {
        if (!selectedVoice || !ptBrVoices.some(v => v.name === selectedVoice)) {
          setSelectedVoice(ptBrVoices[0].name);
        }
      } else {
        setSelectedVoice(null);
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!text || !selectedVoice) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);

    if (voice) {
      utterance.voice = voice;
    } else {
      const ptBrFallback = voices.find(v => v.lang === 'pt-BR');
      if (ptBrFallback) {
        utterance.voice = ptBrFallback;
        setSelectedVoice(ptBrFallback.name);
      } else {
        alert('Nenhuma voz de português do Brasil disponível. Por favor, verifique as configurações do seu navegador.');
        return;
      }
    }

    utterance.rate = rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
      alert('Ocorreu um erro ao tentar ler o texto. Por favor, tente novamente ou verifique as configurações de voz do seu navegador.');
    };

    window.speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
  };

  const handleStop = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleClear = () => {
    setText("");
    handleStop();
  };

  const handleSaveAsPdf = () => {
    console.log("handleSaveAsPdf: Função chamada!");
    if (!text) {
      alert("Não há texto para salvar.");
      console.log("handleSaveAsPdf: Texto vazio, abortando.");
      return;
    }

    try {
      const doc = new jsPDF();
      console.log("handleSaveAsPdf: Instância jsPDF criada.", doc);

      const margin = 10;
      const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;
      const lineHeight = 7;

      doc.setFontSize(22);
      doc.text("Texto do Leitor de Texto (Português BR)", margin, margin + 5);

      doc.setLineWidth(0.5);
      doc.line(margin, margin + 15, doc.internal.pageSize.getWidth() - margin, margin + 15);

      doc.setFontSize(12);
      const textLines = doc.splitTextToSize(text, maxWidth);
      let y = margin + 25;

      for (let i = 0; i < textLines.length; i++) {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(textLines[i], margin, y);
        y += lineHeight;
      }

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Gerado por Leitor de Texto (Português BR) - by Murillo Matos", margin, doc.internal.pageSize.getHeight() - margin);

      console.log("handleSaveAsPdf: Gerando Data URL para download...");
      const pdfDataUri = doc.output('datauri');

      const link = document.createElement('a');
      link.href = pdfDataUri as unknown as string; // Alterado para 'as unknown as string'
      link.download = "texto_lido.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("handleSaveAsPdf: Download do PDF acionado via Data URL.");
    } catch (error) {
      console.error("handleSaveAsPdf: Erro ao gerar ou salvar PDF:", error);
      alert("Ocorreu um erro ao tentar salvar o PDF. Por favor, tente novamente.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundImage: `linear-gradient(to bottom right, #000000, #B8860B)` }}
    >
      <Card className="w-full max-w-2xl z-10 bg-white/90 dark:bg-gray-900/90 shadow-2xl rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
        <CardHeader className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Leitor de Texto (Português BR)
          </CardTitle>
          <CardDescription className="text-md text-gray-600 dark:text-gray-300 mt-2">
            Digite ou cole seu texto para ouvi-lo em português do Brasil.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="voice-select" className="text-lg font-semibold text-gray-800 dark:text-gray-200">Voz</Label>
                <Select value={selectedVoice || ''} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                    {voices.length > 0 ? (
                      voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name} className="dark:text-white hover:bg-gray-700">
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-voices" disabled>
                        Nenhuma voz de pt-BR disponível.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rate-slider" className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Velocidade: {rate.toFixed(1)}x
                </Label>
                <Slider
                  id="rate-slider"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[rate]}
                  onValueChange={(val) => setRate(val[0])}
                  className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-blue-200 dark:[&>span:first-child]:bg-blue-800 [&>span:last-child]:bg-blue-500 dark:[&>span:last-child]:bg-blue-600"
                />
              </div>
            </div>

            <div className="grid gap-2 flex items-end">
              <Button
                onClick={handleSaveAsPdf}
                disabled={!text}
                variant="outline"
                className="w-full py-3 text-lg font-bold border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20 shadow-lg transition-transform transform hover:-translate-y-1 active:scale-95"
              >
                <FileText className="mr-2 h-5 w-5" />
                Salvar como PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text-input" className="text-lg font-semibold text-gray-800 dark:text-gray-200">Seu Texto</Label>
            <Textarea
              id="text-input"
              placeholder="Digite seu texto aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] text-base resize-y border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleSpeak}
              disabled={!text || isSpeaking || voices.length === 0}
              className="flex-1 py-3 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform transform hover:-translate-y-1 active:scale-95"
            >
              <Volume2 className="mr-2 h-5 w-5" />
              {isSpeaking ? "Lendo..." : "Ler Texto"}
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isSpeaking}
              variant="outline"
              className="flex-1 py-3 text-lg font-bold border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 shadow-lg transition-transform transform hover:-translate-y-1 active:scale-95"
            >
              <StopCircle className="mr-2 h-5 w-5" />
              Parar
            </Button>
            <Button
              onClick={handleClear}
              disabled={!text && !isSpeaking}
              variant="outline"
              className="flex-1 py-3 text-lg font-bold border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-800/20 shadow-lg transition-transform transform hover:-translate-y-1 active:scale-95"
            >
              <Eraser className="mr-2 h-5 w-5" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-gray-200 dark:text-gray-400 text-sm z-10">
        <p>by: Murillo Matos</p>
      </footer>
    </div>
  );
}

export default App;
