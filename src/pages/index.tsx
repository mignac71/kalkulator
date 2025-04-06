import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Dodano import RadioGroup
import { Calculator } from "lucide-react";

// Typ dla nawierzchni
type SurfaceType = 'asphalt' | 'grass';

export default function Home() {
  // Stany dla pól wejściowych kalkulatora
  const [weight, setWeight] = useState(''); // Masa [kg]
  const [temperature, setTemperature] = useState(''); // Temperatura [°C]
  const [altitude, setAltitude] = useState(''); // Wysokość lotniska [stopy]
  const [wind, setWind] = useState(''); // Składowa czołowa wiatru [węzły]
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('asphalt'); // NOWY STAN: typ nawierzchni

  // Stan dla wyniku obliczeń i błędów
  const [takeoffDistance, setTakeoffDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Funkcja obsługująca obliczenia (z uwzględnieniem nawierzchni)
  const handleCalculate = () => {
    setError(null);
    setTakeoffDistance(null);

    // Parsowanie wartości wejściowych
    const numWeight = parseFloat(weight);
    const numTemperature = parseFloat(temperature);
    const numAltitude = parseFloat(altitude);
    const numWind = parseFloat(wind);

    // Podstawowa walidacja
    if (isNaN(numWeight) || isNaN(numTemperature) || isNaN(numAltitude) || isNaN(numWind)) {
      setError("Proszę wypełnić wszystkie pola poprawnymi liczbami.");
      return;
    }
    if (numWeight < 960) {
       setError("Masa poniżej minimalnej wartości z tabel (960 kg). Wyniki mogą być niemiarodajne.");
    }
     if (numWeight <= 0) {
       setError("Masa musi być wartością dodatnią.");
       return;
     }
    if (numAltitude < 0) {
        setError("Wysokość lotniska nie może być ujemna.");
        return;
    }

    // --- POCZĄTEK UPROSZCZONEJ LOGIKI OBLICZENIOWEJ ---
    let baseDistance = 418; // Dystans bazowy

    // Korekta - Masa (waga^2)
    const weightRatio = numWeight / 960;
    if (weightRatio <= 0) { setError("Stosunek masy jest nieprawidłowy."); return; }
    const weightFactor = weightRatio * weightRatio;
    if (isNaN(weightFactor)) { setError("Nie można obliczyć współczynnika masy."); return; }
    baseDistance *= weightFactor;

    // Korekta - Temperatura
    const tempFactor = (1 + (numTemperature - 15) * 0.01);
    baseDistance *= tempFactor;

    // Korekta - Wysokość (+18% / 1000 ft)
    const altFactor = (1 + (numAltitude / 1000) * 0.18);
    baseDistance *= altFactor;

    // Korekta - Wiatr (Addytywna: -10m/kts HW, +20m/kts TW)
    let windAdjustment = 0;
    if (numWind > 0) { windAdjustment = -10 * numWind; }
    else if (numWind < 0) { windAdjustment = -20 * numWind; }
    baseDistance += windAdjustment;

    // Upewnijmy się, że dystans ma minimum 355m
    let distanceBeforeSurface = Math.max(355, baseDistance);

    // NOWA KOREKTA - Nawierzchnia (+10% dla trawy)
    let finalDistance = distanceBeforeSurface;
    if (surfaceType === 'grass') {
        finalDistance *= 1.10; // Dodaj 10% do obliczonego dystansu
    }

    // --- KONIEC UPROSZCZONEJ LOGIKI OBLICZENIOWEJ ---

    setTakeoffDistance(Math.round(finalDistance)); // Zaokrąglenie końcowego wyniku
  };

  // Renderowanie komponentu
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <section id="calculator" className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Calculator className="h-7 w-7" />
              Kalkulator Drogi Startowej dla Tecnam P2010 215KM (v4)
            </CardTitle>
             <p className="text-sm text-muted-foreground pt-1">
               Model skalowany orientacyjnie wg. danych: 960kg -> 355m (0°C, 0ft, 0kts, asfalt). Uwzględnia nawierzchnię.
             </p>
            <p className="text-sm text-destructive pt-2">
              Uwaga: Wyniki są jedynie szacunkowe i nie mogą zastąpić oficjalnych tabel osiągów samolotu! Wzory są bardzo uproszczone.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Siatka z polami numerycznymi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Masa startowa (kg) [Min. 960/Max. 1160]</Label>
                <Input id="weight" type="number" placeholder="np. 960" value={weight} onChange={(e) => setWeight(e.target.value)} aria-label="Masa startowa w kilogramach, minimum 960" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura powietrza (°C)</Label>
                <Input id="temperature" type="number" placeholder="np. 0" value={temperature} onChange={(e) => setTemperature(e.target.value)} aria-label="Temperatura powietrza w stopniach Celsjusza" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altitude">Wysokość lotniska (stopy)</Label>
                <Input id="altitude" type="number" placeholder="np. 0" value={altitude} onChange={(e) => setAltitude(e.target.value)} aria-label="Wysokość lotniska nad poziomem morza w stopach" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wind">Składowa czołowa wiatru (węzły)</Label>
                <Input id="wind" type="number" placeholder="np. 0 (ujemna dla wiatru w plecy)" value={wind} onChange={(e) => setWind(e.target.value)} aria-label="Składowa czołowa wiatru w węzłach" />
              </div>
            </div>

            {/* NOWY ELEMENT: Wybór nawierzchni */}
            <div className="space-y-3 pt-2">
                <Label className="text-base">Nawierzchnia Pasa</Label>
                <RadioGroup
                    defaultValue="asphalt"
                    value={surfaceType}
                    onValueChange={(value: SurfaceType) => setSurfaceType(value)} // Aktualizacja stanu
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4" // Układ dla różnych ekranów
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asphalt" id="r1" />
                        <Label htmlFor="r1">Asfaltowa / Utwardzona</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="grass" id="r2" />
                        <Label htmlFor="r2">Trawiasta (+10% do dystansu)</Label>
                    </div>
                </RadioGroup>
            </div>


            {/* Przycisk */}
            <Button size="lg" onClick={handleCalculate} className="w-full sm:w-auto mt-4"> {/* Dodano mały margines górny */}
              Oblicz Drogę Startową
            </Button>

            {/* Błąd */}
            {error && (
              <p className="text-destructive text-center font-medium">{error}</p>
            )}

            {/* Wynik */}
            {takeoffDistance !== null && !error && (
              <div className="mt-6 rounded-lg border bg-muted p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Szacowana droga startowa nad przeszkodę ({surfaceType === 'grass' ? 'trawa' : 'asfalt'}):
                </p>
                <p className="text-3xl font-bold text-primary">
                  {takeoffDistance} metrów
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

