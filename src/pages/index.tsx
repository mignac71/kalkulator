import { useState, useEffect } from 'react'; // Dodano useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Usunięto import Input
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider"; // Dodano import Slider
import { Calculator, AlertTriangle } from "lucide-react";

// Typ dla nawierzchni
type SurfaceType = 'asphalt' | 'grass';

export default function Home() {
  // Stany dla wartości z suwaków (teraz jako liczby) i typu nawierzchni
  // Zmieniono domyślne wartości i typy stanów na number
  const [weight, setWeight] = useState<number>(960); // Masa [kg] (domyślnie min z poprzedniej logiki)
  const [temperature, setTemperature] = useState<number>(0); // Temperatura [°C] (domyślnie 0)
  const [altitude, setAltitude] = useState<number>(0); // Wysokość lotniska [stopy] (domyślnie 0)
  const [wind, setWind] = useState<number>(0); // Składowa czołowa wiatru [węzły] (domyślnie 0)
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('asphalt'); // typ nawierzchni

  // Stan dla wyniku obliczeń, błędów i ostrzeżeń
  const [takeoffDistance, setTakeoffDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Funkcja obsługująca obliczenia (teraz używa bezpośrednio stanów liczbowych)
  const handleCalculate = () => {
    setError(null);
    setWarning(null);
    setTakeoffDistance(null);

    // Wartości są już liczbami, nie trzeba parsować
    const numWeight = weight;
    const numTemperature = temperature;
    const numAltitude = altitude;
    const numWind = wind;

    // Walidacja (błędy krytyczne)
     if (numWeight <= 0) { // Ten warunek jest teraz mniej prawdopodobny przy suwaku, ale zostawiam dla pewności
       setError("Masa musi być wartością dodatnią.");
       return;
     }
    // Nie ma potrzeby sprawdzać isNaN na początku, bo stany są liczbami
    // Sprawdzenie wysokości < 0 też jest zbędne przy suwaku z min=0

    // Walidacja zakresu masy (ostrzeżenia)
    if (numWeight < 960) {
       setWarning("Ostrzeżenie: Masa poniżej 'typowej' minimalnej (960 kg). Wyniki mogą być mniej dokładne w tym zakresie.");
       // Obliczenia idą dalej
    }
     // Sprawdzenie dla 1160kg zostaje, mimo że suwak idzie do 1200kg
    if (numWeight > 1160) {
        setWarning("Ostrzeżenie: Masa przekracza 'typową' maksymalną (1160 kg). Wyniki mogą być mniej dokładne w tym zakresie.");
        // Obliczenia idą dalej
    }


    // --- POCZĄTEK UPROSZCZONEJ LOGIKI OBLICZENIOWEJ ---
    let baseDistance = 418; // Dystans bazowy (może wymagać dostosowania, jeśli 418 było powiązane ściśle z 960kg jako absolutnym minimum)

    // Korekta - Masa (waga^2) - używa 960kg jako punktu odniesienia skali
    const weightRatio = numWeight / 960;
    const weightFactor = weightRatio * weightRatio;
    // Sprawdzenie NaN na wszelki wypadek, gdyby numWeight było 0 lub ujemne (chociaż suwak tego pilnuje)
    if (isNaN(weightFactor) || weightFactor <= 0) {
        setError("Nie można obliczyć współczynnika masy.");
        return;
    }
    baseDistance *= weightFactor;

    // Korekta - Temperatura
    const tempFactor = (1 + (numTemperature - 15) * 0.01); // Odniesienie do 15°C ISA
    baseDistance *= tempFactor;

    // Korekta - Wysokość (+18% / 1000 ft)
    // Zabezpieczenie przed dzieleniem przez 0 lub ujemną wysokością (chociaż suwak pilnuje)
    if (numAltitude >= 0) {
        const altFactor = (1 + (numAltitude / 1000) * 0.18);
        baseDistance *= altFactor;
    }

    // Korekta - Wiatr (Addytywna: -10m/kts HW, +20m/kts TW)
    let windAdjustment = 0;
    if (numWind > 0) { windAdjustment = -10 * numWind; }
    else if (numWind < 0) { windAdjustment = -20 * numWind; } // numWind jest ujemne, więc -20 * (-wart) da dodatnią korektę
    baseDistance += windAdjustment;

    // Upewnijmy się, że dystans ma minimum 355m (bazowe minimum dla określonych warunków)
    // To minimum może wymagać weryfikacji w kontekście zmienionego zakresu masy suwaka
    const distanceBeforeSurface = Math.max(355, baseDistance);

    // KOREKTA - Nawierzchnia (+10% dla trawy)
    let finalDistance = distanceBeforeSurface;
    if (surfaceType === 'grass') {
        finalDistance *= 1.10;
    }

    // --- KONIEC UPROSZCZONEJ LOGIKI OBLICZENIOWEJ ---

    if (isNaN(finalDistance) || finalDistance < 0) { // Dodano sprawdzenie < 0
        setError("Wystąpił błąd podczas obliczeń lub wynik jest nierealistyczny. Sprawdź parametry.");
        setTakeoffDistance(null); // Upewnij się, że nie ma wyniku przy błędzie
        return;
    }

    setTakeoffDistance(Math.round(finalDistance));
  };

  // Dodano useEffect do automatycznego przeliczania przy zmianie wartości suwaków lub nawierzchni
  useEffect(() => {
    handleCalculate();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight, temperature, altitude, wind, surfaceType]); // Uruchom ponownie, gdy zmieni się którakolwiek z tych wartości


  // Renderowanie komponentu
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <section id="calculator" className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Calculator className="h-7 w-7" />
              Kalkulator Drogi Startowej dla Tecnam P2010 215KM (v6 - Suwaki) {/* Zmieniono wersję */}
            </CardTitle>
             <p className="text-sm text-muted-foreground pt-1">
               Interaktywny model szacunkowy wykorzystujący suwaki do ustawienia parametrów.
             </p>
            <p className="text-sm text-destructive pt-2">
              Uwaga: Wyniki są jedynie szacunkowe i nie mogą zastąpić oficjalnych tabel osiągów samolotu! Wzory są bardzo uproszczone.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 p-6"> {/* Zwiększono nieco odstępy między grupami */}
            {/* Grupy z suwakami */}
            <div className="space-y-4"> {/* Kontener na suwak masy */}
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="weight-slider" className="text-base">Masa startowa (kg)</Label>
                <span className="font-semibold text-primary text-lg">{weight} kg</span> {/* Wyświetlanie aktualnej wartości */}
              </div>
              <Slider
                id="weight-slider"
                min={900}
                max={1200}
                step={10}
                value={[weight]} // Wartość musi być tablicą
                onValueChange={(value) => setWeight(value[0])} // Bierzemy pierwszy element tablicy
                aria-label="Masa startowa w kilogramach"
              />
            </div>

            <div className="space-y-4"> {/* Kontener na suwak temperatury */}
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="temperature-slider" className="text-base">Temperatura powietrza (°C)</Label>
                <span className="font-semibold text-primary text-lg">{temperature}°C</span>
              </div>
              <Slider
                id="temperature-slider"
                min={-20}
                max={30}
                step={1}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
                aria-label="Temperatura powietrza w stopniach Celsjusza"
              />
            </div>

            <div className="space-y-4"> {/* Kontener na suwak wysokości */}
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="altitude-slider" className="text-base">Wysokość lotniska (ft)</Label>
                <span className="font-semibold text-primary text-lg">{altitude} ft</span>
              </div>
              <Slider
                id="altitude-slider"
                min={0}
                max={6000}
                step={500}
                value={[altitude]}
                onValueChange={(value) => setAltitude(value[0])}
                aria-label="Wysokość lotniska nad poziomem morza w stopach"
              />
            </div>

             <div className="space-y-4"> {/* Kontener na suwak wiatru */}
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="wind-slider" className="text-base">Składowa wiatru (kts)</Label>
                <span className="font-semibold text-primary text-lg">
                    {wind > 0 ? `+${wind} (czołowy)` : (wind < 0 ? `${wind} (tylny)`: "0")}
                </span> {/* Lepsze formatowanie wiatru */}
              </div>
              <Slider
                id="wind-slider"
                min={-5} // Wiatr tylny
                max={20} // Wiatr czołowy
                step={1}
                value={[wind]}
                onValueChange={(value) => setWind(value[0])}
                aria-label="Składowa czołowa wiatru w węzłach (ujemna dla wiatru w plecy)"
              />
            </div>


            {/* Wybór nawierzchni (bez zmian) */}
            <div className="space-y-3 pt-2">
                <Label className="text-base">Nawierzchnia Pasa</Label>
                <RadioGroup
                    defaultValue="asphalt"
                    value={surfaceType}
                    onValueChange={(value: SurfaceType) => setSurfaceType(value)}
                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
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


            {/* Usunięto przycisk "Oblicz", obliczenia są automatyczne */}
            {/* <Button size="lg" onClick={handleCalculate} className="w-full sm:w-auto mt-4">
              Oblicz Drogę Startową
            </Button> */}

            {/* Ostrzeżenie (jeśli występuje) */}
            {warning && (
              <p className="mt-4 flex items-center justify-center gap-2 text-center font-medium text-orange-600">
                 <AlertTriangle className="h-5 w-5 flex-shrink-0" /> {warning} {/* Dodano flex-shrink-0 */}
              </p>
            )}

            {/* Błąd krytyczny (jeśli występuje) */}
            {error && (
              <p className="mt-4 text-destructive text-center font-medium">{error}</p>
            )}

            {/* Wynik (automatycznie aktualizowany) */}
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
             {/* Dodano informację o automatycznym przeliczaniu */}
             <p className="text-xs text-center text-muted-foreground mt-4">
                Wynik aktualizuje się automatycznie po zmianie parametrów.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
